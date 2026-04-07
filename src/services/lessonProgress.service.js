const AppError = require('../core/errors/AppError')
const withTransaction = require('../core/db/withTransaction')

class LessonProgressService {
  constructor({ pool, defaultLessonXp = 50, syntheticExerciseOffset = 900000000 }) {
    this.pool = pool
    this.defaultLessonXp = defaultLessonXp
    this.syntheticExerciseOffset = syntheticExerciseOffset
    this.procedureSupport = null
  }

  async submitExercise({ userId, exerciseId, answer }) {
    const normalizedAnswer = this.#normalizeAnswer(answer)

    return withTransaction(this.pool, async (db) => {
      await this.#ensureStatsRows(db, userId)

      if (exerciseId >= this.syntheticExerciseOffset) {
        return this.#submitSyntheticExercise({
          db,
          userId,
          exerciseId,
          normalizedAnswer,
        })
      }

      const testCase = await this.#fetchTestCaseById(db, exerciseId)

      if (!testCase) {
        throw AppError.notFound('Ejercicio no encontrado.')
      }

      const expectedAnswer = this.#normalizeAnswer(testCase.expected_output)
      const isCorrect = normalizedAnswer === expectedAnswer
      const submissionStatus = isCorrect ? 'accepted' : 'wrong_answer'
      const testCaseRef = `tc:${testCase.test_case_id}`

      await this.#recordSubmissionAndTouchProgress(db, {
        userId,
        lessonId: Number(testCase.lesson_id),
        languageId: Number(testCase.programming_language_id),
        submittedAnswer: normalizedAnswer,
        submissionStatus,
        referenceId: testCaseRef,
      })

      let xpGained = 0

      if (isCorrect) {
        const firstAccepted = await this.#isFirstAcceptedForReference(db, {
          userId,
          lessonId: Number(testCase.lesson_id),
          referenceId: testCaseRef,
        })

        if (firstAccepted) {
          const caseXp = Number(testCase.points || 0)
          xpGained += caseXp
          await this.#incrementUserXp(db, userId, caseXp)
        }

        const completionResult = await this.#tryCompleteLessonIfReady(db, {
          userId,
          lessonId: Number(testCase.lesson_id),
          forceCompletion: false,
        })

        xpGained += completionResult.xpGained

        if (firstAccepted || completionResult.completedNow) {
          await this.#updateStreak(db, userId)
        }

        await this.#checkAchievements(db, userId)
      }

      return {
        isCorrect,
        correctAnswer: isCorrect || testCase.is_hidden ? null : String(testCase.expected_output || ''),
        xpGained,
        hint: isCorrect
          ? null
          : testCase.is_hidden
            ? 'Caso oculto: revisa cuidadosamente el formato de la salida.'
            : 'Revisa mayusculas, espacios y saltos de linea de la salida.',
      }
    })
  }

  async #submitSyntheticExercise({ db, userId, exerciseId, normalizedAnswer }) {
    const lessonId = Number(exerciseId - this.syntheticExerciseOffset)
    const lesson = await this.#fetchLessonById(db, lessonId)

    if (!lesson) {
      throw AppError.notFound('Lección no encontrada para este ejercicio.')
    }

    const isCorrect = normalizedAnswer.length > 0
    const submissionStatus = isCorrect ? 'accepted' : 'wrong_answer'
    const syntheticRef = `synth:${lessonId}`

    await this.#recordSubmissionAndTouchProgress(db, {
      userId,
      lessonId,
      languageId: Number(lesson.programming_language_id),
      submittedAnswer: normalizedAnswer,
      submissionStatus,
      referenceId: syntheticRef,
    })

    let xpGained = 0

    if (isCorrect) {
      const firstAccepted = await this.#isFirstAcceptedForReference(db, {
        userId,
        lessonId,
        referenceId: syntheticRef,
      })

      if (firstAccepted) {
        xpGained += 10
        await this.#incrementUserXp(db, userId, 10)
      }

      const completionResult = await this.#tryCompleteLessonIfReady(db, {
        userId,
        lessonId,
        forceCompletion: true,
      })

      xpGained += completionResult.xpGained

      if (firstAccepted || completionResult.completedNow) {
        await this.#updateStreak(db, userId)
      }

      await this.#checkAchievements(db, userId)
    }

    return {
      isCorrect,
      correctAnswer: null,
      xpGained,
      hint: isCorrect ? null : 'Escribe al menos un texto corto para completar esta actividad.',
    }
  }

  async #fetchLessonById(db, lessonId) {
    const [rows] = await db.query(
      `SELECT l.id, lp.programming_language_id
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       WHERE l.id = ? AND l.is_published = 1
       LIMIT 1`,
      [lessonId]
    )

    return rows[0] || null
  }

  async #fetchTestCaseById(db, testCaseId) {
    const [rows] = await db.query(
      `SELECT tc.id AS test_case_id,
              tc.lesson_id,
              tc.expected_output,
              tc.points,
              tc.is_hidden,
              lp.programming_language_id
       FROM lesson_test_cases tc
       JOIN lessons l ON l.id = tc.lesson_id
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       WHERE tc.id = ? AND l.is_published = 1
       LIMIT 1`,
      [testCaseId]
    )

    return rows[0] || null
  }

  async #recordSubmissionAndTouchProgress(
    db,
    { userId, lessonId, languageId, submittedAnswer, submissionStatus, referenceId }
  ) {
    await db.query(
      `INSERT INTO user_submissions (
          user_id,
          lesson_id,
          code_submitted,
          language_id,
          status,
          judge0_submission_id,
          error_message
        )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        lessonId,
        submittedAnswer,
        languageId,
        submissionStatus,
        referenceId,
        submissionStatus === 'accepted' ? null : 'Respuesta no coincide con el resultado esperado.',
      ]
    )

    await db.query(
      `INSERT INTO user_progress (user_id, lesson_id, status, started_at, last_accessed_at, submission_count)
       VALUES (?, ?, 'in_progress', NOW(), NOW(), 1)
       ON DUPLICATE KEY UPDATE
         submission_count = submission_count + 1,
         started_at = COALESCE(started_at, NOW()),
         status = IF(status = 'completed', 'completed', 'in_progress'),
         last_accessed_at = NOW()`,
      [userId, lessonId]
    )

    await this.#incrementSubmissionCounters(db, userId, submissionStatus === 'accepted')
  }

  async #isFirstAcceptedForReference(db, { userId, lessonId, referenceId }) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM user_submissions
       WHERE user_id = ?
         AND lesson_id = ?
         AND status = 'accepted'
         AND judge0_submission_id = ?`,
      [userId, lessonId, referenceId]
    )

    return Number(rows[0]?.total || 0) === 1
  }

  async #tryCompleteLessonIfReady(db, { userId, lessonId, forceCompletion }) {
    const [statusRows] = await db.query(
      `SELECT status
       FROM user_progress
       WHERE user_id = ? AND lesson_id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId, lessonId]
    )

    if (statusRows[0]?.status === 'completed') {
      return { completedNow: false, xpGained: 0 }
    }

    if (!forceCompletion) {
      const [totalRows] = await db.query(
        `SELECT COUNT(*) AS total_cases
         FROM lesson_test_cases
         WHERE lesson_id = ?`,
        [lessonId]
      )

      const totalCases = Number(totalRows[0]?.total_cases || 0)

      if (totalCases === 0) {
        return { completedNow: false, xpGained: 0 }
      }

      const [acceptedRows] = await db.query(
        `SELECT COUNT(DISTINCT judge0_submission_id) AS solved_cases
         FROM user_submissions
         WHERE user_id = ?
           AND lesson_id = ?
           AND status = 'accepted'
           AND judge0_submission_id LIKE 'tc:%'`,
        [userId, lessonId]
      )

      const solvedCases = Number(acceptedRows[0]?.solved_cases || 0)

      if (solvedCases < totalCases) {
        return { completedNow: false, xpGained: 0 }
      }
    }

    await this.#loadProcedureSupport(db)

    if (this.procedureSupport.completeLesson) {
      try {
        const outcome = await this.#completeLessonWithProcedure(db, { userId, lessonId })

        if (!outcome.completedNow) {
          return outcome
        }

        await this.#refreshLearningPathProgress(db, { userId, lessonId })
        return outcome
      } catch (error) {
        if (!this.#isProcedureMissingError(error)) {
          throw error
        }

        this.procedureSupport.completeLesson = false
      }
    }

    const fallbackOutcome = await this.#completeLessonFallback(db, { userId, lessonId })
    await this.#refreshLearningPathProgress(db, { userId, lessonId })
    return fallbackOutcome
  }

  async #completeLessonWithProcedure(db, { userId, lessonId }) {
    await db.query(
      'CALL sp_complete_lesson(?, ?, @p_success, @p_message, @p_xp_earned)',
      [userId, lessonId]
    )

    const [rows] = await db.query(
      'SELECT @p_success AS success, @p_message AS message, @p_xp_earned AS xp_earned'
    )

    const procedureResult = rows[0] || {}
    const completedNow = Number(procedureResult.success || 0) === 1

    return {
      completedNow,
      xpGained: completedNow ? Number(procedureResult.xp_earned || 0) : 0,
      message: procedureResult.message || null,
    }
  }

  async #completeLessonFallback(db, { userId, lessonId }) {
    await db.query(
      `INSERT INTO user_progress (
          user_id,
          lesson_id,
          status,
          xp_earned,
          started_at,
          completed_at,
          last_accessed_at,
          submission_count
        )
       VALUES (?, ?, 'completed', ?, NOW(), NOW(), NOW(), 1)
       ON DUPLICATE KEY UPDATE
         status = 'completed',
         xp_earned = GREATEST(xp_earned, VALUES(xp_earned)),
         completed_at = COALESCE(completed_at, NOW()),
         last_accessed_at = NOW()`,
      [userId, lessonId, this.defaultLessonXp]
    )

    await this.#incrementUserXp(db, userId, this.defaultLessonXp)

    await db.query(
      `UPDATE user_stats
       SET lessons_completed = COALESCE(lessons_completed, 0) + 1,
           updated_at = NOW()
       WHERE user_id = ?`,
      [userId]
    )

    return {
      completedNow: true,
      xpGained: this.defaultLessonXp,
      message: 'Leccion completada exitosamente.',
    }
  }

  async #refreshLearningPathProgress(db, { userId, lessonId }) {
    const [lessonRows] = await db.query(
      `SELECT learning_path_id
       FROM lessons
       WHERE id = ?
       LIMIT 1`,
      [lessonId]
    )

    if (lessonRows.length === 0) {
      return
    }

    const learningPathId = Number(lessonRows[0].learning_path_id)

    const [pathRows] = await db.query(
      `SELECT programming_language_id
       FROM learning_paths
       WHERE id = ?
       LIMIT 1`,
      [learningPathId]
    )

    const languageId = Number(pathRows[0]?.programming_language_id || 0)

    const [totalsRows] = await db.query(
      `SELECT COUNT(*) AS total_lessons,
              COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons
       FROM lessons l
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       WHERE l.learning_path_id = ? AND l.is_published = 1`,
      [userId, learningPathId]
    )

    const totalLessons = Number(totalsRows[0]?.total_lessons || 0)
    const completedLessons = Number(totalsRows[0]?.completed_lessons || 0)
    const percent = totalLessons > 0 ? (completedLessons * 100) / totalLessons : 0

    if (languageId > 0) {
      await db.query(
        `DELETE ulp
         FROM user_learning_paths ulp
         JOIN learning_paths lp ON lp.id = ulp.learning_path_id
         WHERE ulp.user_id = ?
           AND lp.programming_language_id = ?
           AND ulp.learning_path_id <> ?`,
        [userId, languageId, learningPathId]
      )
    }

    await db.query(
      `INSERT INTO user_learning_paths (user_id, learning_path_id, progress_percentage, selected_at, last_accessed_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         learning_path_id = VALUES(learning_path_id),
         progress_percentage = VALUES(progress_percentage),
         last_accessed_at = NOW()`,
      [userId, learningPathId, percent]
    )
  }

  async #checkAchievements(db, userId) {
    await this.#loadProcedureSupport(db)

    if (this.procedureSupport.checkAchievements) {
      try {
        await db.query('CALL sp_check_achievements(?)', [userId])
        return
      } catch (error) {
        if (!this.#isProcedureMissingError(error)) {
          throw error
        }

        this.procedureSupport.checkAchievements = false
      }
    }

    const [statsRows] = await db.query(
      `SELECT total_xp, lessons_completed, submissions_total
       FROM user_stats
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    const [streakRows] = await db.query(
      `SELECT streak_current AS current_streak
       FROM user_stats
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    const totalXp = Number(statsRows[0]?.total_xp || 0)
    const lessonsCompleted = Number(statsRows[0]?.lessons_completed || 0)
    const submissionsTotal = Number(statsRows[0]?.submissions_total || 0)
    const streakDays = Number(streakRows[0]?.current_streak || 0)

    await db.query(
      `INSERT IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at)
       SELECT ?, id, NOW()
       FROM achievements
       WHERE is_active = 1
         AND (
           (requirement_type = 'xp_total' AND requirement_value <= ?)
           OR (requirement_type = 'lessons_completed' AND requirement_value <= ?)
           OR (requirement_type = 'streak_days' AND requirement_value <= ?)
           OR (requirement_type = 'submissions' AND requirement_value <= ?)
         )`,
      [userId, totalXp, lessonsCompleted, streakDays, submissionsTotal]
    )
  }

  async #ensureStatsRows(db, userId) {
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
  }

  async #incrementSubmissionCounters(db, userId, accepted) {
    await db.query(
      `UPDATE user_stats
       SET submissions_total = COALESCE(submissions_total, 0) + 1,
           submissions_accepted = COALESCE(submissions_accepted, 0) + ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [accepted ? 1 : 0, userId]
    )
  }

  async #incrementUserXp(db, userId, xp) {
    if (xp <= 0) {
      return
    }

    await db.query(
      `UPDATE user_stats
       SET total_xp = COALESCE(total_xp, 0) + ?,
           current_level = FLOOR((COALESCE(total_xp, 0) + ?) / 500) + 1,
           updated_at = NOW()
       WHERE user_id = ?`,
      [xp, xp, userId]
    )
  }

  async #updateStreak(db, userId) {
    const today = new Date().toISOString().split('T')[0]

    const [streakRows] = await db.query(
      `SELECT streak_current AS current_streak,
              streak_longest AS longest_streak,
              last_activity_date
       FROM user_stats
       WHERE user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId]
    )

    if (streakRows.length === 0) {
      await db.query(
        `INSERT INTO user_stats (
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
         VALUES (?, 0, 1, 0, 0, 0, 1, 1, ?)
         ON DUPLICATE KEY UPDATE
           streak_current = VALUES(streak_current),
           streak_longest = GREATEST(COALESCE(streak_longest, 0), VALUES(streak_longest)),
           last_activity_date = VALUES(last_activity_date),
           updated_at = NOW()`,
        [userId, today]
      )
      return
    }

    const streak = streakRows[0]

    if (!streak.last_activity_date) {
      await db.query(
        `UPDATE user_stats
         SET streak_current = 1,
             streak_longest = GREATEST(COALESCE(streak_longest, 0), 1),
             last_activity_date = ?,
             updated_at = NOW()
         WHERE user_id = ?`,
        [today, userId]
      )
      return
    }

    const lastActive = new Date(streak.last_activity_date).toISOString().split('T')[0]

    if (lastActive === today) {
      return
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const nextValue = lastActive === yesterdayStr ? Number(streak.current_streak || 0) + 1 : 1
    const maxValue = Math.max(nextValue, Number(streak.longest_streak || 0))

    await db.query(
      `UPDATE user_stats
       SET streak_current = ?,
           streak_longest = ?,
           last_activity_date = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [nextValue, maxValue, today, userId]
    )
  }

  async #loadProcedureSupport(db) {
    if (this.procedureSupport) {
      return
    }

    const [rows] = await db.query(
      `SELECT ROUTINE_NAME
       FROM information_schema.ROUTINES
       WHERE ROUTINE_SCHEMA = DATABASE()
         AND ROUTINE_NAME IN ('sp_complete_lesson', 'sp_check_achievements')`
    )

    const routines = new Set(rows.map((row) => String(row.ROUTINE_NAME || row.routine_name || '')))

    this.procedureSupport = {
      completeLesson: routines.has('sp_complete_lesson'),
      checkAchievements: routines.has('sp_check_achievements'),
    }
  }

  #normalizeAnswer(value) {
    return String(value ?? '').replace(/\r\n/g, '\n').trim()
  }

  #isProcedureMissingError(error) {
    return (
      error &&
      (error.code === 'ER_SP_DOES_NOT_EXIST' ||
        (typeof error.sqlMessage === 'string' &&
          error.sqlMessage.toLowerCase().includes('does not exist')))
    )
  }
}

module.exports = LessonProgressService
