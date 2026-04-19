const { AppError } = require('@codequest/shared')

const DIFFICULTY_RANK = {
  principiante: 1,
  intermedio: 2,
  avanzado: 3,
}

function normalizeDifficulty(value) {
  if (typeof value !== 'string') {
    return 'principiante'
  }

  return DIFFICULTY_RANK[value] ? value : 'principiante'
}

function sortPathsByDifficulty(paths) {
  return [...paths].sort((a, b) => {
    const rankA = DIFFICULTY_RANK[normalizeDifficulty(a.difficulty_level)]
    const rankB = DIFFICULTY_RANK[normalizeDifficulty(b.difficulty_level)]

    if (rankA !== rankB) {
      return rankA - rankB
    }

    return Number(a.id) - Number(b.id)
  })
}

function resolveAssignedLevel(scorePercentage) {
  if (scorePercentage >= 75) {
    return 'avanzado'
  }

  if (scorePercentage >= 45) {
    return 'intermedio'
  }

  return 'principiante'
}

function pickBestPathForLevel(paths, level) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return null
  }

  const sorted = sortPathsByDifficulty(paths)
  const targetRank = DIFFICULTY_RANK[normalizeDifficulty(level)]

  const exact = sorted.find((path) => normalizeDifficulty(path.difficulty_level) === level)
  if (exact) {
    return exact
  }

  return sorted
    .map((path) => ({
      path,
      distance: Math.abs(DIFFICULTY_RANK[normalizeDifficulty(path.difficulty_level)] - targetRank),
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance
      }

      return Number(a.path.id) - Number(b.path.id)
    })[0]?.path || null
}

function toRoundedNumber(value, decimals = 2) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    return 0
  }

  const factor = 10 ** decimals
  return Math.round(normalized * factor) / factor
}

function normalizeAnswers(answers) {
  if (!Array.isArray(answers)) {
    throw AppError.badRequest('answers debe ser una lista.', 'VALIDATION_ERROR')
  }

  const map = new Map()

  answers.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw AppError.badRequest(`answers[${index}] no es válido.`, 'VALIDATION_ERROR')
    }

    const questionId = String(item.questionId || '').trim()
    if (!questionId) {
      throw AppError.badRequest(`answers[${index}].questionId es requerido.`, 'VALIDATION_ERROR')
    }

    const selectedOption = Number(item.selectedOption)
    if (!Number.isInteger(selectedOption) || selectedOption < 0) {
      throw AppError.badRequest(`answers[${index}].selectedOption es inválido.`, 'VALIDATION_ERROR')
    }

    map.set(questionId, selectedOption)
  })

  return map
}

function stripLeadingHeading(content) {
  const html = String(content || '')
  return html.replace(/^\s*<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>\s*/i, '').trim()
}

