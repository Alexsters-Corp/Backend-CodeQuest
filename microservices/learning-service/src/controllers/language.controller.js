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

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return parsePositiveInt(value, fieldName)
}

/**
 * GET /api/languages
 * Lista todos los lenguajes activos.
 */
const getAll = asyncHandler(async (_req, res) => {
  let rows = []
  let hasLegacySchema = false

  try {
    hasLegacySchema = true
    ;[rows] = await pool.query(
      'SELECT id, nombre, slug, icono FROM lenguajes WHERE activo = 1 ORDER BY id'
    )
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }
  }

  if (rows.length === 0) {
    try {
      ;[rows] = await pool.query(
        `SELECT id,
                display_name AS nombre,
                slug,
                COALESCE(logo_url, 'code') AS icono
         FROM programming_languages
         WHERE is_active = 1
         ORDER BY id`
      )
    } catch (error) {
      if (!isSchemaMismatchError(error) || !hasLegacySchema) {
        throw error
      }
    }
  }

  return res.status(200).json({ languages: rows })
})

/**
 * GET /api/learning-paths?languageId=1
 * Lista rutas de aprendizaje activas por lenguaje (opcional).
 */
const getLearningPaths = asyncHandler(async (req, res) => {
  const languageId = parseOptionalPositiveInt(req.query.languageId, 'languageId')
  const params = [languageId, languageId]
  let rows

  try {
    ;[rows] = await pool.query(
      `SELECT lp.id,
              lp.programming_language_id AS language_id,
              pl.display_name AS language_name,
              lp.name,
              COALESCE(lp.description, '') AS description,
              lp.difficulty_level
       FROM learning_paths lp
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE lp.is_active = 1
         AND (? IS NULL OR lp.programming_language_id = ?)
       ORDER BY pl.display_name,
                FIELD(lp.difficulty_level, 'principiante', 'intermedio', 'avanzado'),
                lp.id`,
      params
    )
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }

    ;[rows] = await pool.query(
      `SELECT m.id,
              m.lenguaje_id AS language_id,
              l.nombre AS language_name,
              m.titulo AS name,
              COALESCE(m.descripcion, '') AS description,
              CASE
                WHEN LOWER(m.titulo) LIKE '%avanz%' THEN 'avanzado'
                WHEN LOWER(m.titulo) LIKE '%intermedio%' THEN 'intermedio'
                ELSE 'principiante'
              END AS difficulty_level
       FROM modulos m
       JOIN lenguajes l ON l.id = m.lenguaje_id
       WHERE m.activo = 1
         AND (? IS NULL OR m.lenguaje_id = ?)
       ORDER BY l.nombre, m.numero, m.id`,
      params
    )
  }

  const learningPaths = rows.map((row) => ({
    id: Number(row.id),
    languageId: Number(row.language_id),
    languageName: row.language_name,
    name: row.name,
    description: row.description,
    difficultyLevel: row.difficulty_level,
  }))

  return res.status(200).json({ learningPaths })
})

/**
 * POST /api/languages/select
 * El usuario selecciona un lenguaje/ruta. Body: { languageId, learningPathId? }
 */
const selectLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body.languageId, 'languageId')
  const learningPathId = parseOptionalPositiveInt(req.body.learningPathId, 'learningPathId')
  const userId = req.user.id
  let selectedLearningPathId

  try {
    const [langs] = await pool.query(
      'SELECT id FROM programming_languages WHERE id = ? AND is_active = 1',
      [languageId]
    )

    if (langs.length === 0) {
      throw AppError.notFound('Lenguaje no encontrado.')
    }

    if (learningPathId) {
      const [paths] = await pool.query(
        `SELECT id
         FROM learning_paths
         WHERE id = ? AND programming_language_id = ? AND is_active = 1
         LIMIT 1`,
        [learningPathId, languageId]
      )

      if (paths.length === 0) {
        throw AppError.notFound('Ruta de aprendizaje no encontrada para este lenguaje.')
      }

      selectedLearningPathId = Number(paths[0].id)
    } else {
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

      selectedLearningPathId = Number(paths[0].id)
    }

    await pool.query(
      `INSERT INTO user_learning_paths (user_id, learning_path_id, selected_at, last_accessed_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE learning_path_id = VALUES(learning_path_id),
                               selected_at = NOW(),
                               last_accessed_at = NOW()`,
      [userId, selectedLearningPathId]
    )

    await pool.query(
      `INSERT IGNORE INTO user_streaks (user_id, current_streak, longest_streak)
       VALUES (?, 0, 0)`,
      [userId]
    )

    await ensureUserMetricsRows(userId)

    return res.status(200).json({
      message: 'Lenguaje seleccionado correctamente.',
      learningPathId: selectedLearningPathId,
    })
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }
  }

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

  return res.status(200).json({ message: 'Lenguaje seleccionado correctamente.' })
})

/**
 * GET /api/languages/mine
 * Devuelve los lenguajes seleccionados por el usuario autenticado.
 */
const getMyLanguages = asyncHandler(async (req, res) => {
  let rows = []
  let hasLegacySchema = false

  try {
    hasLegacySchema = true
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
  }

  if (rows.length === 0) {
    try {
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
    } catch (error) {
      if (!isSchemaMismatchError(error) || !hasLegacySchema) {
        throw error
      }
    }
  }

  return res.status(200).json({ languages: rows })
})

module.exports = { getAll, getLearningPaths, selectLanguage, getMyLanguages }
