class LessonsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async findById(lessonId) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.title,
              l.slug,
              COALESCE(l.description, '') AS description,
              l.content,
              l.order_position,
              COALESCE(l.estimated_minutes, 0) AS estimated_minutes,
              COALESCE(l.xp_reward, 0) AS xp_reward,
              l.is_free_demo,
              l.is_published,
              l.learning_path_id,
              lp.name AS learning_path_name,
              lp.slug AS learning_path_slug,
              lp.programming_language_id AS language_id,
              pl.name AS language_name,
              pl.display_name AS language_display_name,
              pl.logo_url AS language_logo_url
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE l.id = ?
         AND l.is_published = 1
       LIMIT 1`,
      [lessonId]
    )

    if (rows.length === 0) {
      return null
    }

    const row = rows[0]

    return {
      id: Number(row.id),
      title: row.title,
      slug: row.slug,
      description: row.description,
      content: row.content,
      order_position: Number(row.order_position),
      estimated_minutes: Number(row.estimated_minutes || 0),
      xp_reward: Number(row.xp_reward || 0),
      is_free_demo: Boolean(row.is_free_demo),
      is_published: Boolean(row.is_published),
      learning_path: {
        id: Number(row.learning_path_id),
        name: row.learning_path_name,
        slug: row.learning_path_slug,
        language: {
          id: Number(row.language_id),
          name: row.language_name,
          display_name: row.language_display_name,
          logo_url: row.language_logo_url,
        },
      },
    }
  }

  async findLatestSelectedPathForLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT ulp.id,
              ulp.learning_path_id,
              ulp.selected_at,
              lp.name AS learning_path_name,
              lp.programming_language_id
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       WHERE ulp.user_id = ?
         AND lp.programming_language_id = ?
       ORDER BY ulp.selected_at DESC, ulp.id DESC
       LIMIT 1`,
      [userId, languageId]
    )

    return rows[0] || null
  }

  async validateLessonAccess({ userId, lesson }) {
    const selectedPath = await this.findLatestSelectedPathForLanguage({
      userId,
      languageId: lesson.learning_path.language.id,
    })

    if (!selectedPath) {
      return {
        ok: false,
        code: 'NO_LEARNING_PATH',
      }
    }

    if (Number(selectedPath.learning_path_id) !== Number(lesson.learning_path.id)) {
      return {
        ok: false,
        code: 'LESSON_NOT_IN_PATH',
        details: {
          user_path: selectedPath.learning_path_name,
          lesson_path: lesson.learning_path.name,
        },
      }
    }

    return {
      ok: true,
      selectedPath,
    }
  }

  async getUserProgress({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT status,
              started_at,
              completed_at,
              xp_earned,
              submission_count,
              last_accessed_at
       FROM user_progress
       WHERE user_id = ? AND lesson_id = ?
       LIMIT 1`,
      [userId, lessonId]
    )

    return rows[0] || null
  }

  async findLessonNavigation({ learningPathId, orderPosition, userId = null }) {
    const [previousRows] = await this.pool.query(
      `SELECT id, title, slug, order_position
       FROM lessons
       WHERE learning_path_id = ?
         AND is_published = 1
         AND order_position < ?
       ORDER BY order_position DESC
       LIMIT 1`,
      [learningPathId, orderPosition]
    )

    const [nextRows] = await this.pool.query(
      `SELECT id, title, slug, order_position
       FROM lessons
       WHERE learning_path_id = ?
         AND is_published = 1
         AND order_position > ?
       ORDER BY order_position ASC
       LIMIT 1`,
      [learningPathId, orderPosition]
    )

    const previous = previousRows[0] || null
    const next = nextRows[0] || null
    const lessonIds = [previous?.id, next?.id].filter((value) => Number.isInteger(Number(value)))
    const completionByLesson = new Map()

    if (userId && lessonIds.length > 0) {
      const [progressRows] = await this.pool.query(
        `SELECT lesson_id, status
         FROM user_progress
         WHERE user_id = ?
           AND lesson_id IN (?)`,
        [userId, lessonIds]
      )

      progressRows.forEach((row) => {
        completionByLesson.set(Number(row.lesson_id), row.status === 'completed')
      })
    }

    const mapLesson = (row) => {
      if (!row) {
        return null
      }

      return {
        id: Number(row.id),
        title: row.title,
        slug: row.slug,
        order_position: Number(row.order_position),
        is_completed: Boolean(completionByLesson.get(Number(row.id))),
      }
    }

    return {
      previous_lesson: mapLesson(previous),
      next_lesson: mapLesson(next),
    }
  }

  async updateLastAccessed({ userId, lessonId }) {
    await this.pool.query(
      `INSERT INTO user_progress (user_id, lesson_id, status, started_at, last_accessed_at, submission_count)
       VALUES (?, ?, 'in_progress', NOW(), NOW(), 0)
       ON DUPLICATE KEY UPDATE
         started_at = COALESCE(started_at, NOW()),
         status = IF(status = 'completed', 'completed', IF(status = 'not_started', 'in_progress', status)),
         last_accessed_at = NOW()`,
      [userId, lessonId]
    )
  }
}

module.exports = LessonsRepository
