const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')

/**
 * GET /api/languages
 * Lista todos los lenguajes activos.
 */
const getAll = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, slug, icono FROM lenguajes WHERE activo = 1 ORDER BY id'
  )
  return res.status(200).json({ languages: rows })
})

/**
 * POST /api/languages/select
 * El usuario selecciona un lenguaje. Body: { languageId }
 */
const selectLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body.languageId, 'languageId')
  const userId = req.user.id

  const [langs] = await pool.query('SELECT id FROM lenguajes WHERE id = ? AND activo = 1', [languageId])
  if (langs.length === 0) {
    throw AppError.notFound('Lenguaje no encontrado.')
  }

  await pool.query(
    `INSERT INTO usuario_lenguajes (usuario_id, lenguaje_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE fecha_seleccion = CURRENT_TIMESTAMP`,
    [userId, languageId]
  )

  await pool.query(
    `INSERT IGNORE INTO rachas (usuario_id, racha_actual, racha_maxima) VALUES (?, 0, 0)`,
    [userId]
  )

  return res.status(200).json({ message: 'Lenguaje seleccionado correctamente.' })
})

/**
 * GET /api/languages/mine
 * Devuelve los lenguajes seleccionados por el usuario autenticado.
 */
const getMyLanguages = asyncHandler(async (req, res) => {
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
})

module.exports = { getAll, selectLanguage, getMyLanguages }
