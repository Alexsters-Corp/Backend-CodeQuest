const bcrypt = require('bcryptjs')
const { AppError } = require('@codequest/shared')
const { extractBearerToken } = require('@codequest/shared')
const { hashToken, newRawToken } = require('../utils/tokenHash')

class AuthService {
  constructor({
    userRepository,
    authTokenRepository,
    tokenBlacklistRepository,
    schemaGuardService,
    emailService,
    jwtToolkit,
  }) {
    this.userRepository = userRepository
    this.authTokenRepository = authTokenRepository
    this.tokenBlacklistRepository = tokenBlacklistRepository
    this.schemaGuardService = schemaGuardService
    this.emailService = emailService
    this.jwtToolkit = jwtToolkit
  }

  async register({ nombre, email, password }) {
    await this.schemaGuardService.assertReady()

    const existing = await this.userRepository.findByEmail(email)
    if (existing) {
      throw AppError.conflict('El email ya esta registrado.', 'EMAIL_ALREADY_REGISTERED')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await this.userRepository.createUser({
      name: nombre,
      email,
      passwordHash,
    })

    await this.#createAndSendVerifyEmailToken(user)

    return {
      user: {
        id: user.id,
        nombre: user.name,
        email: user.email,
        email_verificado: Boolean(user.is_email_verified),
      },
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email }),
      refreshToken: this.jwtToolkit.signRefreshToken({ id: user.id }),
    }
  }

  async login({ email, password }) {
    await this.schemaGuardService.assertReady()

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw AppError.unauthorized('Credenciales incorrectas.')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw AppError.unauthorized('Credenciales incorrectas.')
    }

    await this.userRepository.touchLastLogin(user.id)

    return {
      user: {
        id: user.id,
        nombre: user.name,
        email: user.email,
        email_verificado: Boolean(user.is_email_verified),
      },
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email }),
      refreshToken: this.jwtToolkit.signRefreshToken({ id: user.id }),
    }
  }

  async refresh({ refreshToken }) {
    await this.schemaGuardService.assertReady()

    let decoded
    try {
      decoded = this.jwtToolkit.verifyRefreshToken(refreshToken)
    } catch (_error) {
      throw AppError.unauthorized('Refresh token invalido o expirado.')
    }

    const user = await this.userRepository.findById(decoded.id)
    if (!user) {
      throw AppError.unauthorized('Usuario no encontrado.')
    }

    return {
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email }),
    }
  }

  async logout({ req }) {
    await this.schemaGuardService.assertReady()

    const token = extractBearerToken(req)
    if (!token) {
      throw AppError.unauthorized('Token de autenticacion requerido.')
    }

    let decoded
    try {
      decoded = this.jwtToolkit.verifyAccessToken(token)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return
      }

      throw AppError.unauthorized('Token invalido.')
    }

    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000)

    await this.tokenBlacklistRepository.revokeToken({
      token,
      userId: decoded.id,
      expiresAt,
    })
  }

  async forgotPassword({ email }) {
    await this.schemaGuardService.assertReady()

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return
    }

    const rawToken = newRawToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await this.authTokenRepository.createToken({
      userId: user.id,
      tokenHash,
      tokenType: 'reset_password',
      expiresAt,
    })

    this.emailService.sendPasswordReset({ email: user.email, rawToken }).catch((error) => {
      console.error('[AuthService] Error enviando correo de recuperación:', error?.message || error)
    })
  }

  async resetPassword({ rawToken, newPassword }) {
    await this.schemaGuardService.assertReady()

    const tokenHash = hashToken(rawToken)
    const token = await this.authTokenRepository.findValidToken({
      tokenHash,
      tokenType: 'reset_password',
    })

    if (!token) {
      throw AppError.badRequest('El token de recuperacion es invalido o expiro.', 'INVALID_RESET_TOKEN')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await this.userRepository.updatePasswordById(token.user_id, passwordHash)
    await this.authTokenRepository.markTokenUsed(token.id)
  }

  async verifyEmail({ rawToken }) {
    await this.schemaGuardService.assertReady()

    const tokenHash = hashToken(rawToken)
    const token = await this.authTokenRepository.findValidToken({
      tokenHash,
      tokenType: 'verify_email',
    })

    if (!token) {
      throw AppError.badRequest('Token de verificacion invalido o expirado.', 'INVALID_VERIFY_TOKEN')
    }

    await this.userRepository.markEmailVerified(token.user_id)
    await this.authTokenRepository.markTokenUsed(token.id)
  }

  async getProfile({ userId }) {
    await this.schemaGuardService.assertReady()

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw AppError.notFound('Usuario no encontrado.')
    }

    return {
      id: user.id,
      nombre: user.name,
      email: user.email,
      email_verificado: Boolean(user.is_email_verified),
    }
  }

  async #createAndSendVerifyEmailToken(user) {
    const rawToken = newRawToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await this.authTokenRepository.createToken({
      userId: user.id,
      tokenHash,
      tokenType: 'verify_email',
      expiresAt,
    })

    this.emailService.sendVerifyEmail({
      email: user.email,
      rawToken,
    }).catch((error) => {
      console.error('[AuthService] Error enviando correo de verificación:', error?.message || error)
    })
  }
}

module.exports = AuthService
