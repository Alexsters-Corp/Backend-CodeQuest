class ClassManagementRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async createClass({ instructorUserId, name, description }) {
    const [result] = await this.pool.query(
      `INSERT INTO instructor_classes (
          instructor_user_id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [instructorUserId, name, description || null]
    )

    return this.findClassById(result.insertId)
  }

  async findClassById(classId) {
    const [rows] = await this.pool.query(
      `SELECT ic.id,
              ic.instructor_user_id,
              ic.name,
              COALESCE(ic.description, '') AS description,
              ic.is_active,
              ic.created_at,
              ic.updated_at
       FROM instructor_classes ic
       WHERE ic.id = ?
       LIMIT 1`,
      [classId]
    )

    return rows[0] || null
  }

  async listClassesByInstructor(instructorUserId) {
    const [rows] = await this.pool.query(
      `SELECT ic.id,
              ic.name,
              COALESCE(ic.description, '') AS description,
              ic.is_active,
              ic.created_at,
              COALESCE(st.students_total, 0) AS students_total,
              COALESCE(ap.assigned_paths_total, 0) AS assigned_paths_total
       FROM instructor_classes ic
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS students_total
         FROM class_students
         WHERE status = 'active'
         GROUP BY class_id
       ) st ON st.class_id = ic.id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS assigned_paths_total
         FROM class_learning_paths
         GROUP BY class_id
       ) ap ON ap.class_id = ic.id
       WHERE ic.instructor_user_id = ?
       ORDER BY ic.created_at DESC`,
      [instructorUserId]
    )

    return rows
  }

  async findClassOwnedByInstructor({ classId, instructorUserId }) {
    const [rows] = await this.pool.query(
      `SELECT id, instructor_user_id, name, description, is_active
       FROM instructor_classes
       WHERE id = ?
         AND instructor_user_id = ?
       LIMIT 1`,
      [classId, instructorUserId]
    )

    return rows[0] || null
  }

  async createInviteCode({ classId, code, inviteEmail, expiresAt, maxUses, createdByUserId }) {
    await this.pool.query(
      `INSERT INTO class_invite_codes (
          class_id,
          code,
          invite_email,
          expires_at,
          max_uses,
          used_count,
          is_active,
          created_by_user_id,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, ?, ?, 0, 1, ?, NOW(), NOW())`,
      [classId, code, inviteEmail || null, expiresAt || null, maxUses || null, createdByUserId]
    )

    const [rows] = await this.pool.query(
      `SELECT id, class_id, code, invite_email, expires_at, max_uses, used_count, is_active, created_at
       FROM class_invite_codes
       WHERE code = ?
       LIMIT 1`,
      [code]
    )

    return rows[0] || null
  }

  async assignPathToClass({ classId, learningPathId, isRequired, assignedByUserId }) {
    await this.pool.query(
      `INSERT INTO class_learning_paths (
          class_id,
          learning_path_id,
          is_required,
          assigned_by_user_id,
          assigned_at,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         is_required = VALUES(is_required),
         assigned_by_user_id = VALUES(assigned_by_user_id),
         assigned_at = NOW(),
         updated_at = NOW()`,
      [classId, learningPathId, isRequired ? 1 : 0, assignedByUserId]
    )

    const [rows] = await this.pool.query(
      `SELECT clp.class_id,
              clp.learning_path_id,
              clp.is_required,
              clp.assigned_at,
              lp.name AS learning_path_name,
              lp.difficulty_level
       FROM class_learning_paths clp
       JOIN learning_paths lp ON lp.id = clp.learning_path_id
       WHERE clp.class_id = ?
         AND clp.learning_path_id = ?
       LIMIT 1`,
      [classId, learningPathId]
    )

    return rows[0] || null
  }

  async getClassAnalytics(classId) {
    const [summaryRows] = await this.pool.query(
      `SELECT
         COUNT(DISTINCT CASE WHEN cs.status = 'active' THEN cs.student_user_id END) AS students_total,
         COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons_total,
         COALESCE(COUNT(DISTINCT up.lesson_id), 0) AS lessons_started_total,
         COALESCE(ROUND(AVG(CASE
           WHEN up.status = 'completed' THEN 100
           WHEN up.status = 'in_progress' THEN 50
           ELSE 0
         END), 2), 0) AS progress_signal_avg
       FROM class_students cs
       LEFT JOIN user_progress up ON up.user_id = cs.student_user_id
       WHERE cs.class_id = ?`,
      [classId]
    )

    const [studentsRows] = await this.pool.query(
      `SELECT u.id,
              u.name,
              u.email,
              COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons,
              COALESCE(COUNT(DISTINCT up.lesson_id), 0) AS started_lessons,
              COALESCE(SUM(up.xp_earned), 0) AS earned_xp
       FROM class_students cs
       JOIN users u ON u.id = cs.student_user_id
       LEFT JOIN user_progress up ON up.user_id = cs.student_user_id
       WHERE cs.class_id = ?
         AND cs.status = 'active'
       GROUP BY u.id, u.name, u.email
       ORDER BY earned_xp DESC, completed_lessons DESC
       LIMIT 200`,
      [classId]
    )

    return {
      summary: summaryRows[0] || {
        students_total: 0,
        completed_lessons_total: 0,
        lessons_started_total: 0,
        progress_signal_avg: 0,
      },
      students: studentsRows,
    }
  }

  async createLearningPath({
    programmingLanguageId,
    name,
    slug,
    description,
    difficultyLevel,
    estimatedHours,
    isActive,
  }) {
    const [result] = await this.pool.query(
      `INSERT INTO learning_paths (
          programming_language_id,
          name,
          slug,
          description,
          difficulty_level,
          estimated_hours,
          is_active,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        programmingLanguageId,
        name,
        slug,
        description || null,
        difficultyLevel,
        estimatedHours || null,
        isActive ? 1 : 0,
      ]
    )

    const [rows] = await this.pool.query(
      `SELECT id,
              programming_language_id,
              name,
              slug,
              description,
              difficulty_level,
              estimated_hours,
              is_active,
              created_at
       FROM learning_paths
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    )

    return rows[0] || null
  }

  async getGlobalAnalytics() {
    const [[usersSummary]] = await this.pool.query(
      `SELECT
         COUNT(*) AS users_total,
         COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS users_active,
         COALESCE(SUM(CASE WHEN role IN ('user', 'student') THEN 1 ELSE 0 END), 0) AS users_role_user,
         COALESCE(SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END), 0) AS users_role_instructor,
         COALESCE(SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END), 0) AS users_role_admin
       FROM users`
    )

    const [[learningSummary]] = await this.pool.query(
      `SELECT
         (SELECT COUNT(*) FROM learning_paths) AS learning_paths_total,
         (SELECT COUNT(*) FROM learning_paths WHERE is_active = 1) AS learning_paths_active,
         (SELECT COUNT(*) FROM lessons) AS lessons_total,
         (SELECT COUNT(*) FROM lessons WHERE is_published = 1) AS lessons_published,
         (SELECT COUNT(*) FROM user_progress WHERE status = 'completed') AS lessons_completed_total,
         (SELECT COALESCE(SUM(xp_earned), 0) FROM user_progress) AS xp_distributed_total,
         (SELECT COUNT(*) FROM user_diagnostic_attempts WHERE status = 'completed') AS diagnostics_completed_total`
    )

    return {
      users: usersSummary,
      learning: learningSummary,
    }
  }
}

module.exports = ClassManagementRepository
