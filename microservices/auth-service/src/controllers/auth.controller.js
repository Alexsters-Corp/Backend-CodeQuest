const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parseString, requireFields } = require('../core/validation/request')
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../utils/jwt')
const UserRepository = require('../repositories/user.repository')
const TokenBlacklistRepository = require('../repositories/tokenBlacklist.repository')

const userRepository = new UserRepository({ pool })
const tokenBlacklistRepository = new TokenBlacklistRepository({ pool })

function extractBearerToken(req) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token de autenticación requerido.')
  }

  const token = header.split(' ')[1]
  if (!token) {
    throw AppError.unauthorized('Token de autenticación requerido.')
  }

  return token
}

function resolveAccessTokenExpiration(decoded) {
  if (decoded && Number.isInteger(decoded.exp)) {
    return new Date(decoded.exp * 1000)
  }

  return new Date(Date.now() + 15 * 60 * 1000)
}

async function ensureUserMetricsRows(userId) {
  await Promise.allSettled([
    pool.query(
      `INSERT IGNORE INTO user_stats (user_id, total_xp, current_level, lessons_completed, submissions_total, submissions_accepted)
       VALUES (?, 0, 1, 0, 0, 0)`,
      [userId]
    ),
    pool.query(
      `INSERT IGNORE INTO user_streaks (user_id, current_streak, longest_streak)
       VALUES (?, 0, 0)`,
      [userId]
    ),
  ])
}

const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nombre', 'email', 'password'])

  const nombre = parseString(req.body.nombre, 'nombre')
  const email = parseString(req.body.email, 'email').toLowerCase()
  const password = parseString(req.body.password, 'password', { trim: false, minLength: 6 })

  const existingUser = await userRepository.findExistingByEmail(email)

  if (existingUser) {
    throw AppError.conflict('El email ya está registrado.')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  let createdUser
  try {
    createdUser = await userRepository.createUser({
      nombre,
      email,
      passwordHash: hashedPassword,
    })
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      throw AppError.conflict('El email ya está registrado.')
    }
    throw error
  }

  const userId = createdUser.id
  await ensureUserMetricsRows(userId)

  const accessToken = signAccessToken({ id: userId, email })
  const refreshToken = signRefreshToken({ id: userId })

  return res.status(201).json({
    message: 'Usuario registrado exitosamente.',
    accessToken,
    refreshToken,
    user: { id: userId, nombre: createdUser.nombre, email: createdUser.email },
  })
})

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password'])

  const email = parseString(req.body.email, 'email').toLowerCase()
  const password = parseString(req.body.password, 'password', { trim: false, minLength: 1 })

  const user = await userRepository.findAuthUserByEmail(email)

  if (!user) {
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  const passwordStr = String(password).trim()
  const hashStr = String(user.passwordHash).trim()

  if (hashStr.length !== 60) {
    console.error(`[Login] Hash inválido para ${email}: longitud ${hashStr.length}, esperado 60`)
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  const isPasswordValid = await bcrypt.compare(passwordStr, hashStr)

  if (!isPasswordValid) {
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  await userRepository.touchLastLoginIfSupported(user.id)
  await ensureUserMetricsRows(user.id)

  const accessToken = signAccessToken({ id: user.id, email: user.email })
  const refreshToken = signRefreshToken({ id: user.id })

  return res.status(200).json({
    message: 'Inicio de sesión correcto.',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
    },
  })
})

/**
 * POST /api/auth/refresh
 * Recibe un refreshToken y devuelve un nuevo accessToken.
 */
const refresh = asyncHandler(async (req, res) => {
  requireFields(req.body, ['refreshToken'])
  const refreshToken = parseString(req.body.refreshToken, 'refreshToken', { trim: false, minLength: 1 })

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch (_error) {
    throw AppError.unauthorized('Refresh token inválido o expirado.')
  }

  const user = await userRepository.findBasicById(decoded.id)

  if (!user) {
    throw AppError.unauthorized('Usuario no encontrado.')
  }

  const newAccessToken = signAccessToken({ id: user.id, email: user.email })

  return res.status(200).json({ accessToken: newAccessToken })
})

/**
 * POST /api/auth/logout
 * Invalida el access token actual enviándolo a blacklist.
 */
const logout = asyncHandler(async (req, res) => {
  const token = extractBearerToken(req)

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({ message: 'Sesión cerrada correctamente.' })
    }

    throw AppError.unauthorized('Token inválido.')
  }

  await tokenBlacklistRepository.revokeToken({
    token,
    userId: decoded.id,
    expiresAt: resolveAccessTokenExpiration(decoded),
  })

  return res.status(200).json({ message: 'Sesión cerrada correctamente.' })
})

module.exports = {
  register,
  login,
  refresh,
  logout,
}
