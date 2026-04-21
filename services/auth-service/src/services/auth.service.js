const bcrypt = require('bcryptjs')
const {
  AppError,
  extractBearerToken,
  ROLE_ADMIN,
  normalizeRole,
  getPermissionsForRole,
} = require('@codequest/shared')
const { hashToken, newRawToken } = require('../utils/tokenHash')

function formatSqlDate(dateValue) {
  if (!dateValue) {
    return null
  }

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapUserPayload(user) {
  const role = normalizeRole(user.role)
  return {
    id: user.id,
    nombre: user.name,
    email: user.email,
    username: user.username || null,
    avatar: user.avatar_url || null,
    countryCode: user.country_code || null,
    birthDate: formatSqlDate(user.birth_date),
    role,
    permisos: getPermissionsForRole(role),
    email_verificado: Boolean(user.is_email_verified),
    is_active: Boolean(user.is_active),
  }
}

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

    const role = normalizeRole(user.role)

    return {
      user: mapUserPayload(user),
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email, role }),
      refreshToken: this.jwtToolkit.signRefreshToken({ id: user.id }),
    }
  }

  async login({ email, password }) {
    await this.schemaGuardService.assertReady()

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw AppError.unauthorized('Credenciales incorrectas.')
    }

    if (!user.is_active) {
      throw AppError.forbidden('Tu cuenta se encuentra desactivada.', 'ACCOUNT_DISABLED')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw AppError.unauthorized('Credenciales incorrectas.')
    }

    await this.userRepository.touchLastLogin(user.id)

    const role = normalizeRole(user.role)

    return {
      user: mapUserPayload(user),
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email, role }),
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

    const isRevoked = await this.tokenBlacklistRepository.isTokenRevoked(refreshToken)
    if (isRevoked) {
      throw AppError.unauthorized('Refresh token revocado.')
    }

    const user = await this.userRepository.findById(decoded.id)
    if (!user) {
      throw AppError.unauthorized('Usuario no encontrado.')
    }

    if (!user.is_active) {
      throw AppError.forbidden('Tu cuenta se encuentra desactivada.', 'ACCOUNT_DISABLED')
    }

    if (user.tokens_valid_after) {
      const validAfterTs = Math.floor(new Date(user.tokens_valid_after).getTime() / 1000)
      if (Number(decoded.iat) < validAfterTs) {
        throw AppError.unauthorized('Sesion invalidada. Por favor inicia sesion nuevamente.')
      }
    }

    const role = normalizeRole(user.role)

    return {
      accessToken: this.jwtToolkit.signAccessToken({ id: user.id, email: user.email, role }),
    }
  }

  async logout({ req, refreshToken }) {
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
        // Even if access token expired, still revoke refresh token if provided
        if (refreshToken) {
          await this.#revokeRefreshToken(refreshToken)
        }
        return
      }

      throw AppError.unauthorized('Token invalido.')
    }

    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000)

    await this.tokenBlacklistRepository.revokeToken({
      token,
      userId: decoded.id,
      expiresAt,
      tokenJti: typeof decoded.jti === 'string' ? decoded.jti : null,
    })

    if (refreshToken) {
      await this.#revokeRefreshToken(refreshToken)
    }
  }

  async #revokeRefreshToken(refreshToken) {
    let decodedRefresh
    try {
      decodedRefresh = this.jwtToolkit.verifyRefreshToken(refreshToken)
    } catch (_error) {
      return // Already expired or invalid — nothing to revoke
    }

    const expiresAt = decodedRefresh.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.tokenBlacklistRepository.revokeToken({
      token: refreshToken,
      userId: decodedRefresh.id,
      expiresAt,
      tokenJti: typeof decodedRefresh.jti === 'string' ? decodedRefresh.jti : null,
    })
  }

  async forgotPassword({ email }) {
    await this.schemaGuardService.assertReady()

    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return
    }

    await this.authTokenRepository.invalidatePreviousTokens({
      userId: user.id,
      tokenType: 'reset_password',
    })

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
    await this.userRepository.setTokensValidAfter(token.user_id, new Date())
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

    return mapUserPayload(user)
  }

  async updateProfile({ userId, nombre, email, username, avatar, countryCode, birthDate }) {
    await this.schemaGuardService.assertReady()

    const currentUser = await this.userRepository.findById(userId)
    if (!currentUser) {
      throw AppError.notFound('Usuario no encontrado.')
    }

    const existingWithEmail = await this.userRepository.findByEmail(email)
    if (existingWithEmail && Number(existingWithEmail.id) !== Number(userId)) {
      throw AppError.conflict('El email ya esta registrado.', 'EMAIL_ALREADY_REGISTERED')
    }

    const emailChanged = email && email.toLowerCase() !== currentUser.email.toLowerCase()

    const updatedUser = await this.userRepository.updateProfileById(userId, {
      name: nombre,
      email,
      username,
      avatarUrl: avatar,
      countryCode,
      birthDate,
      emailChanged,
    })

    return mapUserPayload(updatedUser)
  }

  async listUsers({ actorUserId, search, role, status, limit, offset }) {
    await this.schemaGuardService.assertReady()

    const actor = await this.userRepository.findById(actorUserId)
    if (!actor) {
      throw AppError.notFound('Usuario actor no encontrado.')
    }

    if (normalizeRole(actor.role) !== ROLE_ADMIN) {
      throw AppError.forbidden('Acceso denegado: permisos insuficientes.', 'INSUFFICIENT_ROLE')
    }

    const rows = await this.userRepository.listUsers({ search, role, status, limit, offset })
    return {
      users: rows.map((row) => ({
        id: Number(row.id),
        email: row.email,
        nombre: row.name,
        username: row.username,
        role: normalizeRole(row.role),
        is_active: Boolean(row.is_active),
        email_verificado: Boolean(row.email_verified),
        last_login_at: row.last_login_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    }
  }

  async updateUserRole({ actorUserId, targetUserId, role, isActive }) {
    await this.schemaGuardService.assertReady()

    const actor = await this.userRepository.findById(actorUserId)
    if (!actor) {
      throw AppError.notFound('Usuario actor no encontrado.')
    }

    if (normalizeRole(actor.role) !== ROLE_ADMIN) {
      throw AppError.forbidden('Acceso denegado: permisos insuficientes.', 'INSUFFICIENT_ROLE')
    }

    const target = await this.userRepository.findById(targetUserId)
    if (!target) {
      throw AppError.notFound('Usuario objetivo no encontrado.')
    }

    let normalizedRole
    if (role !== undefined) {
      const rawRole = String(role || '').trim().toLowerCase()
      const roleMap = {
        user: 'user',
        student: 'user',
        instructor: 'instructor',
        admin: 'admin',
      }

      normalizedRole = roleMap[rawRole]
      if (!normalizedRole) {
        throw AppError.badRequest('role invalido. Usa user, instructor o admin.', 'VALIDATION_ERROR')
      }
    }

    const before = {
      role: normalizeRole(target.role),
      is_active: Boolean(target.is_active),
    }

    const updated = await this.userRepository.updateRoleAndStatus({
      userId: targetUserId,
      role: normalizedRole,
      isActive,
    })

    try {
      await this.userRepository.createAdminAuditLog({
        adminUserId: actorUserId,
        action: 'user.role_or_status.updated',
        entityType: 'users',
        entityId: targetUserId,
        oldValue: before,
        newValue: {
          role: normalizeRole(updated.role),
          is_active: Boolean(updated.is_active),
        },
      })
    } catch (error) {
      console.warn('[RBAC] No se pudo registrar audit log para updateUserRole:', error?.message || error)
    }

    return {
      user: mapUserPayload(updated),
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
