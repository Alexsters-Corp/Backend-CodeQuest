const AppError = require('../core/errors/AppError')
const withTransaction = require('../core/db/withTransaction')

const DIFFICULTY_ORDER_SQL =
  "CASE difficulty_level WHEN 'principiante' THEN 1 WHEN 'intermedio' THEN 2 ELSE 3 END"

const QUESTION_TEMPLATES = [
  {
    minDifficulty: 1,
    maxDifficulty: 3,
    build: ({ languageName }) => ({
      tipo: 'opcion_multiple',
      enunciado: `En ${languageName}, ¿qué palabra clave se usa normalmente para una condición?`,
      codigo: null,
      opciones: ['if', 'for', 'class', 'import'],
      correctAnswer: 'if',
    }),
  },
  {
    minDifficulty: 1,
    maxDifficulty: 3,
    build: ({ languageName }) => ({
      tipo: 'opcion_multiple',
      enunciado: `¿Cuál es la mejor forma de repetir instrucciones varias veces en ${languageName}?`,
      codigo: null,
      opciones: ['while', 'if', 'return', 'break'],
      correctAnswer: 'while',
    }),
  },
  {
    minDifficulty: 2,
    maxDifficulty: 4,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Qué principio promueve no repetir la misma logica en varios lugares?',
      codigo: null,
      opciones: ['DRY', 'YAGNI', 'KISS', 'SOLID'],
      correctAnswer: 'DRY',
    }),
  },
  {
    minDifficulty: 3,
    maxDifficulty: 5,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Que estructura de datos suele ofrecer busquedas promedio en O(1)?',
      codigo: null,
      opciones: ['Hash map', 'Array ordenado', 'Lista enlazada', 'Pila'],
      correctAnswer: 'Hash map',
    }),
  },
  {
    minDifficulty: 4,
    maxDifficulty: 6,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: 'Si una funcion llama a si misma para resolver un problema, hablamos de:',
      codigo: null,
      opciones: ['Recursion', 'Iteracion infinita', 'Compilacion', 'Serializacion'],
      correctAnswer: 'Recursion',
    }),
  },
  {
    minDifficulty: 5,
    maxDifficulty: 7,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Que estructura sigue el patron LIFO?',
      codigo: null,
      opciones: ['Pila', 'Cola', 'Arbol', 'Grafo'],
      correctAnswer: 'Pila',
    }),
  },
  {
    minDifficulty: 6,
    maxDifficulty: 8,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Que beneficio principal tienen las pruebas unitarias?',
      codigo: null,
      opciones: [
        'Detectar regresiones temprano',
        'Reemplazar documentacion',
        'Acelerar internet',
        'Evitar el control de versiones',
      ],
      correctAnswer: 'Detectar regresiones temprano',
    }),
  },
  {
    minDifficulty: 7,
    maxDifficulty: 9,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Que tecnica reduce tiempos al guardar resultados de calculos costosos?',
      codigo: null,
      opciones: ['Memoizacion', 'Minificacion', 'Transpilacion', 'Refactorizacion'],
      correctAnswer: 'Memoizacion',
    }),
  },
  {
    minDifficulty: 8,
    maxDifficulty: 10,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: 'En terminos de complejidad, ¿que crecimiento es mejor para grandes entradas?',
      codigo: null,
      opciones: ['O(log n)', 'O(n^2)', 'O(2^n)', 'O(n!)'],
      correctAnswer: 'O(log n)',
    }),
  },
  {
    minDifficulty: 5,
    maxDifficulty: 10,
    build: () => ({
      tipo: 'opcion_multiple',
      enunciado: '¿Que practica hace mas mantenible un proyecto a largo plazo?',
      codigo: null,
      opciones: [
        'Separar responsabilidades por modulo',
        'Poner toda la logica en un solo archivo',
        'Evitar nombres descriptivos',
        'Ignorar validaciones de entrada',
      ],
      correctAnswer: 'Separar responsabilidades por modulo',
    }),
  },
]

class DiagnosticService {
  constructor({ pool, maxQuestions = 10, startDifficulty = 5 }) {
    this.pool = pool
    this.maxQuestions = maxQuestions
    this.startDifficulty = startDifficulty
  }

  async startTest({ userId, languageId }) {
    const language = await this.#getLanguageOrThrow(languageId)
    await this.#ensureUserLanguageSelection({ userId, languageId })

    const state = {
      step: 1,
      difficulty: this.startDifficulty,
      correct: 0,
    }

    const firstQuestion = this.#buildQuestion({ language, state })

    return {
      totalQuestions: this.maxQuestions,
      currentLevel: this.startDifficulty,
      question: this.#serializeQuestion(firstQuestion),
    }
  }

