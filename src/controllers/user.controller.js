const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parseString } = require('../core/validation/request')

/**
 * GET /api/users/me
 * Devuelve los datos del usuario autenticado.
 */
const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, estado, fecha_registro FROM usuarios WHERE id = ? LIMIT 1',
    [req.user.id]
  )

  if (rows.length === 0) {
    throw AppError.notFound('Usuario no encontrado.')
  }

  return res.status(200).json({ user: rows[0] })
})

/**
 * PUT /api/users/me
 * Actualiza nombre del usuario autenticado.
 */
const updateMe = asyncHandler(async (req, res) => {
  const nombre = parseString(req.body.nombre, 'nombre', { minLength: 2 })

  await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, req.user.id])

  return res.status(200).json({ message: 'Perfil actualizado correctamente.' })
})

module.exports = {
  getMe,
  updateMe,
}
