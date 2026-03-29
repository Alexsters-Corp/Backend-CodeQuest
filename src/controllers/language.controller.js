const pool = require('../config/db')

/**
 * GET /api/languages
 * Lista todos los lenguajes activos.
 */
const getAll = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, slug, icono FROM lenguajes WHERE activo = 1 ORDER BY id'
    )
    return res.status(200).json({ languages: rows })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * POST /api/languages/select
 * El usuario selecciona un lenguaje. Body: { languageId }
 */
const selectLanguage = async (req, res) => {
  try {
    const { languageId } = req.body
    const userId = req.user.id

    if (!languageId) {
      return res.status(400).json({ message: 'languageId es obligatorio.' })
    }

    // Verificar que el lenguaje existe
    const [langs] = await pool.query('SELECT id FROM lenguajes WHERE id = ? AND activo = 1', [languageId])
    if (langs.length === 0) {
      return res.status(404).json({ message: 'Lenguaje no encontrado.' })
    }

    // Insertar o actualizar selección
    await pool.query(
      `INSERT INTO usuario_lenguajes (usuario_id, lenguaje_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE fecha_seleccion = CURRENT_TIMESTAMP`,
      [userId, languageId]
    )

    // Inicializar racha si no existe
    await pool.query(
      `INSERT IGNORE INTO rachas (usuario_id, racha_actual, racha_maxima) VALUES (?, 0, 0)`,
      [userId]
    )

    return res.status(200).json({ message: 'Lenguaje seleccionado correctamente.' })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * GET /api/languages/mine
 * Devuelve los lenguajes seleccionados por el usuario autenticado.
 */
const getMyLanguages = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ul.lenguaje_id, l.nombre, l.slug, l.icono,
              ul.nivel_diagnostico, ul.diagnostico_completado
       FROM usuario_lenguajes ul
       JOIN lenguajes l ON l.id = ul.lenguaje_id
       WHERE ul.usuario_id = ?
       ORDER BY ul.fecha_seleccion DESC`,
      [req.user.id]
    )
    return res.status(200).json({ languages: rows })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

module.exports = { getAll, selectLanguage, getMyLanguages }
