const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')

const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' })
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado.' })
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
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor.', error: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' })
    }

    const [users] = await pool.query(
      'SELECT id, nombre, email, password FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' })
    }

    const user = users[0]

    // bcryptjs 3.x requiere strings y hash de exactamente 60 caracteres
    const passwordStr = String(password).trim()
    const hashStr = String(user.password).trim()

    if (hashStr.length !== 60) {
      console.error(`[Login] Hash inválido para ${email}: longitud ${hashStr.length}, esperado 60`)
      return res.status(401).json({ message: 'Credenciales incorrectas.' })
    }

    const isPasswordValid = await bcrypt.compare(passwordStr, hashStr)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' })
    }

    // Actualizar ultimo_login
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
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor.', error: error.message })
  }
}

/**
 * POST /api/auth/refresh
 * Recibe un refreshToken y devuelve un nuevo accessToken.
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token requerido.' })
    }

    const decoded = verifyRefreshToken(refreshToken)

    const [users] = await pool.query(
      'SELECT id, email FROM usuarios WHERE id = ? LIMIT 1',
      [decoded.id]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado.' })
    }

    const user = users[0]
    const newAccessToken = signAccessToken({ id: user.id, email: user.email })

    return res.status(200).json({ accessToken: newAccessToken })
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token inválido o expirado.' })
  }
}

module.exports = {
  register,
  login,
  refresh,
}
