const pool = require('../config/db')

/**
 * GET /api/lessons/modules?languageId=1
 * Lista módulos de un lenguaje con su progreso para el usuario.
 */
const getModules = async (req, res) => {
  try {
    const { languageId } = req.query
    const userId = req.user.id

    if (!languageId) {
      return res.status(400).json({ message: 'languageId es obligatorio.' })
    }

    const [modules] = await pool.query(
      `SELECT m.id, m.nombre, m.descripcion, m.numero, m.icono, m.xp_recompensa,
              COALESCE(pm.estado, 'bloqueado') AS estado,
              COALESCE(pm.porcentaje, 0) AS porcentaje
       FROM modulos m
       LEFT JOIN progreso_modulo pm ON pm.modulo_id = m.id AND pm.usuario_id = ?
       WHERE m.lenguaje_id = ? AND m.activo = 1
       ORDER BY m.numero`,
      [userId, languageId]
    )

    return res.status(200).json(modules)
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * GET /api/lessons/module/:moduleId
 * Lista lecciones de un módulo con su progreso.
 */
const getLessons = async (req, res) => {
  try {
    const { moduleId } = req.params
    const userId = req.user.id

    // Verificar que el módulo no está bloqueado
    const [progreso] = await pool.query(
      `SELECT estado FROM progreso_modulo WHERE modulo_id = ? AND usuario_id = ?`,
      [moduleId, userId]
    )

    if (progreso.length > 0 && progreso[0].estado === 'bloqueado') {
      return res.status(403).json({ message: 'Este módulo está bloqueado.' })
    }

    const [lessons] = await pool.query(
      `SELECT l.id, l.titulo, l.descripcion, l.numero, l.tipo, l.xp_recompensa,
              COALESCE(pl.estado, 'bloqueado') AS estado,
              pl.puntuacion_mejor
       FROM lecciones l
       LEFT JOIN progreso_leccion pl ON pl.leccion_id = l.id AND pl.usuario_id = ?
       WHERE l.modulo_id = ? AND l.activo = 1
       ORDER BY l.numero`,
      [userId, moduleId]
    )

    // Si no hay progreso de lecciones, desbloquear la primera
    const anyUnlocked = lessons.some(l => l.estado !== 'bloqueado')
    if (!anyUnlocked && lessons.length > 0) {
      lessons[0].estado = 'disponible'
      // Crear registro de progreso para la primera lección
      await pool.query(
        `INSERT IGNORE INTO progreso_leccion (usuario_id, leccion_id, estado, fecha_inicio)
         VALUES (?, ?, 'disponible', NOW())`,
        [userId, lessons[0].id]
      )
    }

    return res.status(200).json(lessons)
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * GET /api/lessons/:lessonId
 * Obtiene el contenido de una lección: teoría + ejercicios.
 */
const getLessonContent = async (req, res) => {
  try {
    const { lessonId } = req.params
    const userId = req.user.id

    // Info de la lección
    const [lessons] = await pool.query(
      `SELECT l.*, m.nombre AS modulo_nombre, m.lenguaje_id
       FROM lecciones l
       JOIN modulos m ON m.id = l.modulo_id
       WHERE l.id = ?`,
      [lessonId]
    )

    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lección no encontrada.' })
    }

    const lesson = lessons[0]

    // Ejercicios de la lección
    const [exercises] = await pool.query(
      `SELECT id, tipo, enunciado, codigo_base, opciones, pista, xp_recompensa, numero
       FROM ejercicios
       WHERE leccion_id = ? AND activo = 1
       ORDER BY numero`,
      [lessonId]
    )

    // Parsear opciones JSON
    for (const ex of exercises) {
      if (typeof ex.opciones === 'string') {
        try {
          ex.opciones = JSON.parse(ex.opciones)
        } catch (e) {
          ex.opciones = null
        }
      }
    }

    // Intentos previos del usuario en esta lección
    const exerciseIds = exercises.map(e => e.id)
    let attempts = []
    if (exerciseIds.length > 0) {
      const [rows] = await pool.query(
        `SELECT ejercicio_id, MAX(es_correcto) AS resuelto
         FROM intentos_ejercicio
         WHERE usuario_id = ? AND ejercicio_id IN (?)
         GROUP BY ejercicio_id`,
        [userId, exerciseIds]
      )
      attempts = rows
    }

    const attemptMap = {}
    for (const a of attempts) {
      attemptMap[a.ejercicio_id] = !!a.resuelto
    }

    // Añadir estado a cada ejercicio
    for (const ex of exercises) {
      ex.resuelto = attemptMap[ex.id] || false
    }

    return res.status(200).json({
      lesson: {
        id: lesson.id,
        titulo: lesson.titulo,
        descripcion: lesson.descripcion,
        contenido_teoria: lesson.contenido_teoria,
        tipo: lesson.tipo,
        xp_recompensa: lesson.xp_recompensa,
        modulo_nombre: lesson.modulo_nombre,
        lenguaje_id: lesson.lenguaje_id,
      },
      exercises,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * POST /api/lessons/exercise/submit
 * Body: { exerciseId, answer }
 * Evalúa la respuesta del usuario.
 */
const submitExercise = async (req, res) => {
  try {
    const { exerciseId, answer } = req.body
    const userId = req.user.id

    if (!exerciseId || answer === undefined) {
      return res.status(400).json({ message: 'exerciseId y answer son obligatorios.' })
    }

    // Obtener ejercicio con respuesta correcta
    const [exercises] = await pool.query(
      `SELECT e.*, l.modulo_id, l.xp_recompensa AS leccion_xp
       FROM ejercicios e
       JOIN lecciones l ON l.id = e.leccion_id
       WHERE e.id = ?`,
      [exerciseId]
    )

    if (exercises.length === 0) {
      return res.status(404).json({ message: 'Ejercicio no encontrado.' })
    }

    const exercise = exercises[0]

    // Evaluar respuesta
    let isCorrect = false
    const correctAnswer = String(exercise.respuesta_correcta).trim()
    const userAnswer = String(answer).trim()

    switch (exercise.tipo) {
      case 'opcion_multiple':
      case 'verdadero_falso':
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        break
      case 'completar_codigo':
        isCorrect = userAnswer === correctAnswer
        break
      case 'ordenar_codigo':
        isCorrect = userAnswer === correctAnswer
        break
      default:
        isCorrect = userAnswer === correctAnswer
    }

    // Registrar intento
    const xpGained = isCorrect ? exercise.xp_recompensa : 0
    await pool.query(
      `INSERT INTO intentos_ejercicio (usuario_id, ejercicio_id, respuesta, es_correcto, xp_ganado)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, exerciseId, userAnswer, isCorrect ? 1 : 0, xpGained]
    )

    // Si es correcto, sumar XP
    if (isCorrect) {
      // Verificar que no haya ganado XP previamente por este ejercicio
      const [prevCorrect] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM intentos_ejercicio
         WHERE usuario_id = ? AND ejercicio_id = ? AND es_correcto = 1`,
        [userId, exerciseId]
      )

      if (prevCorrect[0].cnt <= 1) {
        // Primera vez correcto - dar XP
        await pool.query(
          `INSERT INTO xp_transacciones (usuario_id, cantidad, tipo, referencia_tipo, referencia_id, descripcion)
           VALUES (?, ?, 'ejercicio', 'ejercicio', ?, ?)`,
          [userId, xpGained, exerciseId, `Ejercicio completado`]
        )

        // Actualizar XP total del usuario
        await pool.query(
          `UPDATE usuarios SET xp_total = COALESCE(xp_total, 0) + ? WHERE id = ?`,
          [xpGained, userId]
        )

        // Actualizar racha
        await updateStreak(userId)
      }

      // Verificar si completó la lección
      await checkLessonCompletion(userId, exercise.leccion_id)
    }

    return res.status(200).json({
      isCorrect,
      correctAnswer: isCorrect ? null : correctAnswer,
      xpGained,
      hint: !isCorrect ? exercise.pista : null,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * Verificar si el usuario completó todos los ejercicios de una lección.
 */
async function checkLessonCompletion(userId, lessonId) {
  const [totalEx] = await pool.query(
    `SELECT COUNT(*) AS total FROM ejercicios WHERE leccion_id = ? AND activo = 1`,
    [lessonId]
  )

  const [completedEx] = await pool.query(
    `SELECT COUNT(DISTINCT e.id) AS completados
     FROM ejercicios e
     JOIN intentos_ejercicio ie ON ie.ejercicio_id = e.id AND ie.usuario_id = ? AND ie.es_correcto = 1
     WHERE e.leccion_id = ? AND e.activo = 1`,
    [userId, lessonId]
  )

  if (completedEx[0].completados >= totalEx[0].total && totalEx[0].total > 0) {
    // Marcar lección completada
    await pool.query(
      `UPDATE progreso_leccion SET estado = 'completada', fecha_completado = NOW()
       WHERE usuario_id = ? AND leccion_id = ?`,
      [userId, lessonId]
    )

    // Desbloquear siguiente lección
    const [currentLesson] = await pool.query(
      `SELECT modulo_id, numero FROM lecciones WHERE id = ?`, [lessonId]
    )

    if (currentLesson.length > 0) {
      const [nextLesson] = await pool.query(
        `SELECT id FROM lecciones WHERE modulo_id = ? AND numero = ? AND activo = 1`,
        [currentLesson[0].modulo_id, currentLesson[0].numero + 1]
      )

      if (nextLesson.length > 0) {
        await pool.query(
          `INSERT INTO progreso_leccion (usuario_id, leccion_id, estado, fecha_inicio)
           VALUES (?, ?, 'disponible', NOW())
           ON DUPLICATE KEY UPDATE estado = IF(estado = 'bloqueado', 'disponible', estado)`,
          [userId, nextLesson[0].id]
        )
      } else {
        // No hay más lecciones — verificar finalización del módulo
        await checkModuleCompletion(userId, currentLesson[0].modulo_id)
      }
    }
  }
}

/**
 * Verificar si el usuario completó todos las lecciones de un módulo.
 */
async function checkModuleCompletion(userId, moduleId) {
  const [totalLessons] = await pool.query(
    `SELECT COUNT(*) AS total FROM lecciones WHERE modulo_id = ? AND activo = 1`,
    [moduleId]
  )

  const [completedLessons] = await pool.query(
    `SELECT COUNT(*) AS completadas FROM progreso_leccion pl
     JOIN lecciones l ON l.id = pl.leccion_id
     WHERE l.modulo_id = ? AND pl.usuario_id = ? AND pl.estado = 'completada'`,
    [moduleId, userId]
  )

  if (completedLessons[0].completadas >= totalLessons[0].total && totalLessons[0].total > 0) {
    // Marcar módulo completado
    await pool.query(
      `UPDATE progreso_modulo SET estado = 'completado', porcentaje = 100, fecha_completado = NOW()
       WHERE usuario_id = ? AND modulo_id = ?`,
      [userId, moduleId]
    )

    // XP bonus por módulo
    const [mod] = await pool.query(`SELECT xp_recompensa, lenguaje_id, numero FROM modulos WHERE id = ?`, [moduleId])
    if (mod.length > 0 && mod[0].xp_recompensa) {
      await pool.query(
        `INSERT INTO xp_transacciones (usuario_id, cantidad, tipo, referencia_tipo, referencia_id, descripcion)
         VALUES (?, ?, 'modulo', 'modulo', ?, 'Modulo completado')`,
        [userId, mod[0].xp_recompensa, moduleId]
      )
      await pool.query(
        `UPDATE usuarios SET xp_total = COALESCE(xp_total, 0) + ? WHERE id = ?`,
        [mod[0].xp_recompensa, userId]
      )
    }

    // Desbloquear siguiente módulo
    if (mod.length > 0) {
      const [nextModule] = await pool.query(
        `SELECT id FROM modulos WHERE lenguaje_id = ? AND numero = ? AND activo = 1`,
        [mod[0].lenguaje_id, mod[0].numero + 1]
      )
      if (nextModule.length > 0) {
        await pool.query(
          `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
           VALUES (?, ?, 'en_progreso', 0, NOW())
           ON DUPLICATE KEY UPDATE estado = IF(estado = 'bloqueado', 'en_progreso', estado)`,
          [userId, nextModule[0].id]
        )
      }
    }
  } else {
    // Actualizar porcentaje
    const pct = Math.round((completedLessons[0].completadas / totalLessons[0].total) * 100)
    await pool.query(
      `UPDATE progreso_modulo SET porcentaje = ? WHERE usuario_id = ? AND modulo_id = ?`,
      [pct, userId, moduleId]
    )
  }
}

/**
 * Actualizar racha del usuario.
 */
async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0]

  const [rachas] = await pool.query(
    `SELECT * FROM rachas WHERE usuario_id = ? LIMIT 1`, [userId]
  )

  if (rachas.length === 0) {
    await pool.query(
      `INSERT INTO rachas (usuario_id, racha_actual, racha_maxima, ultimo_dia_activo)
       VALUES (?, 1, 1, ?)`,
      [userId, today]
    )
    return
  }

  const racha = rachas[0]
  const lastActive = new Date(racha.ultimo_dia_activo).toISOString().split('T')[0]

  if (lastActive === today) return // Ya contada hoy

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak
  if (lastActive === yesterdayStr) {
    newStreak = racha.racha_actual + 1
  } else {
    newStreak = 1 // Racha rota
  }

  const maxStreak = Math.max(newStreak, racha.racha_maxima)

  await pool.query(
    `UPDATE rachas SET racha_actual = ?, racha_maxima = ?, ultimo_dia_activo = ? WHERE usuario_id = ?`,
    [newStreak, maxStreak, today, userId]
  )
}

module.exports = { getModules, getLessons, getLessonContent, submitExercise }
