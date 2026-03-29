const pool = require('../config/db')

/**
 * GET /api/users/me
 * Devuelve los datos del usuario autenticado.
 */
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, estado, fecha_registro FROM usuarios WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    return res.status(200).json({ user: rows[0] })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor.', error: error.message })
  }
}

/**
 * PUT /api/users/me
 * Actualiza nombre del usuario autenticado.
 */
const updateMe = async (req, res) => {
  try {
    const { nombre } = req.body

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio.' })
    }

    await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, req.user.id])

    return res.status(200).json({ message: 'Perfil actualizado correctamente.' })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor.', error: error.message })
  }
}

module.exports = {
  getMe,
  updateMe,
}
