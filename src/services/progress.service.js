class ProgressService {
  constructor({ pool }) {
    this.pool = pool
  }

  async getOverview({ userId }) {
    const [userRows] = await this.pool.query(
      'SELECT xp_total, nivel FROM usuarios WHERE id = ?',
      [userId]
    )

    const xpTotal = Number(userRows[0]?.xp_total || 0)
    const nivel = Number(userRows[0]?.nivel || 1)

    const [streakRows] = await this.pool.query(
      `SELECT racha_actual, racha_maxima, ultimo_dia_activo
       FROM rachas
       WHERE usuario_id = ?`,
      [userId]
    )

    const streak = this.#normalizeStreak(streakRows[0])

    const [languages] = await this.pool.query(
      `SELECT ul.lenguaje_id,
              l.nombre,
              l.icono,
              ul.nivel_diagnostico,
              ul.diagnostico_completado,
              MAX(ul.fecha_seleccion) AS fechaSeleccion,
              COUNT(m.id) AS modulosTotal,
              COALESCE(SUM(CASE WHEN pm.estado = 'completado' THEN 1 ELSE 0 END), 0) AS modulosCompletados
       FROM usuario_lenguajes ul
       JOIN lenguajes l ON l.id = ul.lenguaje_id
       LEFT JOIN modulos m ON m.lenguaje_id = ul.lenguaje_id AND m.activo = 1
       LEFT JOIN progreso_modulo pm ON pm.modulo_id = m.id AND pm.usuario_id = ul.usuario_id
       WHERE ul.usuario_id = ?
       GROUP BY ul.lenguaje_id, l.nombre, l.icono, ul.nivel_diagnostico, ul.diagnostico_completado
       ORDER BY fechaSeleccion DESC`,
      [userId]
    )

    const normalizedLanguages = languages.map((language) => {
      const { fechaSeleccion, ...publicLanguage } = language

      return {
        ...publicLanguage,
        modulosTotal: Number(language.modulosTotal || 0),
        modulosCompletados: Number(language.modulosCompletados || 0),
      }
    })

    const [achievements] = await this.pool.query(
      `SELECT l.nombre, l.descripcion, l.icono, ul.fecha_obtenido
       FROM usuario_logros ul
       JOIN logros l ON l.id = ul.logro_id
       WHERE ul.usuario_id = ?
       ORDER BY ul.fecha_obtenido DESC
       LIMIT 5`,
      [userId]
    )

    const [recentXP] = await this.pool.query(
      `SELECT DATE(fecha) AS dia, SUM(cantidad) AS xp
       FROM xp_transacciones
       WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha)
       ORDER BY dia`,
      [userId]
    )

    return {
      xpTotal,
      nivel,
      racha: streak.racha_actual,
      rachaMaxima: streak.racha_maxima,
      languages: normalizedLanguages,
      achievements,
      recentXP,
    }
  }

  async getLeaderboard({ userId }) {
    const [leaderboard] = await this.pool.query(
      `SELECT u.id,
              u.nombre,
              u.xp_total,
              u.nivel,
              ROW_NUMBER() OVER (ORDER BY u.xp_total DESC) AS posicion
       FROM usuarios u
       WHERE u.activo = 1
       ORDER BY u.xp_total DESC
       LIMIT 50`
    )

    const [positions] = await this.pool.query(
      `SELECT COUNT(*) + 1 AS posicion
       FROM usuarios
       WHERE xp_total > (SELECT COALESCE(xp_total, 0) FROM usuarios WHERE id = ?)
         AND activo = 1`,
      [userId]
    )

    return {
      leaderboard,
      myPosition: Number(positions[0]?.posicion || 1),
    }
  }

  async getAchievements({ userId }) {
    const [achievements] = await this.pool.query(
      `SELECT l.id,
              l.nombre,
              l.descripcion,
              l.icono,
              l.tipo,
              l.condicion_valor,
              ul.fecha_obtenido,
              CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END AS desbloqueado
       FROM logros l
       LEFT JOIN usuario_logros ul ON ul.logro_id = l.id AND ul.usuario_id = ?
       WHERE l.activo = 1
       ORDER BY l.tipo, l.condicion_valor`,
      [userId]
    )

    return achievements
  }

  #normalizeStreak(streakRow) {
    const streak = {
      racha_actual: Number(streakRow?.racha_actual || 0),
      racha_maxima: Number(streakRow?.racha_maxima || 0),
      ultimo_dia_activo: streakRow?.ultimo_dia_activo || null,
    }

    if (!streak.ultimo_dia_activo) {
      return streak
    }

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const lastActive = new Date(streak.ultimo_dia_activo).toISOString().split('T')[0]

    if (lastActive !== today && lastActive !== yesterdayStr) {
      streak.racha_actual = 0
    }

    return streak
  }
}

module.exports = ProgressService
