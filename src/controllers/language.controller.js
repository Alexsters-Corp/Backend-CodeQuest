const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')

function isSchemaMismatchError(error) {
  if (!error || !error.code) {
    return false
  }

  return ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR', 'ER_PARSE_ERROR'].includes(error.code)
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

/**
 * GET /api/languages
 * Lista todos los lenguajes activos.
 */
const getAll = asyncHandler(async (_req, res) => {
  let rows
  try {
    ;[rows] = await pool.query(
      'SELECT id, nombre, slug, icono FROM lenguajes WHERE activo = 1 ORDER BY id'
    )
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }

    ;[rows] = await pool.query(
      `SELECT id,
              display_name AS nombre,
              slug,
              COALESCE(logo_url, 'code') AS icono
       FROM programming_languages
       WHERE is_active = 1
       ORDER BY id`
    )
  }

  return res.status(200).json({ languages: rows })
})

/**
 * POST /api/languages/select
 * El usuario selecciona un lenguaje. Body: { languageId }
 */
const selectLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body.languageId, 'languageId')
  const userId = req.user.id

  try {
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

    await ensureUserMetricsRows(userId)
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }

    const [langs] = await pool.query(
      'SELECT id FROM programming_languages WHERE id = ? AND is_active = 1',
      [languageId]
    )

    if (langs.length === 0) {
      throw AppError.notFound('Lenguaje no encontrado.')
    }

    const [paths] = await pool.query(
      `SELECT id
       FROM learning_paths
       WHERE programming_language_id = ? AND is_active = 1
       ORDER BY FIELD(difficulty_level, 'principiante', 'intermedio', 'avanzado'), id
       LIMIT 1`,
      [languageId]
    )

    if (paths.length === 0) {
      throw AppError.notFound('No hay rutas de aprendizaje activas para este lenguaje.')
    }

    await pool.query(
      `INSERT INTO user_learning_paths (user_id, learning_path_id, selected_at, last_accessed_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE learning_path_id = VALUES(learning_path_id),
                               selected_at = NOW(),
                               last_accessed_at = NOW()`,
      [userId, paths[0].id]
    )

    await pool.query(
      `INSERT IGNORE INTO user_streaks (user_id, current_streak, longest_streak)
       VALUES (?, 0, 0)`,
      [userId]
    )

    await ensureUserMetricsRows(userId)
  }

  return res.status(200).json({ message: 'Lenguaje seleccionado correctamente.' })
})

/**
 * GET /api/languages/mine
 * Devuelve los lenguajes seleccionados por el usuario autenticado.
 */
const getMyLanguages = asyncHandler(async (req, res) => {
  let rows
  try {
    ;[rows] = await pool.query(
      `SELECT ul.lenguaje_id, l.nombre, l.slug, l.icono,
              ul.nivel_diagnostico, ul.diagnostico_completado
       FROM usuario_lenguajes ul
       JOIN lenguajes l ON l.id = ul.lenguaje_id
       WHERE ul.usuario_id = ?
       ORDER BY ul.fecha_seleccion DESC`,
      [req.user.id]
    )
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }

    ;[rows] = await pool.query(
      `SELECT pl.id AS lenguaje_id,
              pl.display_name AS nombre,
              pl.slug,
              COALESCE(pl.logo_url, 'code') AS icono,
              lp.difficulty_level AS nivel_diagnostico,
              1 AS diagnostico_completado
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE ulp.user_id = ?
       ORDER BY ulp.selected_at DESC`,
      [req.user.id]
    )
  }

  return res.status(200).json({ languages: rows })
})

module.exports = { getAll, selectLanguage, getMyLanguages }
