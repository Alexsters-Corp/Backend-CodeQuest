class ProgressService {
  constructor({ pool }) {
    this.pool = pool
  }

  async getOverview({ userId }) {
    const userRows = await this.#queryRowsWithFallback({
      primary: {
        sql: 'SELECT xp_total, nivel FROM usuarios WHERE id = ?',
        params: [userId],
      },
      fallback: {
        sql: 'SELECT total_xp AS xp_total, current_level AS nivel FROM user_stats WHERE user_id = ? LIMIT 1',
        params: [userId],
      },
    })

    const xpTotal = Number(userRows[0]?.xp_total || 0)
    const nivel = Number(userRows[0]?.nivel || 1)

    const streakRows = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT racha_actual, racha_maxima, ultimo_dia_activo
              FROM rachas
              WHERE usuario_id = ?`,
        params: [userId],
      },
      fallback: {
        sql: `SELECT streak_current AS racha_actual,
                     streak_longest AS racha_maxima,
                     last_activity_date AS ultimo_dia_activo
              FROM user_stats
              WHERE user_id = ?`,
        params: [userId],
      },
    })

    const streak = this.#normalizeStreak(streakRows[0])

    const languages = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT ul.lenguaje_id,
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
        params: [userId],
      },
      fallback: {
        sql: `WITH ranked_paths AS (
                SELECT ulp.id,
                       ulp.user_id,
                       ulp.learning_path_id,
                       ulp.selected_at,
                       lp.programming_language_id,
                       ROW_NUMBER() OVER (
                         PARTITION BY lp.programming_language_id
                         ORDER BY ulp.selected_at DESC, ulp.id DESC
                       ) AS rn
                FROM user_learning_paths ulp
                JOIN learning_paths lp ON lp.id = ulp.learning_path_id
                WHERE ulp.user_id = ?
              ),
              path_lesson_progress AS (
                SELECT l.learning_path_id,
                       COUNT(*) AS total_lessons,
                       COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons
                FROM lessons l
                LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
                WHERE l.is_published = 1
                GROUP BY l.learning_path_id
              )
              SELECT pl.id AS lenguaje_id,
                     pl.display_name AS nombre,
                     COALESCE(pl.logo_url, 'code') AS icono,
                     lp_selected.difficulty_level AS nivel_diagnostico,
                     1 AS diagnostico_completado,
                     rp.selected_at AS fechaSeleccion,
                     COUNT(DISTINCT lp_all.id) AS modulosTotal,
                     COALESCE(
                       SUM(
                         CASE
                           WHEN COALESCE(plp.total_lessons, 0) > 0
                             AND COALESCE(plp.completed_lessons, 0) >= COALESCE(plp.total_lessons, 0)
                           THEN 1
                           ELSE 0
                         END
                       ),
                       0
                     ) AS modulosCompletados
              FROM ranked_paths rp
              JOIN learning_paths lp_selected ON lp_selected.id = rp.learning_path_id
              JOIN programming_languages pl ON pl.id = rp.programming_language_id
              JOIN learning_paths lp_all
                ON lp_all.programming_language_id = pl.id
               AND lp_all.is_active = 1
              LEFT JOIN path_lesson_progress plp ON plp.learning_path_id = lp_all.id
              WHERE rp.rn = 1
              GROUP BY pl.id,
                       pl.display_name,
                       pl.logo_url,
                       lp_selected.difficulty_level,
                       rp.selected_at
              ORDER BY rp.selected_at DESC`,
        params: [userId, userId],
      },
    })

    const normalizedLanguages = languages.map((language) => {
      const { fechaSeleccion, ...publicLanguage } = language

      return {
        ...publicLanguage,
        modulosTotal: Number(language.modulosTotal || 0),
        modulosCompletados: Number(language.modulosCompletados || 0),
      }
    })

    const achievements = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT l.nombre, l.descripcion, l.icono, ul.fecha_obtenido
              FROM usuario_logros ul
              JOIN logros l ON l.id = ul.logro_id
              WHERE ul.usuario_id = ?
              ORDER BY ul.fecha_obtenido DESC
              LIMIT 5`,
        params: [userId],
      },
      fallback: {
        sql: `SELECT a.name AS nombre,
                     a.description AS descripcion,
            COALESCE(a.icon_url, 'award') AS icono,
                     ua.unlocked_at AS fecha_obtenido
              FROM user_achievements ua
              JOIN achievements a ON a.id = ua.achievement_id
              WHERE ua.user_id = ?
              ORDER BY ua.unlocked_at DESC
              LIMIT 5`,
        params: [userId],
      },
    })

    const recentXP = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT DATE(fecha) AS dia, SUM(cantidad) AS xp
              FROM xp_transacciones
              WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              GROUP BY DATE(fecha)
              ORDER BY dia`,
        params: [userId],
      },
      fallback: {
        sql: `SELECT DATE(updated_at) AS dia, SUM(xp_earned) AS xp
              FROM user_progress
              WHERE user_id = ? AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              GROUP BY DATE(updated_at)
              ORDER BY dia`,
        params: [userId],
      },
    })

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
    const leaderboard = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT u.id,
                     u.nombre,
                     u.xp_total,
                     u.nivel,
                     ROW_NUMBER() OVER (ORDER BY u.xp_total DESC) AS posicion
              FROM usuarios u
              WHERE u.activo = 1
              ORDER BY u.xp_total DESC
              LIMIT 50`,
      },
      fallback: {
        sql: `SELECT user_id AS id,
                     name AS nombre,
                     total_xp AS xp_total,
                     current_level AS nivel,
                     rank_position AS posicion
              FROM leaderboard
              ORDER BY rank_position
              LIMIT 50`,
      },
    })

    const positions = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT COUNT(*) + 1 AS posicion
              FROM usuarios
              WHERE xp_total > (SELECT COALESCE(xp_total, 0) FROM usuarios WHERE id = ?)
                AND activo = 1`,
        params: [userId],
      },
      fallback: {
        sql: `SELECT COALESCE(rank_position,
                              (SELECT COUNT(*) + 1
                               FROM user_stats
                               WHERE total_xp > COALESCE((SELECT total_xp FROM user_stats WHERE user_id = ?), 0))) AS posicion
              FROM leaderboard
              WHERE user_id = ?
              LIMIT 1`,
        params: [userId, userId],
      },
    })

    return {
      leaderboard,
      myPosition: Number(positions[0]?.posicion || 1),
    }
  }

  async getAchievements({ userId }) {
    const achievements = await this.#queryRowsWithFallback({
      primary: {
        sql: `SELECT l.id,
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
        params: [userId],
      },
      fallback: {
        sql: `SELECT a.id,
                     a.name AS nombre,
                     a.description AS descripcion,
                     COALESCE(a.icon_url, 'award') AS icono,
                     a.requirement_type AS tipo,
                     a.requirement_value AS condicion_valor,
                     ua.unlocked_at AS fecha_obtenido,
                     CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END AS desbloqueado
              FROM achievements a
              LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
              WHERE a.is_active = 1
              ORDER BY a.requirement_type, a.requirement_value`,
        params: [userId],
      },
    })

    return achievements
  }

  async #queryRowsWithFallback({ primary, fallback }) {
    try {
      const [rows] = await this.pool.query(primary.sql, primary.params || [])
      return rows
    } catch (error) {
      if (!fallback || !this.#isSchemaMismatchError(error)) {
        throw error
      }

      const [rows] = await this.pool.query(fallback.sql, fallback.params || [])
      return rows
    }
  }

  #isSchemaMismatchError(error) {
    if (!error || !error.code) {
      return false
    }

    return ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR', 'ER_PARSE_ERROR'].includes(error.code)
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
