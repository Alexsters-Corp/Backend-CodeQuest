const pool = require('../config/db')

/**
 * GET /api/progress/overview
 * Resumen general del progreso del usuario.
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user.id

    // XP total
    const [userRow] = await pool.query(
      `SELECT xp_total, nivel FROM usuarios WHERE id = ?`, [userId]
    )
    const xpTotal = userRow[0]?.xp_total || 0
    const nivel = userRow[0]?.nivel || 1

    // Racha
    const [rachaRow] = await pool.query(
      `SELECT racha_actual, racha_maxima, ultimo_dia_activo FROM rachas WHERE usuario_id = ?`, [userId]
    )
    const racha = rachaRow[0] || { racha_actual: 0, racha_maxima: 0, ultimo_dia_activo: null }

    // Verificar si la racha sigue activa
    if (racha.ultimo_dia_activo) {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const lastActive = new Date(racha.ultimo_dia_activo).toISOString().split('T')[0]
      if (lastActive !== today && lastActive !== yesterdayStr) {
        racha.racha_actual = 0
      }
    }

    // Lenguajes del usuario
    const [languages] = await pool.query(
      `SELECT ul.lenguaje_id, l.nombre, l.icono, ul.nivel_diagnostico, ul.diagnostico_completado
       FROM usuario_lenguajes ul
       JOIN lenguajes l ON l.id = ul.lenguaje_id
       WHERE ul.usuario_id = ?`,
      [userId]
    )

    // Para cada lenguaje, progreso general
    for (const lang of languages) {
      const [moduleProgress] = await pool.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN pm.estado = 'completado' THEN 1 ELSE 0 END) AS completados
         FROM modulos m
         LEFT JOIN progreso_modulo pm ON pm.modulo_id = m.id AND pm.usuario_id = ?
         WHERE m.lenguaje_id = ? AND m.activo = 1`,
        [userId, lang.lenguaje_id]
      )
      lang.modulosTotal = moduleProgress[0].total
      lang.modulosCompletados = moduleProgress[0].completados || 0
    }

    // Logros obtenidos
    const [achievements] = await pool.query(
      `SELECT l.nombre, l.descripcion, l.icono, ul.fecha_obtenido
       FROM usuario_logros ul
       JOIN logros l ON l.id = ul.logro_id
       WHERE ul.usuario_id = ?
       ORDER BY ul.fecha_obtenido DESC
       LIMIT 5`,
      [userId]
    )

    // Actividad reciente (últimos 7 días)
    const [recentXP] = await pool.query(
      `SELECT DATE(fecha) AS dia, SUM(cantidad) AS xp
       FROM xp_transacciones
       WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha)
       ORDER BY dia`,
      [userId]
    )

    return res.status(200).json({
      xpTotal,
      nivel,
      racha: racha.racha_actual,
      rachaMaxima: racha.racha_maxima,
      languages,
      achievements,
      recentXP,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * GET /api/progress/leaderboard
 * Tabla de clasificación global.
 */
const getLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id

    const [leaderboard] = await pool.query(
      `SELECT u.id, u.nombre, u.xp_total, u.nivel,
              ROW_NUMBER() OVER (ORDER BY u.xp_total DESC) AS posicion
       FROM usuarios u
       WHERE u.activo = 1
       ORDER BY u.xp_total DESC
       LIMIT 50`
    )

    // Posición del usuario actual
    const [myPos] = await pool.query(
      `SELECT COUNT(*) + 1 AS posicion FROM usuarios WHERE xp_total > (SELECT COALESCE(xp_total, 0) FROM usuarios WHERE id = ?) AND activo = 1`,
      [userId]
    )

    return res.status(200).json({
      leaderboard,
      myPosition: myPos[0].posicion,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * GET /api/progress/achievements
 * Todos los logros con estado (desbloqueado o no).
 */
const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id

    const [achievements] = await pool.query(
      `SELECT l.id, l.nombre, l.descripcion, l.icono, l.tipo, l.condicion_valor,
              ul.fecha_obtenido,
              CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END AS desbloqueado
       FROM logros l
       LEFT JOIN usuario_logros ul ON ul.logro_id = l.id AND ul.usuario_id = ?
       WHERE l.activo = 1
       ORDER BY l.tipo, l.condicion_valor`,
      [userId]
    )

    return res.status(200).json(achievements)
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

module.exports = { getOverview, getLeaderboard, getAchievements }
