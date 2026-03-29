const AppError = require('../core/errors/AppError')
const withTransaction = require('../core/db/withTransaction')

class LessonProgressService {
  constructor({ pool }) {
    this.pool = pool
  }

  async submitExercise({ userId, exerciseId, answer }) {
    return withTransaction(this.pool, async (db) => {
      const [exercises] = await db.query(
        `SELECT e.id, e.leccion_id, e.tipo, e.respuesta_correcta, e.pista, e.xp_recompensa,
                l.modulo_id
         FROM ejercicios e
         JOIN lecciones l ON l.id = e.leccion_id
         WHERE e.id = ?`,
        [exerciseId]
      )

      if (exercises.length === 0) {
        throw AppError.notFound('Ejercicio no encontrado.')
      }

      const exercise = exercises[0]
      const userAnswer = String(answer).trim()
      const correctAnswer = String(exercise.respuesta_correcta).trim()
      const isCorrect = this.#evaluateAnswer(exercise.tipo, userAnswer, correctAnswer)

      const configuredXp = Number(exercise.xp_recompensa || 0)
      await db.query(
        `INSERT INTO intentos_ejercicio (usuario_id, ejercicio_id, respuesta, es_correcto, xp_ganado)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, exerciseId, userAnswer, isCorrect ? 1 : 0, isCorrect ? configuredXp : 0]
      )

      let awardedXp = 0

      if (isCorrect) {
        awardedXp = await this.#awardExerciseXpIfNeeded(db, userId, exerciseId, configuredXp)

        // Actualizamos racha en el primer acierto del día por ejercicio para evitar incrementos duplicados.
        if (awardedXp > 0 || configuredXp === 0) {
          await this.#updateStreak(db, userId)
        }

        await this.#checkLessonCompletion(db, userId, exercise.leccion_id)
      }

      return {
        isCorrect,
        correctAnswer: isCorrect ? null : correctAnswer,
        xpGained: awardedXp,
        hint: isCorrect ? null : exercise.pista,
      }
    })
  }

  #evaluateAnswer(type, userAnswer, correctAnswer) {
    switch (type) {
      case 'opcion_multiple':
      case 'verdadero_falso':
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase()
      case 'completar_codigo':
      case 'ordenar_codigo':
      default:
        return userAnswer === correctAnswer
    }
  }

  async #awardExerciseXpIfNeeded(db, userId, exerciseId, xp) {
    const [existingTransaction] = await db.query(
      `SELECT id
       FROM xp_transacciones
       WHERE usuario_id = ? AND referencia_tipo = 'ejercicio' AND referencia_id = ?
       LIMIT 1 FOR UPDATE`,
      [userId, exerciseId]
    )

    if (existingTransaction.length > 0) {
      return 0
    }

    await db.query(
      `INSERT INTO xp_transacciones (usuario_id, cantidad, tipo, referencia_tipo, referencia_id, descripcion)
       VALUES (?, ?, 'ejercicio', 'ejercicio', ?, 'Ejercicio completado')`,
      [userId, xp, exerciseId]
    )

    if (xp > 0) {
      await db.query(
        `UPDATE usuarios SET xp_total = COALESCE(xp_total, 0) + ? WHERE id = ?`,
        [xp, userId]
      )
    }

    return xp
  }

  async #checkLessonCompletion(db, userId, lessonId) {
    const [totalExercises] = await db.query(
      `SELECT COUNT(*) AS total FROM ejercicios WHERE leccion_id = ? AND activo = 1`,
      [lessonId]
    )

    if (totalExercises[0].total === 0) {
      return
    }

    const [completedExercises] = await db.query(
      `SELECT COUNT(DISTINCT e.id) AS completed
       FROM ejercicios e
       JOIN intentos_ejercicio ie ON ie.ejercicio_id = e.id
       WHERE e.leccion_id = ? AND e.activo = 1 AND ie.usuario_id = ? AND ie.es_correcto = 1`,
      [lessonId, userId]
    )

    if (completedExercises[0].completed < totalExercises[0].total) {
      return
    }

    await db.query(
      `INSERT INTO progreso_leccion (usuario_id, leccion_id, estado, fecha_inicio, fecha_completado)
       VALUES (?, ?, 'completada', NOW(), NOW())
       ON DUPLICATE KEY UPDATE estado = 'completada', fecha_completado = NOW()`,
      [userId, lessonId]
    )

    const [lessons] = await db.query(
      `SELECT modulo_id, numero FROM lecciones WHERE id = ? LIMIT 1`,
      [lessonId]
    )

    if (lessons.length === 0) {
      return
    }

    const currentLesson = lessons[0]
    const [nextLessons] = await db.query(
      `SELECT id FROM lecciones WHERE modulo_id = ? AND numero = ? AND activo = 1 LIMIT 1`,
      [currentLesson.modulo_id, currentLesson.numero + 1]
    )

    if (nextLessons.length > 0) {
      await db.query(
        `INSERT INTO progreso_leccion (usuario_id, leccion_id, estado, fecha_inicio)
         VALUES (?, ?, 'disponible', NOW())
         ON DUPLICATE KEY UPDATE estado = IF(estado = 'bloqueado', 'disponible', estado)`,
        [userId, nextLessons[0].id]
      )

      await this.#updateModuleProgressPercent(db, userId, currentLesson.modulo_id)
      return
    }

    await this.#checkModuleCompletion(db, userId, currentLesson.modulo_id)
  }

  async #checkModuleCompletion(db, userId, moduleId) {
    const [totalLessons] = await db.query(
      `SELECT COUNT(*) AS total FROM lecciones WHERE modulo_id = ? AND activo = 1`,
      [moduleId]
    )

    if (totalLessons[0].total === 0) {
      return
    }

    const [completedLessons] = await db.query(
      `SELECT COUNT(*) AS completed
       FROM progreso_leccion pl
       JOIN lecciones l ON l.id = pl.leccion_id
       WHERE pl.usuario_id = ? AND l.modulo_id = ? AND pl.estado = 'completada'`,
      [userId, moduleId]
    )

    const percent = Math.round((completedLessons[0].completed / totalLessons[0].total) * 100)

    if (completedLessons[0].completed < totalLessons[0].total) {
      await db.query(
        `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
         VALUES (?, ?, 'en_progreso', ?, NOW())
         ON DUPLICATE KEY UPDATE porcentaje = VALUES(porcentaje),
                                 estado = IF(estado = 'bloqueado', 'en_progreso', estado)`,
        [userId, moduleId, percent]
      )
      return
    }

    await db.query(
      `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio, fecha_completado)
       VALUES (?, ?, 'completado', 100, NOW(), NOW())
       ON DUPLICATE KEY UPDATE estado = 'completado', porcentaje = 100, fecha_completado = NOW()`,
      [userId, moduleId]
    )

    const [modules] = await db.query(
      `SELECT xp_recompensa, lenguaje_id, numero FROM modulos WHERE id = ? LIMIT 1`,
      [moduleId]
    )

    if (modules.length > 0) {
      const moduleData = modules[0]
      await this.#awardModuleXpIfNeeded(db, userId, moduleId, Number(moduleData.xp_recompensa || 0))
      await this.#unlockNextModule(db, userId, moduleData)
    }
  }

  async #updateModuleProgressPercent(db, userId, moduleId) {
    const [totalLessons] = await db.query(
      `SELECT COUNT(*) AS total FROM lecciones WHERE modulo_id = ? AND activo = 1`,
      [moduleId]
    )

    if (totalLessons[0].total === 0) {
      return
    }

    const [completedLessons] = await db.query(
      `SELECT COUNT(*) AS completed
       FROM progreso_leccion pl
       JOIN lecciones l ON l.id = pl.leccion_id
       WHERE pl.usuario_id = ? AND l.modulo_id = ? AND pl.estado = 'completada'`,
      [userId, moduleId]
    )

    const percent = Math.round((completedLessons[0].completed / totalLessons[0].total) * 100)

    await db.query(
      `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
       VALUES (?, ?, 'en_progreso', ?, NOW())
       ON DUPLICATE KEY UPDATE porcentaje = VALUES(porcentaje),
                               estado = IF(estado = 'bloqueado', 'en_progreso', estado)`,
      [userId, moduleId, percent]
    )
  }

  async #awardModuleXpIfNeeded(db, userId, moduleId, xp) {
    const [existingTransaction] = await db.query(
      `SELECT id
       FROM xp_transacciones
       WHERE usuario_id = ? AND referencia_tipo = 'modulo' AND referencia_id = ?
       LIMIT 1 FOR UPDATE`,
      [userId, moduleId]
    )

    if (existingTransaction.length > 0) {
      return
    }

    await db.query(
      `INSERT INTO xp_transacciones (usuario_id, cantidad, tipo, referencia_tipo, referencia_id, descripcion)
       VALUES (?, ?, 'modulo', 'modulo', ?, 'Modulo completado')`,
      [userId, xp, moduleId]
    )

    if (xp > 0) {
      await db.query(
        `UPDATE usuarios SET xp_total = COALESCE(xp_total, 0) + ? WHERE id = ?`,
        [xp, userId]
      )
    }
  }

  async #unlockNextModule(db, userId, moduleData) {
    const [nextModule] = await db.query(
      `SELECT id
       FROM modulos
       WHERE lenguaje_id = ? AND numero = ? AND activo = 1
       LIMIT 1`,
      [moduleData.lenguaje_id, moduleData.numero + 1]
    )

    if (nextModule.length === 0) {
      return
    }

    await db.query(
      `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
       VALUES (?, ?, 'en_progreso', 0, NOW())
       ON DUPLICATE KEY UPDATE estado = IF(estado = 'bloqueado', 'en_progreso', estado)`,
      [userId, nextModule[0].id]
    )
  }

  async #updateStreak(db, userId) {
    const today = new Date().toISOString().split('T')[0]

    const [streakRows] = await db.query(
      `SELECT racha_actual, racha_maxima, ultimo_dia_activo FROM rachas WHERE usuario_id = ? LIMIT 1`,
      [userId]
    )

    if (streakRows.length === 0) {
      await db.query(
        `INSERT INTO rachas (usuario_id, racha_actual, racha_maxima, ultimo_dia_activo)
         VALUES (?, 1, 1, ?)`,
        [userId, today]
      )
      return
    }

    const streak = streakRows[0]

    if (!streak.ultimo_dia_activo) {
      await db.query(
        `UPDATE rachas SET racha_actual = 1, racha_maxima = GREATEST(racha_maxima, 1), ultimo_dia_activo = ?
         WHERE usuario_id = ?`,
        [today, userId]
      )
      return
    }

    const lastActive = new Date(streak.ultimo_dia_activo).toISOString().split('T')[0]

    if (lastActive === today) {
      return
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const nextValue = lastActive === yesterdayStr ? streak.racha_actual + 1 : 1
    const maxValue = Math.max(nextValue, streak.racha_maxima)

    await db.query(
      `UPDATE rachas
       SET racha_actual = ?, racha_maxima = ?, ultimo_dia_activo = ?
       WHERE usuario_id = ?`,
      [nextValue, maxValue, today, userId]
    )
  }
}

module.exports = LessonProgressService
