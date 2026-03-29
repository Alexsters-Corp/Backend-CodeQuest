const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parseString, requireFields } = require('../core/validation/request')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')

const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['nombre', 'email', 'password'])

  const nombre = parseString(req.body.nombre, 'nombre')
  const email = parseString(req.body.email, 'email').toLowerCase()
  const password = parseString(req.body.password, 'password', { trim: false, minLength: 6 })

  const [existingUsers] = await pool.query(
    'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  )

  if (existingUsers.length > 0) {
    throw AppError.conflict('El email ya está registrado.')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
    [nombre, email, hashedPassword]
  )

  const userId = result.insertId
  const accessToken = signAccessToken({ id: userId, email })
  const refreshToken = signRefreshToken({ id: userId })

  return res.status(201).json({
    message: 'Usuario registrado exitosamente.',
    accessToken,
    refreshToken,
    user: { id: userId, nombre, email },
  })
})

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password'])

  const email = parseString(req.body.email, 'email').toLowerCase()
  const password = parseString(req.body.password, 'password', { trim: false, minLength: 1 })

  const [users] = await pool.query(
    'SELECT id, nombre, email, password FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  )

  if (users.length === 0) {
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  const user = users[0]
  const passwordStr = String(password).trim()
  const hashStr = String(user.password).trim()

  if (hashStr.length !== 60) {
    console.error(`[Login] Hash inválido para ${email}: longitud ${hashStr.length}, esperado 60`)
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  const isPasswordValid = await bcrypt.compare(passwordStr, hashStr)

  if (!isPasswordValid) {
    throw AppError.unauthorized('Credenciales incorrectas.')
  }

  await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [user.id])

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

  const [users] = await pool.query(
    'SELECT id, email FROM usuarios WHERE id = ? LIMIT 1',
    [decoded.id]
  )

  if (users.length === 0) {
    throw AppError.unauthorized('Usuario no encontrado.')
  }

  const user = users[0]
  const newAccessToken = signAccessToken({ id: user.id, email: user.email })

  return res.status(200).json({ accessToken: newAccessToken })
})

module.exports = {
  register,
  login,
  refresh,
}
