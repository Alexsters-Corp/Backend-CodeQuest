const AppError = require('../core/errors/AppError')
const withTransaction = require('../core/db/withTransaction')

class DiagnosticService {
  constructor({ pool, maxQuestions = 10, startDifficulty = 5 }) {
    this.pool = pool
    this.maxQuestions = maxQuestions
    this.startDifficulty = startDifficulty
  }

  async startTest({ userId, languageId }) {
    const [userLanguages] = await this.pool.query(
      `SELECT id, diagnostico_completado
       FROM usuario_lenguajes
       WHERE usuario_id = ? AND lenguaje_id = ?`,
      [userId, languageId]
    )

    if (userLanguages.length === 0) {
      throw AppError.badRequest('Primero selecciona este lenguaje.')
    }

    if (userLanguages[0].diagnostico_completado) {
      throw AppError.badRequest('Ya completaste el diagnóstico para este lenguaje.')
    }

    await this.pool.query(
      'DELETE FROM respuestas_diagnostico WHERE usuario_id = ? AND lenguaje_id = ?',
      [userId, languageId]
    )

    const [questions] = await this.pool.query(
      `SELECT id, dificultad, tipo, enunciado, codigo, opciones
       FROM preguntas_diagnostico
       WHERE lenguaje_id = ?
       ORDER BY dificultad, RAND()`,
      [languageId]
    )

    if (questions.length === 0) {
      throw AppError.notFound('No hay preguntas diagnósticas para este lenguaje.')
    }

    const firstQuestion =
      questions.find((question) => Number(question.dificultad) >= this.startDifficulty) ||
      questions[0]

    return {
      totalQuestions: questions.length,
      currentLevel: this.startDifficulty,
      question: this.#serializeQuestion(firstQuestion),
    }
  }