function normalizeComparableText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function stripTrailingSemicolon(value) {
  return String(value || '').replace(/;+\s*$/, '').trim()
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function createInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CQ-'
  for (let index = 0; index < 8; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function repairMojibake(value) {
  return String(value || '')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã'/g, 'Ñ')
    .replace(/Â¿/g, '¿')
    .replace(/Â¡/g, '¡')
    .replace(/â|â/g, '"')
    .replace(/â/g, "'")
    .replace(/â|â/g, '-')
    .replace(/\uFFFD/g, '')
}

function sanitizeDisplayText(value) {
  return repairMojibake(value).replace(/\s+/g, ' ').trim()
}

function hasCorruptedGlyphs(value) {
  const text = String(value || '')
  return /�|Ã|Â|â|\?\?|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text)
}

/**
 * Construye el banco de ejercicios de una lección a partir de los datos de BD.
 * Lanza un error si la lección no tiene solución registrada en lesson_solutions,
 * ya que los ejercicios son datos de negocio y deben vivir en la base de datos.
 *
 * @param {object} lesson     - fila de la BD con los datos de la lección
 * @param {object} dbSolution - fila de lesson_solutions (requerida)
 * @throws {AppError} si dbSolution es null o le faltan campos obligatorios
 */
function buildLessonExerciseBank(lesson, dbSolution) {
  if (!dbSolution) {
    throw AppError.notFound(
      'Esta lección no tiene ejercicios configurados. Contacta al administrador.',
      'LESSON_EXERCISES_NOT_FOUND'
    )
  }

  const missingFields = ['prompt', 'base_code', 'solution_code', 'explanation'].filter(
    (field) => !String(dbSolution[field] || '').trim()
  )

  if (missingFields.length > 0) {
    throw AppError.serviceUnavailable(
      `La configuracion del ejercicio de la leccion esta incompleta (faltan: ${missingFields.join(', ')}).`,
      'LESSON_EXERCISES_INCOMPLETE'
    )
  }

  const lessonTitle = sanitizeDisplayText(lesson.title || 'la leccion') || 'la leccion'
  const rawDescription = sanitizeDisplayText(lesson.description || '')
  const inferredDescription =
    `Comprender los fundamentos de "${lessonTitle}" y aplicarlos en ejercicios practicos.`
  const lessonDescription =
    rawDescription && !hasCorruptedGlyphs(rawDescription) ? rawDescription : inferredDescription

  const totalXp = Math.max(0, Number(lesson.xp_reward || 0))
  const baseExerciseXp = Math.floor(totalXp / 3)
  const finalExerciseXp = totalXp - baseExerciseXp * 2

  return [
    {
      id: 'code-core',
      tipo: 'completar_codigo',
      enunciado: dbSolution.prompt.trim(),
      codigo_base: dbSolution.base_code.trim(),
      opciones: [],
      pista: dbSolution.explanation.trim(),
      numero: 1,
      xp_recompensa: baseExerciseXp,
      validator: {
        type: 'exact_text',
        expected: dbSolution.solution_code.trim(),
      },
    },
    {
      id: 'concept-core',
      tipo: 'opcion_multiple',
      enunciado: `¿Cuál de estas opciones describe mejor el objetivo principal de "${lessonTitle}"?`,
      opciones: [
        lessonDescription,
        'Memorizar sintaxis sin practicar.',
        'Evitar depurar errores para avanzar más rápido.',
        'Ignorar las bases y comenzar por temas avanzados.',
      ],
      pista: 'Piensa en la explicación principal de la teoría.',
      numero: 2,
      xp_recompensa: baseExerciseXp,
      validator: {
        type: 'option_text',
        expected: lessonDescription,
      },
    },
    {
      id: 'practice-habit',
      tipo: 'verdadero_falso',
      enunciado:
        'Verdadero o falso: practicar ejemplos cortos y validar resultados ayuda a consolidar lo aprendido.',
      opciones: ['Verdadero', 'Falso'],
      pista: 'La práctica deliberada fortalece la comprensión.',
      numero: 3,
      xp_recompensa: finalExerciseXp,
      validator: {
        type: 'option_text',
        expected: 'Verdadero',
      },
    },
  ]
}

class LearningService {
  constructor({
    pathsRepository,
    lessonsRepository,
    progressRepository,
    favoritesRepository,
    diagnosticRepository,
    classManagementRepository,
    submissionsRepository,
    solutionsRepository,
    schemaGuardService,
    diagnosticQuestionBank,
  }) {
    this.pathsRepository = pathsRepository
    this.lessonsRepository = lessonsRepository
    this.progressRepository = progressRepository
    this.favoritesRepository = favoritesRepository
    this.diagnosticRepository = diagnosticRepository
    this.classManagementRepository = classManagementRepository
    this.submissionsRepository = submissionsRepository
    this.solutionsRepository = solutionsRepository
    this.schemaGuardService = schemaGuardService
    this.diagnosticQuestionBank = diagnosticQuestionBank
  }

  async listPaths({ languageId, difficulty }) {
    await this.schemaGuardService.assertGroup('base')
    return this.pathsRepository.listPaths({ languageId, difficulty })
  }

  async getPathById(pathId) {
    await this.schemaGuardService.assertGroup('base')

    const path = await this.pathsRepository.findById(pathId)
    if (!path) {
      throw AppError.notFound('Learning path no encontrado.')
    }

    return path
  }

  async listLessons({ pathId, userId }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('lessons')

    const path = await this.pathsRepository.findById(pathId)
    if (!path) {
      throw AppError.notFound('Learning path no encontrado.')
    }

    return this.lessonsRepository.listByPath({ pathId, userId })
  }

  async getLessonById({ lessonId, userId }) {
    await this.schemaGuardService.assertGroup('lessons')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    return lesson
  }

  async getProgressOverview(userId) {
    await this.schemaGuardService.assertGroup('progress')

    const overview = await this.progressRepository.getOverview(userId)
    return {
      total_lessons: Number(overview.total_lessons || 0),
      completed_lessons: Number(overview.completed_lessons || 0),
      total_xp: Number(overview.total_xp || 0),
    }
  }

  async markLessonCompleted({ userId, lessonId }) {
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('lessons')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    await this.progressRepository.markLessonCompleted({
      userId,
      lessonId,
      xpReward: lesson.xp_reward,
    })

    return {
      lesson_id: lessonId,
      status: 'completed',
    }
  }

  async listAvailableLanguages(userId) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('diagnostic')

    const [languages, latestAttempts] = await Promise.all([
      this.pathsRepository.listActiveLanguages(),
      this.diagnosticRepository.listLatestAttemptsByUser(userId),
    ])

    const attemptsByLanguage = new Map(
      latestAttempts.map((attempt) => [Number(attempt.programming_language_id), attempt])
    )

    return languages.map((language) => {
      const attempt = attemptsByLanguage.get(Number(language.id))
      const diagnosticCompleted = attempt?.status === 'completed'

      return {
        id: Number(language.id),
        nombre: language.name,
        icono: language.icon,
        diagnostico_completado: diagnosticCompleted ? 1 : 0,
        nivel_diagnostico: diagnosticCompleted ? attempt.assigned_level : null,
      }
    })
  }

  async selectLanguage({ userId, languageId }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('diagnostic')

    const language = await this.pathsRepository.findLanguageById(languageId)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado o no disponible.')
    }

    const latestAttempt = await this.diagnosticRepository.getLatestAttemptByLanguage({
      userId,
      languageId,
    })

    return {
      languageId: Number(language.id),
      languageName: language.name,
      diagnosticCompleted: latestAttempt?.status === 'completed',
      assignedLevel: latestAttempt?.assigned_level || null,
    }
  }

  async removeLanguageForUser({
    userId,
    languageId,
    confirmationText,
    confirmationLanguageName,
    confirmProgressText,
  }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('diagnostic')
    await this.schemaGuardService.assertGroup('favorites')

    const language = await this.pathsRepository.findLanguageById(languageId)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado o no disponible.')
    }

    const normalizedAction = String(confirmationText || '').trim().toUpperCase()
    if (normalizedAction !== 'ELIMINAR') {
      throw AppError.badRequest(
        'Confirmación inválida. Debes escribir ELIMINAR.',
        'LANGUAGE_DELETE_CONFIRM_ACTION_INVALID'
      )
    }

    const typedLanguage = String(confirmationLanguageName || '').trim()
    if (typedLanguage !== String(language.name || '')) {
      throw AppError.badRequest(
        'Confirmación inválida. Debes escribir exactamente el nombre del lenguaje.',
        'LANGUAGE_DELETE_CONFIRM_NAME_MISMATCH',
        { expectedLanguageName: language.name }
      )
    }

    const [progressStats, attemptsCount] = await Promise.all([
      this.progressRepository.getLessonStatsByLanguage({ userId, languageId }),
      this.diagnosticRepository.countAttemptsByLanguage({ userId, languageId }),
    ])

    const startedLessons = Number(progressStats.started_lessons || 0)
    const completedLessons = Number(progressStats.completed_lessons || 0)
    const hasRelevantProgress = startedLessons > 0 || attemptsCount > 0

    if (hasRelevantProgress) {
      const normalizedProgressConfirmation = String(confirmProgressText || '').trim().toUpperCase()
      if (normalizedProgressConfirmation !== 'ELIMINAR TODO MI PROGRESO') {
        throw AppError.badRequest(
          'Este lenguaje tiene progreso. Debes confirmar con el texto ELIMINAR TODO MI PROGRESO.',
          'LANGUAGE_DELETE_CONFIRM_PROGRESS_REQUIRED'
        )
      }
    }

    const [deletedSelections, deletedProgress, deletedAttempts, deletedFavorites] = await Promise.all([
      this.pathsRepository.deleteSelectedPathForUserLanguage({ userId, languageId }),
      this.progressRepository.deleteProgressByLanguage({ userId, languageId }),
      this.diagnosticRepository.deleteAttemptsByLanguage({ userId, languageId }),
      this.favoritesRepository.deletePathFavoritesByLanguage({ userId, languageId }),
    ])

    return {
      ok: true,
      languageId: Number(language.id),
      languageName: language.name,
      removed: {
        selectedPaths: deletedSelections,
        lessonProgressRows: deletedProgress,
        diagnosticAttempts: deletedAttempts,
        favorites: deletedFavorites,
      },
      previous: {
        startedLessons,
        completedLessons,
        diagnosticAttempts: attemptsCount,
      },
    }
  }

  async startDiagnostic({ userId, languageId }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('diagnostic')

    const language = await this.pathsRepository.findLanguageById(languageId)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado o no disponible.')
    }

    const paths = await this.pathsRepository.listPaths({ languageId })
    if (paths.length === 0) {
      throw AppError.notFound('No existen rutas activas para este lenguaje.')
    }

    const latestAttempt = await this.diagnosticRepository.getLatestAttemptByLanguage({
      userId,
      languageId,
    })

    if (latestAttempt?.status === 'completed') {
      const assignedPath = paths.find((path) => Number(path.id) === Number(latestAttempt.assigned_path_id)) || null

      return {
        alreadyCompleted: true,
        attemptId: Number(latestAttempt.id),
        language: {
          id: Number(language.id),
          nombre: language.name,
          icono: language.icon,
        },
        result: {
          scorePercentage: toRoundedNumber(latestAttempt.score_percentage),
          correctAnswers: Number(latestAttempt.correct_answers || 0),
          totalQuestions: Number(latestAttempt.total_questions || 0),
          assignedLevel: latestAttempt.assigned_level,
          assignedPath: assignedPath
            ? {
                id: Number(assignedPath.id),
                nombre: assignedPath.name,
                difficulty: assignedPath.difficulty_level,
              }
            : null,
        },
      }
    }

    await this.diagnosticRepository.abandonInProgressAttempts({ userId, languageId })

    const examTemplate = this.diagnosticQuestionBank.buildExam(language.name, 0)
    const attemptId = await this.diagnosticRepository.createAttempt({
      userId,
      languageId,
      totalQuestions: examTemplate.length,
    })
    const exam = this.diagnosticQuestionBank.buildExam(language.name, attemptId)

    return {
      alreadyCompleted: false,
      attemptId: Number(attemptId),
      language: {
        id: Number(language.id),
        nombre: language.name,
        icono: language.icon,
      },
      totalQuestions: exam.length,
      questions: exam.map((question) => ({
        id: question.id,
        level: question.level,
        prompt: question.prompt,
        options: question.options,
      })),
    }
  }

  async finishDiagnostic({ userId, attemptId, answers }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('diagnostic')

    const attempt = await this.diagnosticRepository.getAttemptById({ attemptId, userId })
    if (!attempt) {
      throw AppError.notFound('Intento diagnóstico no encontrado.')
    }

    if (attempt.status === 'completed') {
      throw AppError.conflict('Este diagnóstico ya fue completado.', 'DIAGNOSTIC_ALREADY_COMPLETED')
    }

    if (attempt.status !== 'in_progress') {
      throw AppError.conflict('El intento diagnóstico no está disponible.', 'DIAGNOSTIC_NOT_AVAILABLE')
    }

    const language = await this.pathsRepository.findLanguageById(attempt.programming_language_id)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado para este intento.')
    }

    const exam = this.diagnosticQuestionBank.buildExam(language.name, attemptId)
    const answersMap = normalizeAnswers(answers)

    if (answersMap.size < exam.length) {
      throw AppError.badRequest('Debes responder todas las preguntas del diagnóstico.', 'DIAGNOSTIC_INCOMPLETE')
    }

    let correctAnswers = 0
    let weightedTotal = 0
    let weightedCorrect = 0

    const answerDetails = exam.map((question) => {
      const selectedOption = answersMap.get(question.id)
      if (!Number.isInteger(selectedOption) || selectedOption >= question.options.length) {
        throw AppError.badRequest(`La respuesta para ${question.id} es inválida.`, 'VALIDATION_ERROR')
      }

      const isCorrect = selectedOption === question.correctOption
      weightedTotal += question.weight

      if (isCorrect) {
        correctAnswers += 1
        weightedCorrect += question.weight
      }

      return {
        questionId: question.id,
        selectedOption,
        correctOption: question.correctOption,
        isCorrect,
        level: question.level,
      }
    })

    const scorePercentage = weightedTotal > 0 ? toRoundedNumber((weightedCorrect / weightedTotal) * 100) : 0
    const assignedLevel = resolveAssignedLevel(scorePercentage)

    const paths = await this.pathsRepository.listPaths({
      languageId: attempt.programming_language_id,
    })
    const assignedPath = pickBestPathForLevel(paths, assignedLevel)

    if (!assignedPath) {
      throw AppError.notFound('No se pudo asignar una ruta para este nivel.')
    }

    await this.pathsRepository.replaceSelectedPathForUserLanguage({
      userId,
      languageId: attempt.programming_language_id,
      pathId: assignedPath.id,
    })

    await this.diagnosticRepository.completeAttempt({
      attemptId,
      userId,
      correctAnswers,
      weightedScore: toRoundedNumber(weightedCorrect),
      scorePercentage,
      assignedLevel,
      assignedPathId: assignedPath.id,
      answersJson: JSON.stringify(answerDetails),
    })

    return {
      attemptId: Number(attemptId),
      scorePercentage,
      correctAnswers,
      totalQuestions: exam.length,
      assignedLevel,
      assignedPath: {
        id: Number(assignedPath.id),
        nombre: assignedPath.name,
        difficulty: assignedPath.difficulty_level,
      },
    }
  }

  async getDashboardOverview(userId) {
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('diagnostic')

    const [progress, streak, selectedLanguages, latestAttempts] = await Promise.all([
      this.getProgressOverview(userId),
      this.progressRepository.getStreakOverview(userId),
      this.pathsRepository.listUserSelectedLanguages(userId),
      this.diagnosticRepository.listLatestAttemptsByUser(userId),
    ])

    const attemptsByLanguage = new Map(
      latestAttempts.map((attempt) => [Number(attempt.programming_language_id), attempt])
    )

    const languageMap = new Map()

    selectedLanguages.forEach((language) => {
      languageMap.set(Number(language.language_id), {
        lenguaje_id: Number(language.language_id),
        nombre: language.language_name,
        icono: language.language_icon,
        selectedPathId: Number(language.selected_path_id),
      })
    })

    latestAttempts.forEach((attempt) => {
      const languageId = Number(attempt.programming_language_id)

      if (!languageMap.has(languageId)) {
        languageMap.set(languageId, {
          lenguaje_id: languageId,
          nombre: attempt.language_name,
          icono: attempt.language_icon,
          selectedPathId: attempt.assigned_path_id ? Number(attempt.assigned_path_id) : null,
        })
      }
    })

    const languages = []

    for (const languageCard of languageMap.values()) {
      const statsRows = await this.progressRepository.getPathLessonStatsByLanguage({
        userId,
        languageId: languageCard.lenguaje_id,
      })

      const modulesTotal = statsRows.length
      const modulesCompleted = statsRows.filter((row) => {
        const totalLessons = Number(row.total_lessons || 0)
        const completedLessons = Number(row.completed_lessons || 0)
        return totalLessons > 0 && completedLessons >= totalLessons
      }).length

      const attempt = attemptsByLanguage.get(languageCard.lenguaje_id)

      languages.push({
        lenguaje_id: languageCard.lenguaje_id,
        nombre: languageCard.nombre,
        icono: languageCard.icono,
        nivel_diagnostico: attempt?.assigned_level || null,
        diagnostico_completado: attempt?.status === 'completed' ? 1 : 0,
        modulosTotal: modulesTotal,
        modulosCompletados: modulesCompleted,
        selectedPathId: languageCard.selectedPathId,
      })
    }

    languages.sort((a, b) => a.nombre.localeCompare(b.nombre))

    // user_stats.total_xp es la fuente de verdad del XP acumulado
    const totalXp = Number(streak.total_xp || 0)

    return {
      xpTotal: totalXp,
      nivel: Math.max(1, Math.floor(totalXp / 500) + 1),
      racha: Number(streak.streak_current || 0),
      rachaMaxima: Number(streak.streak_longest || 0),
      languages,
      achievements: [],
      recentXP: [],
    }
  }

  async listModulesByLanguage({ userId, languageId }) {
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('diagnostic')

    const language = await this.pathsRepository.findLanguageById(languageId)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado o no disponible.')
    }

    const latestAttempt = await this.diagnosticRepository.getLatestAttemptByLanguage({
      userId,
      languageId,
    })

    if (!latestAttempt || latestAttempt.status !== 'completed') {
      throw AppError.conflict('Debes completar el diagnóstico antes de ver módulos.', 'DIAGNOSTIC_REQUIRED')
    }

    let selectedPathId = await this.pathsRepository.getSelectedPathForUserLanguage({ userId, languageId })

    if (!selectedPathId && latestAttempt.assigned_path_id) {
      selectedPathId = Number(latestAttempt.assigned_path_id)

      await this.pathsRepository.replaceSelectedPathForUserLanguage({
        userId,
        languageId,
        pathId: selectedPathId,
      })
    }

    if (!selectedPathId) {
      throw AppError.conflict('No hay ruta asignada para este lenguaje.', 'PATH_NOT_ASSIGNED')
    }

    const [pathsRaw, statsRaw] = await Promise.all([
      this.pathsRepository.listPaths({ languageId }),
      this.progressRepository.getPathLessonStatsByLanguage({ userId, languageId }),
    ])

    const paths = sortPathsByDifficulty(pathsRaw)
    const statsByPath = new Map(
      statsRaw.map((row) => [Number(row.path_id), {
        totalLessons: Number(row.total_lessons || 0),
        completedLessons: Number(row.completed_lessons || 0),
      }])
    )

    const selectedIndex = paths.findIndex((path) => Number(path.id) === Number(selectedPathId))
    const modules = []

    paths.forEach((path, index) => {
      const stats = statsByPath.get(Number(path.id)) || { totalLessons: 0, completedLessons: 0 }
      const totalLessons = stats.totalLessons
      const completedLessons = stats.completedLessons
      const porcentaje = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      const isCompleted = totalLessons > 0 && completedLessons >= totalLessons

      let estado = 'bloqueado'
      if (isCompleted) {
        estado = 'completado'
      } else if (index === selectedIndex) {
        estado = 'en_progreso'
      } else if (selectedIndex > -1 && index < selectedIndex) {
        estado = 'disponible'
      } else if (index === 0 || modules[index - 1]?.estado === 'completado') {
        estado = 'disponible'
      }

      modules.push({
        id: Number(path.id),
        nombre: path.name,
        descripcion: path.description || '',
        numero: index + 1,
        icono: path.language_icon || 'code',
        xp_recompensa: 50,
        estado,
        porcentaje,
        difficulty: path.difficulty_level,
        totalLessons,
        completedLessons,
      })
    })

    return modules
  }

  async getLessonSession({ lessonId, userId }) {
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    const dbSolution = await this.solutionsRepository.findByLesson(lessonId)
    const exerciseBank = buildLessonExerciseBank(lesson, dbSolution)
    const cleanedTheory = stripLeadingHeading(lesson.content || '')

    return {
      lesson: {
        id: Number(lesson.id),
        titulo: lesson.title,
        descripcion: lesson.description || '',
        contenido_teoria: cleanedTheory,
        tipo: 'teoria_practica',
        xp_recompensa: Number(lesson.xp_reward || 0),
        modulo_nombre: lesson.learning_path_name,
        lenguaje_id: Number(lesson.programming_language_id || 0) || null,
      },
      exercises: exerciseBank.map((exercise) => ({
        id: exercise.id,
        tipo: exercise.tipo,
        enunciado: exercise.enunciado,
        codigo_base: exercise.codigo_base,
        opciones: exercise.opciones,
        pista: exercise.pista,
        xp_recompensa: exercise.xp_recompensa,
        numero: exercise.numero,
        resuelto: lesson.status === 'completed',
      })),
    }
  }

  async submitLessonExercise({ userId, lessonId, exerciseId, answer }) {
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    const dbSolution = await this.solutionsRepository.findByLesson(lessonId)
    const exerciseBank = buildLessonExerciseBank(lesson, dbSolution)
    const selectedExercise = exerciseBank.find((exercise) => exercise.id === exerciseId)

    if (!selectedExercise) {
      throw AppError.badRequest('Ejercicio no soportado para esta lección.', 'VALIDATION_ERROR')
    }

    const validator = selectedExercise.validator || {}
    let isCorrect = false

    if (validator.type === 'exact_text') {
      const normalizedAnswer = stripTrailingSemicolon(normalizeComparableText(answer))
      const normalizedExpected = stripTrailingSemicolon(normalizeComparableText(validator.expected))
      isCorrect = normalizedAnswer === normalizedExpected
    } else {
      const normalizedAnswer = normalizeComparableText(answer)
      const normalizedExpected = normalizeComparableText(validator.expected)
      isCorrect = normalizedAnswer === normalizedExpected
    }

    if (!isCorrect) {
      return {
        isCorrect: false,
        xpGained: 0,
        hint: selectedExercise.pista,
        correctAnswer: validator.expected || null,
      }
    }

    // El XP ya no se otorga por ejercicio individual — se calcula al final en submitSolution
    return {
      isCorrect: true,
      xpGained: 0,
      hint: null,
      correctAnswer: null,
    }
  }

  async listPathFavorites(userId) {
    await this.schemaGuardService.assertGroup('favorites')
    await this.schemaGuardService.assertGroup('base')

    return this.favoritesRepository.listPathFavorites(userId)
  }

  async togglePathFavorite({ userId, pathId }) {
    await this.schemaGuardService.assertGroup('favorites')
    await this.schemaGuardService.assertGroup('base')

    const path = await this.pathsRepository.findById(pathId)
    if (!path) {
      throw AppError.notFound('Learning path no encontrado.')
    }

    const favorite = await this.favoritesRepository.togglePathFavorite({ userId, pathId })

    return {
      path_id: pathId,
      favorite,
    }
  }

  async getLessonSolution({ lessonId, userId }) {
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    // RN05: solo se puede ver la solución si el usuario completó la lección
    const progress = await this.progressRepository.getProgressForLesson({ userId, lessonId })
    if (!progress || progress.status !== 'completed') {
      throw AppError.forbidden(
        'Debes completar la lección antes de poder ver la solución.',
        'LESSON_NOT_COMPLETED'
      )
    }

    const solution = await this.solutionsRepository.getSolutionForUser(lessonId)
    if (!solution) {
      throw AppError.notFound('Esta lección no tiene una solución registrada.')
    }

    return solution
  }

  async listLessonFavorites(userId) {
    await this.schemaGuardService.assertGroup('favorites')
    await this.schemaGuardService.assertGroup('base')

    return this.favoritesRepository.listLessonFavorites(userId)
  }

  async toggleLessonFavorite({ userId, lessonId }) {
    await this.schemaGuardService.assertGroup('favorites')
    await this.schemaGuardService.assertGroup('base')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    const favorite = await this.favoritesRepository.toggleLessonFavorite({ userId, lessonId })

    return {
      lesson_id: lessonId,
      favorite,
    }
  }

  async createInstructorClass({ instructorUserId, name, description }) {
    await this.schemaGuardService.assertGroup('rbac_instructor')

    const normalizedName = String(name || '').trim()
    if (normalizedName.length < 3) {
      throw AppError.badRequest('El nombre de la clase debe tener al menos 3 caracteres.', 'VALIDATION_ERROR')
    }

    const created = await this.classManagementRepository.createClass({
      instructorUserId,
      name: normalizedName,
      description: String(description || '').trim() || null,
    })

    return {
      class: {
        id: Number(created.id),
        name: created.name,
        description: created.description,
        is_active: Boolean(created.is_active),
        created_at: created.created_at,
      },
    }
  }

  async listInstructorClasses({ instructorUserId }) {
    await this.schemaGuardService.assertGroup('rbac_instructor')
    const classes = await this.classManagementRepository.listClassesByInstructor(instructorUserId)
    return {
      classes: classes.map((item) => ({
        id: Number(item.id),
        name: item.name,
        description: item.description,
        is_active: Boolean(item.is_active),
        students_total: Number(item.students_total || 0),
        assigned_paths_total: Number(item.assigned_paths_total || 0),
        created_at: item.created_at,
      })),
    }
  }

  async generateClassInvite({ actorUserId, actorRole, classId, inviteEmail, expiresAt, maxUses }) {
    await this.schemaGuardService.assertGroup('rbac_instructor')

    const ownedClass = await this.classManagementRepository.findClassOwnedByInstructor({
      classId,
      instructorUserId: actorUserId,
    })

    if (!ownedClass && actorRole !== 'admin') {
      throw AppError.forbidden('No puedes generar invitaciones para una clase que no te pertenece.')
    }

    const klass = ownedClass || (await this.classManagementRepository.findClassById(classId))
    if (!klass) {
      throw AppError.notFound('Clase no encontrada.')
    }

    let invite
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createInviteCode()
      try {
        invite = await this.classManagementRepository.createInviteCode({
          classId,
          code,
          inviteEmail,
          expiresAt,
          maxUses,
          createdByUserId: actorUserId,
        })
        break
      } catch (error) {
        if (error?.code !== 'ER_DUP_ENTRY') {
          throw error
        }
      }
    }

    if (!invite) {
      throw AppError.conflict('No se pudo generar un código único de invitación. Intenta de nuevo.')
    }

    return {
      invite: {
        id: Number(invite.id),
        class_id: Number(invite.class_id),
        code: invite.code,
        invite_email: invite.invite_email,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
        used_count: Number(invite.used_count || 0),
        is_active: Boolean(invite.is_active),
        created_at: invite.created_at,
      },
    }
  }

  async assignPathToClass({ actorUserId, actorRole, classId, learningPathId, isRequired }) {
    await this.schemaGuardService.assertGroup('rbac_instructor')
    await this.schemaGuardService.assertGroup('base')

    const ownedClass = await this.classManagementRepository.findClassOwnedByInstructor({
      classId,
      instructorUserId: actorUserId,
    })

    if (!ownedClass && actorRole !== 'admin') {
      throw AppError.forbidden('No puedes asignar rutas en una clase que no te pertenece.')
    }

    const path = await this.pathsRepository.findById(learningPathId)
    if (!path) {
      throw AppError.notFound('Ruta de aprendizaje no encontrada.')
    }

    const assignment = await this.classManagementRepository.assignPathToClass({
      classId,
      learningPathId,
      isRequired,
      assignedByUserId: actorUserId,
    })

    return {
      assignment: {
        class_id: Number(assignment.class_id),
        learning_path_id: Number(assignment.learning_path_id),
        learning_path_name: assignment.learning_path_name,
        difficulty_level: assignment.difficulty_level,
        is_required: Boolean(assignment.is_required),
        assigned_at: assignment.assigned_at,
      },
    }
  }

  async getClassAnalytics({ actorUserId, actorRole, classId }) {
    await this.schemaGuardService.assertGroup('rbac_instructor')

    const ownedClass = await this.classManagementRepository.findClassOwnedByInstructor({
      classId,
      instructorUserId: actorUserId,
    })

    if (!ownedClass && actorRole !== 'admin') {
      throw AppError.forbidden('No puedes ver analytics de una clase que no te pertenece.')
    }

    const analytics = await this.classManagementRepository.getClassAnalytics(classId)

    return {
      class_id: classId,
      summary: {
        students_total: Number(analytics.summary.students_total || 0),
        completed_lessons_total: Number(analytics.summary.completed_lessons_total || 0),
        lessons_started_total: Number(analytics.summary.lessons_started_total || 0),
        progress_signal_avg: Number(analytics.summary.progress_signal_avg || 0),
      },
      students: analytics.students.map((row) => ({
        id: Number(row.id),
        name: row.name,
        email: row.email,
        completed_lessons: Number(row.completed_lessons || 0),
        started_lessons: Number(row.started_lessons || 0),
        earned_xp: Number(row.earned_xp || 0),
      })),
    }
  }

  async adminCreateLearningPath({
    programmingLanguageId,
    name,
    slug,
    description,
    difficultyLevel,
    estimatedHours,
    isActive,
  }) {
    await this.schemaGuardService.assertGroup('rbac_admin')
    await this.schemaGuardService.assertGroup('base')

    const validDifficulties = ['principiante', 'intermedio', 'avanzado']
    if (!validDifficulties.includes(difficultyLevel)) {
      throw AppError.badRequest('difficultyLevel invalido. Usa principiante, intermedio o avanzado.')
    }

    const language = await this.pathsRepository.findLanguageById(programmingLanguageId)
    if (!language) {
      throw AppError.notFound('Lenguaje no encontrado o no disponible.')
    }

    const normalizedName = String(name || '').trim()
    if (normalizedName.length < 3) {
      throw AppError.badRequest('name debe tener al menos 3 caracteres.')
    }

    const finalSlug = String(slug || '').trim() || slugify(normalizedName)
    if (!finalSlug) {
      throw AppError.badRequest('No se pudo generar slug válido para la ruta.')
    }

    let created
    try {
      created = await this.classManagementRepository.createLearningPath({
        programmingLanguageId,
        name: normalizedName,
        slug: finalSlug,
        description: String(description || '').trim() || null,
        difficultyLevel,
        estimatedHours,
        isActive: isActive !== false,
      })
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw AppError.conflict('Ya existe una ruta con ese slug.', 'DUPLICATE_LEARNING_PATH_SLUG')
      }
      throw error
    }

    return {
      learning_path: {
        id: Number(created.id),
        programming_language_id: Number(created.programming_language_id),
        name: created.name,
        slug: created.slug,
        description: created.description,
        difficulty_level: created.difficulty_level,
        estimated_hours: created.estimated_hours,
        is_active: Boolean(created.is_active),
        created_at: created.created_at,
      },
    }
  }

  async getAdminAnalytics() {
    await this.schemaGuardService.assertGroup('rbac_admin')
    await this.schemaGuardService.assertGroup('base')
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('diagnostic')

    return this.classManagementRepository.getGlobalAnalytics()
  }

  async submitSolution({ userId, lessonId, code, languageId, correctCount, totalExercises, isRetry }) {
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')
    await this.schemaGuardService.assertGroup('submissions')

    const lesson = await this.lessonsRepository.findById({ lessonId, userId })
    if (!lesson) {
      throw AppError.notFound('Lección no encontrada.')
    }

    const dbSolution    = await this.solutionsRepository.findByLesson(lessonId)
    const exerciseBank  = buildLessonExerciseBank(lesson, dbSolution)
    const totalEx       = Number(totalExercises) || exerciseBank.length
    const correctEx     = Math.min(Math.max(Number(correctCount) || 0, 0), totalEx)
    const isRetryAttempt = Boolean(isRetry)
    const resolvedLanguageId = Number(languageId || lesson.programming_language_id || 1)
    const xpReward      = Number(lesson.xp_reward || 0)

    // --- Calcular XP según reglas ---
    let xpEarned = 0
    if (!isRetryAttempt) {
      // Primera vez: proporcional a correctas — Math.round para redondeo correcto
      xpEarned = Math.round(xpReward * correctEx / totalEx)
    } else {
      // Retry: >50% correcto → 20 XP, ≤50% (o todo mal) → 10 XP
      const pct = totalEx > 0 ? correctEx / totalEx : 0
      xpEarned  = pct > 0.5 ? 20 : 10
    }

    const allCorrect = correctEx === totalEx
    const status     = allCorrect ? 'accepted' : 'wrong_answer'

    // --- Guardar submission ---
    const submissionId = await this.submissionsRepository.createSubmission({
      userId,
      lessonId,
      languageId: resolvedLanguageId,
      codeSubmitted: String(code || '').trim(),
      status,
      testCasesPassed: correctEx,
      testCasesTotal: totalEx,
      pointsEarned: xpEarned,
    })

    // --- Sumar XP al acumulado del usuario ---
    await this.progressRepository.addXpToStats({ userId, xp: xpEarned })

    // --- Marcar lección como completada si fue la primera vez con todos correctos ---
    if (!isRetryAttempt && allCorrect) {
      await this.progressRepository.markLessonCompleted({
        userId,
        lessonId,
        xpReward,
      })
    }

    const updatedProgress = await this.progressRepository.getProgressForLesson({ userId, lessonId })

    return {
      submissionId,
      status,
      accepted: allCorrect,
      testCasesPassed: correctEx,
      testCasesTotal: totalEx,
      xpEarned,
      progressUpdated: true,
      progress: updatedProgress || null,
    }
  }

  async listCompletedLessons(userId) {
    await this.schemaGuardService.assertGroup('lessons')
    await this.schemaGuardService.assertGroup('progress')

    const rows = await this.lessonsRepository.listCompleted(userId)

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      description: row.description,
      learning_path_id: Number(row.learning_path_id),
      learning_path_name: row.learning_path_name,
      order_position: Number(row.order_position),
      xp_reward: Number(row.xp_reward),
      xp_earned: Number(row.xp_earned),
      completed_at: row.completed_at,
    }))
  }
}

module.exports = LearningService
