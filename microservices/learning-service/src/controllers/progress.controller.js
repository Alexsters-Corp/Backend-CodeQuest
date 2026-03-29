const pool = require('../config/db')

/**
 * GET /api/progress/overview
 * Resumen general del progreso del usuario.
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user.id

    // Valores por defecto
    let xpTotal = 0
    let nivel = 1
    let racha = { racha_actual: 0, racha_maxima: 0 }
    let languages = []
    let achievements = []
    let recentXP = []

    // XP total (si las columnas existen)
    try {
      const [userRow] = await pool.query(
        `SELECT xp_total, nivel FROM usuarios WHERE id = ?`, [userId]
      )
      if (userRow[0]) {
        xpTotal = userRow[0].xp_total || 0
        nivel = userRow[0].nivel || 1
      }
    } catch {
      // Columnas no existen, usar valores por defecto
    }

    // Racha (si la tabla existe)
    try {
      const [rachaRow] = await pool.query(
        `SELECT racha_actual, racha_maxima, ultimo_dia_activo FROM rachas WHERE usuario_id = ?`, [userId]
      )
      if (rachaRow[0]) {
        racha = rachaRow[0]
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
      }
    } catch {
      // Tabla no existe
    }

    // Lenguajes del usuario (si las tablas existen)
    try {
      const [langs] = await pool.query(
        `SELECT ul.lenguaje_id, l.nombre, l.icono, ul.nivel_diagnostico, ul.diagnostico_completado
         FROM usuario_lenguajes ul
         JOIN lenguajes l ON l.id = ul.lenguaje_id
         WHERE ul.usuario_id = ?`,
        [userId]
      )
      languages = langs

      // Para cada lenguaje, progreso general
      for (const lang of languages) {
        try {
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
        } catch {
          lang.modulosTotal = 0
          lang.modulosCompletados = 0
        }
      }
    } catch {
      // Tablas no existen
    }

    // Logros obtenidos (si las tablas existen)
    try {
      const [achievs] = await pool.query(
        `SELECT l.nombre, l.descripcion, l.icono, ul.fecha_obtenido
         FROM usuario_logros ul
         JOIN logros l ON l.id = ul.logro_id
         WHERE ul.usuario_id = ?
         ORDER BY ul.fecha_obtenido DESC
         LIMIT 5`,
        [userId]
      )
      achievements = achievs
    } catch {
      // Tablas no existen
    }

    // Actividad reciente (si la tabla existe)
    try {
      const [recent] = await pool.query(
        `SELECT DATE(fecha) AS dia, SUM(cantidad) AS xp
         FROM xp_transacciones
         WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(fecha)
         ORDER BY dia`,
        [userId]
      )
      recentXP = recent
    } catch {
      // Tabla no existe
    }

    return res.status(200).json({
      xpTotal,
      nivel,
      racha: racha.racha_actual || 0,
      rachaMaxima: racha.racha_maxima || 0,
      languages,
      achievements,
      recentXP,
    })
  } catch (error) {
    console.error('[Progress] Error en getOverview:', error.message)
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
    let leaderboard = []
    let myPosition = 1

    try {
      const [lb] = await pool.query(
        `SELECT u.id, u.nombre, COALESCE(u.xp_total, 0) as xp_total, COALESCE(u.nivel, 1) as nivel,
                ROW_NUMBER() OVER (ORDER BY COALESCE(u.xp_total, 0) DESC) AS posicion
         FROM usuarios u
         WHERE u.estado = 'activo'
         ORDER BY COALESCE(u.xp_total, 0) DESC
         LIMIT 50`
      )
      leaderboard = lb
    } catch {
      // Si xp_total no existe, devolver lista básica
      try {
        const [lb] = await pool.query(
          `SELECT u.id, u.nombre, 0 as xp_total, 1 as nivel,
                  ROW_NUMBER() OVER (ORDER BY u.id) AS posicion
           FROM usuarios u
           WHERE u.estado = 'activo'
           ORDER BY u.id
           LIMIT 50`
        )
        leaderboard = lb
      } catch {
        // Si estado tampoco existe
        const [lb] = await pool.query(
          `SELECT u.id, u.nombre, 0 as xp_total, 1 as nivel
           FROM usuarios u
           ORDER BY u.id
           LIMIT 50`
        )
        leaderboard = lb.map((u, i) => ({ ...u, posicion: i + 1 }))
      }
    }

    return res.status(200).json({
      leaderboard,
      myPosition,
    })
  } catch (error) {
    console.error('[Progress] Error en getLeaderboard:', error.message)
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
    let achievements = []

    try {
      const [achievs] = await pool.query(
        `SELECT l.id, l.nombre, l.descripcion, l.icono, l.tipo, l.condicion_valor,
                ul.fecha_obtenido,
                CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END AS desbloqueado
         FROM logros l
         LEFT JOIN usuario_logros ul ON ul.logro_id = l.id AND ul.usuario_id = ?
         WHERE l.activo = 1
         ORDER BY l.tipo, l.condicion_valor`,
        [userId]
      )
      achievements = achievs
    } catch {
      // Tablas no existen
    }

    return res.status(200).json(achievements)
  } catch (error) {
    console.error('[Progress] Error en getAchievements:', error.message)
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

module.exports = { getOverview, getLeaderboard, getAchievements }