  async submitAnswer({ userId, languageId, questionId, answer }) {
    const language = await this.#getLanguageOrThrow(languageId)
    await this.#ensureUserLanguageSelection({ userId, languageId })

    const state = this.#decodeQuestionState(questionId)
    const currentQuestion = this.#buildQuestion({ language, state })
    const isCorrect = this.#normalizeText(answer) === this.#normalizeText(currentQuestion.correctAnswer)

    const nextCorrect = state.correct + (isCorrect ? 1 : 0)

    if (state.step >= this.maxQuestions) {
      const result = this.calculateDiagnosticResult({
        correct: nextCorrect,
        total: this.maxQuestions,
      })

      await this.#applyDiagnosticOutcome({
        userId,
        languageId,
        nivel: result.nivel,
      })

      return {
        finished: true,
        isCorrect,
        result,
      }
    }

    const nextState = {
      step: state.step + 1,
      difficulty: this.#adjustDifficulty(state.difficulty, isCorrect),
      correct: nextCorrect,
    }

    const nextQuestion = this.#buildQuestion({ language, state: nextState })

    return {
      finished: false,
      isCorrect,
      questionsAnswered: state.step,
      currentLevel: nextState.difficulty,
      question: this.#serializeQuestion(nextQuestion),
    }
  }

  async finishTest({ userId, languageId }) {
    await this.#ensureUserLanguageSelection({ userId, languageId })

    return {
      message: 'Diagnóstico completado.',
    }
  }

  calculateDiagnosticResult({ correct, total }) {
    const percentage = total > 0 ? (correct / total) * 100 : 0

    let nivel = 'principiante'
    if (percentage >= 70) {
      nivel = 'avanzado'
    } else if (percentage >= 40) {
      nivel = 'intermedio'
    }

    return {
      nivel,
      puntuacion: Math.round(percentage),
      correctas: correct,
      total,
      porcentaje: Math.round(percentage),
    }
  }

  #adjustDifficulty(currentDifficulty, isCorrect) {
    const delta = isCorrect ? 1 : -1
    return Math.max(1, Math.min(10, Number(currentDifficulty || this.startDifficulty) + delta))
  }

  async #applyDiagnosticOutcome({ userId, languageId, nivel }) {
    return withTransaction(this.pool, async (db) => {
      const [pathRows] = await db.query(
        `SELECT id, difficulty_level
         FROM learning_paths
         WHERE programming_language_id = ? AND is_active = 1
         ORDER BY ${DIFFICULTY_ORDER_SQL}, id`,
        [languageId]
      )

      if (pathRows.length === 0) {
        throw AppError.notFound('No hay rutas activas para este lenguaje.')
      }

      let selectedPath = pathRows.find((row) => row.difficulty_level === nivel)

      if (!selectedPath) {
        selectedPath = pathRows[0]
      }

      await db.query(
        `DELETE ulp
         FROM user_learning_paths ulp
         JOIN learning_paths lp ON lp.id = ulp.learning_path_id
         WHERE ulp.user_id = ?
           AND lp.programming_language_id = ?
           AND ulp.learning_path_id <> ?`,
        [userId, languageId, selectedPath.id]
      )

      await db.query(
        `INSERT INTO user_learning_paths (user_id, learning_path_id, progress_percentage, selected_at, last_accessed_at)
         VALUES (?, ?, 0.00, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           learning_path_id = VALUES(learning_path_id),
           selected_at = NOW(),
           last_accessed_at = NOW()`,
        [userId, selectedPath.id]
      )

      await db.query(
        `INSERT IGNORE INTO user_stats (
           user_id,
           total_xp,
           current_level,
           lessons_completed,
           submissions_total,
           submissions_accepted,
           streak_current,
           streak_longest,
           last_activity_date
         )
         VALUES (?, 0, 1, 0, 0, 0, 0, 0, NULL)`,
        [userId]
      )
    })
  }

  async #ensureUserLanguageSelection({ userId, languageId }) {
    await withTransaction(this.pool, async (db) => {
      const [selectedRows] = await db.query(
        `SELECT ulp.learning_path_id
         FROM user_learning_paths ulp
         JOIN learning_paths lp ON lp.id = ulp.learning_path_id
         WHERE ulp.user_id = ? AND lp.programming_language_id = ?
         LIMIT 1`,
        [userId, languageId]
      )

      if (selectedRows.length === 0) {
        const [defaultPathRows] = await db.query(
          `SELECT id
           FROM learning_paths
           WHERE programming_language_id = ? AND is_active = 1
           ORDER BY ${DIFFICULTY_ORDER_SQL}, id
           LIMIT 1`,
          [languageId]
        )

        if (defaultPathRows.length === 0) {
          throw AppError.notFound('No hay rutas activas para este lenguaje.')
        }

        await db.query(
          `DELETE ulp
           FROM user_learning_paths ulp
           JOIN learning_paths lp ON lp.id = ulp.learning_path_id
           WHERE ulp.user_id = ?
             AND lp.programming_language_id = ?
             AND ulp.learning_path_id <> ?`,
          [userId, languageId, defaultPathRows[0].id]
        )

        await db.query(
          `INSERT INTO user_learning_paths (user_id, learning_path_id, progress_percentage, selected_at, last_accessed_at)
           VALUES (?, ?, 0.00, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             learning_path_id = VALUES(learning_path_id),
             selected_at = NOW(),
             last_accessed_at = NOW()`,
          [userId, defaultPathRows[0].id]
        )
      }

      await db.query(
        `INSERT IGNORE INTO user_stats (
           user_id,
           total_xp,
           current_level,
           lessons_completed,
           submissions_total,
           submissions_accepted,
           streak_current,
           streak_longest,
           last_activity_date
         )
         VALUES (?, 0, 1, 0, 0, 0, 0, 0, NULL)`,
        [userId]
      )
    })
  }

  async #getLanguageOrThrow(languageId) {
    const [rows] = await this.pool.query(
      `SELECT id, name, display_name, slug
       FROM programming_languages
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [languageId]
    )

    if (rows.length === 0) {
      throw AppError.notFound('Lenguaje no encontrado.')
    }

    return rows[0]
  }

  #encodeQuestionState({ step, difficulty, correct }) {
    return step * 10000 + difficulty * 100 + correct
  }

  #decodeQuestionState(questionId) {
    const encoded = Number(questionId)
    const step = Math.floor(encoded / 10000)
    const difficulty = Math.floor((encoded % 10000) / 100)
    const correct = encoded % 100

    if (
      !Number.isInteger(step) ||
      !Number.isInteger(difficulty) ||
      !Number.isInteger(correct) ||
      step < 1 ||
      step > this.maxQuestions ||
      difficulty < 1 ||
      difficulty > 10 ||
      correct < 0 ||
      correct > this.maxQuestions
    ) {
      throw AppError.badRequest('questionId invalido para el estado del diagnóstico.')
    }

    return { step, difficulty, correct }
  }

  #buildQuestion({ language, state }) {
    const templates = QUESTION_TEMPLATES.filter(
      (template) => state.difficulty >= template.minDifficulty && state.difficulty <= template.maxDifficulty
    )

    const availableTemplates = templates.length > 0 ? templates : QUESTION_TEMPLATES
    const seed = Number(language.id) * 17 + state.step * 11 + state.difficulty * 7 + state.correct * 3
    const selectedTemplate = availableTemplates[seed % availableTemplates.length]
    const rawQuestion = selectedTemplate.build({
      languageName: language.display_name || language.name,
      languageSlug: language.slug,
    })

    return {
      id: this.#encodeQuestionState(state),
      dificultad: state.difficulty,
      tipo: rawQuestion.tipo,
      enunciado: rawQuestion.enunciado,
      codigo: rawQuestion.codigo || null,
      opciones: this.#shuffleDeterministic(rawQuestion.opciones, seed),
      correctAnswer: rawQuestion.correctAnswer,
    }
  }

  #serializeQuestion(question) {
    return {
      id: question.id,
      dificultad: question.dificultad,
      tipo: question.tipo,
      enunciado: question.enunciado,
      codigo: question.codigo,
      opciones: question.opciones,
    }
  }

  #shuffleDeterministic(options, seed) {
    const shuffled = [...options]
    let value = seed || 1

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      value = (value * 9301 + 49297) % 233280
      const randomIndex = value % (index + 1)
      const temp = shuffled[index]
      shuffled[index] = shuffled[randomIndex]
      shuffled[randomIndex] = temp
    }

    return shuffled
  }

  #normalizeText(value) {
    return String(value ?? '')
      .replace(/\r\n/g, '\n')
      .trim()
      .toLowerCase()
  }
}

module.exports = DiagnosticService
