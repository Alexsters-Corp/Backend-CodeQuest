const pool = require('../config/db')

/**
 * GET /api/diagnostic/start?languageId=1
 * Inicia el test diagnóstico. Devuelve la primera pregunta de dificultad 5 (media).
 */
const startTest = async (req, res) => {
  try {
    const { languageId } = req.query
    const userId = req.user.id

    if (!languageId) {
      return res.status(400).json({ message: 'languageId es obligatorio.' })
    }

    // Verificar que el usuario tiene este lenguaje seleccionado
    const [ul] = await pool.query(
      'SELECT id, diagnostico_completado FROM usuario_lenguajes WHERE usuario_id = ? AND lenguaje_id = ?',
      [userId, languageId]
    )
    if (ul.length === 0) {
      return res.status(400).json({ message: 'Primero selecciona este lenguaje.' })
    }
    if (ul[0].diagnostico_completado) {
      return res.status(400).json({ message: 'Ya completaste el diagnóstico para este lenguaje.' })
    }

    // Limpiar respuestas previas incompletas
    await pool.query(
      'DELETE FROM respuestas_diagnostico WHERE usuario_id = ? AND lenguaje_id = ?',
      [userId, languageId]
    )

    // Obtener todas las preguntas para este lenguaje, agrupadas por dificultad
    const [questions] = await pool.query(
      'SELECT id, dificultad, tipo, enunciado, codigo, opciones FROM preguntas_diagnostico WHERE lenguaje_id = ? ORDER BY dificultad, RAND()',
      [languageId]
    )

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No hay preguntas diagnósticas para este lenguaje.' })
    }

    // Empezar con dificultad 5 (media) — encontrar la más cercana
    const startDifficulty = 5
    let firstQuestion = questions.find(q => q.dificultad >= startDifficulty) || questions[0]

    // Parsear opciones
    if (typeof firstQuestion.opciones === 'string') {
      firstQuestion.opciones = JSON.parse(firstQuestion.opciones)
    }

    return res.status(200).json({
      totalQuestions: questions.length,
      currentLevel: startDifficulty,
      question: {
        id: firstQuestion.id,
        dificultad: firstQuestion.dificultad,
        tipo: firstQuestion.tipo,
        enunciado: firstQuestion.enunciado,
        codigo: firstQuestion.codigo,
        opciones: firstQuestion.opciones,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * POST /api/diagnostic/answer
 * Body: { languageId, questionId, answer }
 * Registra respuesta y devuelve la siguiente pregunta (adaptativa).
 */
const submitAnswer = async (req, res) => {
  try {
    const { languageId, questionId, answer } = req.body
    const userId = req.user.id

    if (!languageId || !questionId || answer === undefined) {
      return res.status(400).json({ message: 'languageId, questionId y answer son obligatorios.' })
    }

    // Obtener la pregunta con sus opciones
    const [questions] = await pool.query(
      'SELECT id, dificultad, respuesta_correcta, opciones FROM preguntas_diagnostico WHERE id = ?',
      [questionId]
    )
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada.' })
    }

    const question = questions[0]

    // respuesta_correcta es un índice numérico (0, 1, 2, 3)
    // El frontend envía el texto de la opción seleccionada
    // Necesitamos resolver el índice al texto real para comparar
    let correctAnswerText = String(question.respuesta_correcta)
    try {
      const opts = typeof question.opciones === 'string'
        ? JSON.parse(question.opciones)
        : question.opciones
      const idx = Number(question.respuesta_correcta)
      if (Array.isArray(opts) && !isNaN(idx) && idx >= 0 && idx < opts.length) {
        correctAnswerText = opts[idx]
      }
    } catch (_) { /* si falla el parse, comparar tal cual */ }

    const isCorrect = String(answer).trim() === String(correctAnswerText).trim()

    // Guardar respuesta
    await pool.query(
      'INSERT INTO respuestas_diagnostico (usuario_id, lenguaje_id, pregunta_id, respuesta, es_correcta) VALUES (?, ?, ?, ?, ?)',
      [userId, languageId, questionId, String(answer), isCorrect ? 1 : 0]
    )

    // Obtener historial de respuestas en este test
    const [history] = await pool.query(
      'SELECT pregunta_id, es_correcta FROM respuestas_diagnostico WHERE usuario_id = ? AND lenguaje_id = ? ORDER BY fecha',
      [userId, languageId]
    )

    const totalAnswered = history.length
    const recentCorrect = history.slice(-3).filter(h => h.es_correcta).length
    const recentWrong = history.slice(-3).filter(h => !h.es_correcta).length

    // Calcular nuevo nivel estimado según algoritmo adaptativo
    let currentDifficulty = question.dificultad

    if (isCorrect && recentCorrect >= 2) {
      currentDifficulty = Math.min(10, currentDifficulty + 1)
    } else if (!isCorrect && recentWrong >= 2) {
      currentDifficulty = Math.max(1, currentDifficulty - 1)
    }

    // Condición de terminación: >= 8 respuestas o respondidas todas
    const answeredIds = history.map(h => h.pregunta_id)
    const maxQuestions = 10

    if (totalAnswered >= maxQuestions) {
      // Calcular resultado final
      const result = calculateDiagnosticResult(history, languageId)
      return res.status(200).json({
        finished: true,
        isCorrect,
        result,
      })
    }

    // Buscar siguiente pregunta no respondida, cercana a la dificultad actual
    // CAST a SIGNED para evitar overflow con columnas UNSIGNED
    const [nextQuestions] = await pool.query(
      `SELECT id, dificultad, tipo, enunciado, codigo, opciones
       FROM preguntas_diagnostico
       WHERE lenguaje_id = ? AND id NOT IN (?)
       ORDER BY ABS(CAST(dificultad AS SIGNED) - CAST(? AS SIGNED)), RAND()
       LIMIT 1`,
      [languageId, answeredIds.length > 0 ? answeredIds : [0], currentDifficulty]
    )

    if (nextQuestions.length === 0) {
      // No quedan preguntas, finalizar
      const result = calculateDiagnosticResult(history, languageId)
      return res.status(200).json({
        finished: true,
        isCorrect,
        result,
      })
    }

    const next = nextQuestions[0]
    if (typeof next.opciones === 'string') {
      next.opciones = JSON.parse(next.opciones)
    }

    return res.status(200).json({
      finished: false,
      isCorrect,
      questionsAnswered: totalAnswered,
      currentLevel: currentDifficulty,
      question: {
        id: next.id,
        dificultad: next.dificultad,
        tipo: next.tipo,
        enunciado: next.enunciado,
        codigo: next.codigo,
        opciones: next.opciones,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * POST /api/diagnostic/finish
 * Body: { languageId }
 * Finaliza el test y guarda el resultado.
 */
const finishTest = async (req, res) => {
  try {
    const { languageId } = req.body
    const userId = req.user.id

    const [history] = await pool.query(
      `SELECT rd.es_correcta, pd.dificultad
       FROM respuestas_diagnostico rd
       JOIN preguntas_diagnostico pd ON pd.id = rd.pregunta_id
       WHERE rd.usuario_id = ? AND rd.lenguaje_id = ?`,
      [userId, languageId]
    )

    if (history.length === 0) {
      return res.status(400).json({ message: 'No hay respuestas de diagnóstico.' })
    }

    const result = calculateDiagnosticResult(history)

    // Guardar resultado
    await pool.query(
      `UPDATE usuario_lenguajes
       SET nivel_diagnostico = ?, puntuacion_diagnostico = ?, diagnostico_completado = 1
       WHERE usuario_id = ? AND lenguaje_id = ?`,
      [result.nivel, result.puntuacion, userId, languageId]
    )

    // Inicializar progreso de módulos según nivel
    await initializeModuleProgress(userId, languageId, result.nivel)

    return res.status(200).json({
      message: 'Diagnóstico completado.',
      result,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error interno.', error: error.message })
  }
}

/**
 * Calcula el nivel basado en el historial de respuestas.
 */
function calculateDiagnosticResult(history) {
  const correct = history.filter(h => h.es_correcta).length
  const total = history.length
  const percentage = (correct / total) * 100

  // Ponderar por dificultad
  let weightedScore = 0
  let maxScore = 0
  for (const h of history) {
    const difficulty = h.dificultad || 5
    maxScore += difficulty
    if (h.es_correcta) {
      weightedScore += difficulty
    }
  }

  const weightedPercentage = maxScore > 0 ? (weightedScore / maxScore) * 100 : 0

  let nivel
  let puntuacion = Math.round(weightedPercentage)

  if (weightedPercentage >= 65) {
    nivel = 'avanzado'
  } else if (weightedPercentage >= 35) {
    nivel = 'intermedio'
  } else {
    nivel = 'principiante'
  }

  return {
    nivel,
    puntuacion,
    correctas: correct,
    total,
    porcentaje: Math.round(percentage),
  }
}

/**
 * Inicializa el progreso de los módulos según el nivel del diagnóstico.
 */
async function initializeModuleProgress(userId, languageId, nivel) {
  const [modules] = await pool.query(
    'SELECT id, numero FROM modulos WHERE lenguaje_id = ? ORDER BY numero',
    [languageId]
  )

  let unlockUpTo
  switch (nivel) {
    case 'avanzado':
      unlockUpTo = 4 // Desbloquear hasta módulo 4, empezar en 5
      break
    case 'intermedio':
      unlockUpTo = 2 // Desbloquear hasta módulo 2, empezar en 3
      break
    default:
      unlockUpTo = 0 // Empezar desde el inicio
  }

  for (const mod of modules) {
    let estado
    if (mod.numero <= unlockUpTo) {
      estado = 'completado'
    } else if (mod.numero === unlockUpTo + 1) {
      estado = 'en_progreso'
    } else {
      estado = 'bloqueado'
    }

    await pool.query(
      `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE estado = VALUES(estado), porcentaje = VALUES(porcentaje)`,
      [userId, mod.id, estado, estado === 'completado' ? 100 : 0, estado !== 'bloqueado' ? new Date() : null]
    )
  }
}

module.exports = { startTest, submitAnswer, finishTest }