  async submitAnswer({ userId, languageId, questionId, answer }) {
    const [questions] = await this.pool.query(
      `SELECT id, dificultad, respuesta_correcta, opciones
       FROM preguntas_diagnostico
       WHERE id = ? AND lenguaje_id = ?`,
      [questionId, languageId]
    )

    if (questions.length === 0) {
      throw AppError.notFound('Pregunta no encontrada.')
    }

    const question = questions[0]
    const correctAnswerText = this.#resolveCorrectAnswerText(question)
    const isCorrect = String(answer).trim() === String(correctAnswerText).trim()

    await this.pool.query(
      `INSERT INTO respuestas_diagnostico (usuario_id, lenguaje_id, pregunta_id, respuesta, es_correcta)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, languageId, questionId, String(answer), isCorrect ? 1 : 0]
    )

    const [history] = await this.pool.query(
      `SELECT rd.pregunta_id, rd.es_correcta, pd.dificultad
       FROM respuestas_diagnostico rd
       JOIN preguntas_diagnostico pd ON pd.id = rd.pregunta_id
       WHERE rd.usuario_id = ? AND rd.lenguaje_id = ?
       ORDER BY rd.fecha`,
      [userId, languageId]
    )

    const totalAnswered = history.length
    const recent = history.slice(-3)
    const recentCorrect = recent.filter((item) => !!item.es_correcta).length
    const recentWrong = recent.filter((item) => !item.es_correcta).length

    let currentDifficulty = Number(question.dificultad)

    if (isCorrect && recentCorrect >= 2) {
      currentDifficulty = Math.min(10, currentDifficulty + 1)
    } else if (!isCorrect && recentWrong >= 2) {
      currentDifficulty = Math.max(1, currentDifficulty - 1)
    }

    if (totalAnswered >= this.maxQuestions) {
      return {
        finished: true,
        isCorrect,
        result: this.calculateDiagnosticResult(history),
      }
    }

    const answeredIds = history.map((item) => item.pregunta_id)

    const [nextQuestions] = await this.pool.query(
      `SELECT id, dificultad, tipo, enunciado, codigo, opciones
       FROM preguntas_diagnostico
       WHERE lenguaje_id = ? AND id NOT IN (?)
       ORDER BY ABS(CAST(dificultad AS SIGNED) - CAST(? AS SIGNED)), RAND()
       LIMIT 1`,
      [languageId, answeredIds.length > 0 ? answeredIds : [0], currentDifficulty]
    )

    if (nextQuestions.length === 0) {
      return {
        finished: true,
        isCorrect,
        result: this.calculateDiagnosticResult(history),
      }
    }

    return {
      finished: false,
      isCorrect,
      questionsAnswered: totalAnswered,
      currentLevel: currentDifficulty,
      question: this.#serializeQuestion(nextQuestions[0]),
    }
  }

  async finishTest({ userId, languageId }) {
    return withTransaction(this.pool, async (db) => {
      const [history] = await db.query(
        `SELECT rd.es_correcta, pd.dificultad
         FROM respuestas_diagnostico rd
         JOIN preguntas_diagnostico pd ON pd.id = rd.pregunta_id
         WHERE rd.usuario_id = ? AND rd.lenguaje_id = ?`,
        [userId, languageId]
      )

      if (history.length === 0) {
        throw AppError.badRequest('No hay respuestas de diagnóstico.')
      }

      const result = this.calculateDiagnosticResult(history)

      await db.query(
        `UPDATE usuario_lenguajes
         SET nivel_diagnostico = ?, puntuacion_diagnostico = ?, diagnostico_completado = 1
         WHERE usuario_id = ? AND lenguaje_id = ?`,
        [result.nivel, result.puntuacion, userId, languageId]
      )

      await this.#initializeModuleProgress(db, { userId, languageId, nivel: result.nivel })

      return {
        message: 'Diagnóstico completado.',
        result,
      }
    })
  }

  calculateDiagnosticResult(history) {
    const correct = history.filter((item) => !!item.es_correcta).length
    const total = history.length
    const percentage = total > 0 ? (correct / total) * 100 : 0

    let weightedScore = 0
    let maxScore = 0

    for (const item of history) {
      const difficulty = Number(item.dificultad || 5)
      maxScore += difficulty
      if (item.es_correcta) {
        weightedScore += difficulty
      }
    }

    const weightedPercentage = maxScore > 0 ? (weightedScore / maxScore) * 100 : 0

    let nivel = 'principiante'
    if (weightedPercentage >= 65) {
      nivel = 'avanzado'
    } else if (weightedPercentage >= 35) {
      nivel = 'intermedio'
    }

    return {
      nivel,
      puntuacion: Math.round(weightedPercentage),
      correctas: correct,
      total,
      porcentaje: Math.round(percentage),
    }
  }

  async #initializeModuleProgress(db, { userId, languageId, nivel }) {
    const [modules] = await db.query(
      'SELECT id, numero FROM modulos WHERE lenguaje_id = ? ORDER BY numero',
      [languageId]
    )

    let unlockUpTo = 0
    if (nivel === 'avanzado') {
      unlockUpTo = 4
    } else if (nivel === 'intermedio') {
      unlockUpTo = 2
    }

    for (const module of modules) {
      let estado = 'bloqueado'
      if (module.numero <= unlockUpTo) {
        estado = 'completado'
      } else if (module.numero === unlockUpTo + 1) {
        estado = 'en_progreso'
      }

      await db.query(
        `INSERT INTO progreso_modulo (usuario_id, modulo_id, estado, porcentaje, fecha_inicio)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE estado = VALUES(estado), porcentaje = VALUES(porcentaje)`,
        [
          userId,
          module.id,
          estado,
          estado === 'completado' ? 100 : 0,
          estado !== 'bloqueado' ? new Date() : null,
        ]
      )
    }
  }

  #resolveCorrectAnswerText(question) {
    let resolved = String(question.respuesta_correcta)

    try {
      const options = this.#parseOptions(question.opciones)
      const index = Number(question.respuesta_correcta)

      if (Array.isArray(options) && Number.isInteger(index) && index >= 0 && index < options.length) {
        resolved = options[index]
      }
    } catch (_error) {
      return resolved
    }

    return resolved
  }

  #serializeQuestion(question) {
    return {
      id: question.id,
      dificultad: question.dificultad,
      tipo: question.tipo,
      enunciado: question.enunciado,
      codigo: question.codigo,
      opciones: this.#parseOptions(question.opciones),
    }
  }

  #parseOptions(options) {
    if (Array.isArray(options)) {
      return options
    }

    if (typeof options !== 'string') {
      return options
    }

    try {
      return JSON.parse(options)
    } catch (_error) {
      return options
    }
  }
}

module.exports = DiagnosticService
