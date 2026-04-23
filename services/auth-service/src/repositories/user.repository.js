class UserRepository {
  constructor({ pool }) {
    this.pool = pool
    this.verifiedColumnPromise = null
    this.profileColumnsPromise = null
    this.tokensValidAfterExistsPromise = null
  }

  async findByEmail(email) {
    const verifiedColumn = await this.#resolveVerifiedColumn()
    const profileSelect = await this.#buildProfileSelectColumns()
    const [rows] = await this.pool.query(
      `SELECT id,
              name,
              email,
              password_hash,
              role,
              is_active,
              ${profileSelect},
              ${verifiedColumn} AS is_email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    )

    return rows[0] || null
  }

  async findById(id) {
    const verifiedColumn = await this.#resolveVerifiedColumn()
    const profileSelect = await this.#buildProfileSelectColumns()
    const tvaColumn = await this.#resolveTokensValidAfterColumn()
    const [rows] = await this.pool.query(
      `SELECT id,
              name,
              email,
              role,
              is_active,
              ${profileSelect},
              ${tvaColumn},
              ${verifiedColumn} AS is_email_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    )

    return rows[0] || null
  }

  async findByUsername(username) {
    const normalizedUsername = String(username || '').trim()
    if (!normalizedUsername) {
      return null
    }

    const verifiedColumn = await this.#resolveVerifiedColumn()
    const profileSelect = await this.#buildProfileSelectColumns()
    const tvaColumn = await this.#resolveTokensValidAfterColumn()
    const [rows] = await this.pool.query(
      `SELECT id,
              name,
              email,
              role,
              is_active,
              ${profileSelect},
              ${tvaColumn},
              ${verifiedColumn} AS is_email_verified
       FROM users
       WHERE LOWER(username) = LOWER(?)
       LIMIT 1`,
      [normalizedUsername]
    )

    return rows[0] || null
  }

  async createUser({ name, email, passwordHash }) {
    const [result] = await this.pool.query(
      `INSERT INTO users (name, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [name, email, passwordHash]
    )

    return this.findById(result.insertId)
  }

  async updatePasswordById(userId, newPasswordHash) {
    await this.pool.query(
      `UPDATE users
       SET password_hash = ?, updated_at = NOW()
       WHERE id = ?`,
      [newPasswordHash, userId]
    )
  }

  async markEmailVerified(userId) {
    const verifiedColumn = await this.#resolveVerifiedColumn()
    await this.pool.query(
      `UPDATE users
       SET ${verifiedColumn} = 1, updated_at = NOW()
       WHERE id = ?`,
      [userId]
    )
  }

  async touchLastLogin(userId) {
    await this.pool.query(
      `UPDATE users
       SET last_login_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [userId]
    )
  }

  async updateProfileById(userId, { name, email, username, avatarUrl, countryCode, birthDate, emailChanged }) {
    const profileColumns = await this.#resolveProfileColumns()
    const verifiedColumn = await this.#resolveVerifiedColumn()
    const updates = ['name = ?', 'email = ?']
    const params = [name, email]

    if (profileColumns.username) {
      updates.push('username = ?')
      params.push(username)
    }

    if (profileColumns.avatar_url) {
      updates.push('avatar_url = ?')
      params.push(avatarUrl)
    }

    if (profileColumns.country_code) {
      updates.push('country_code = ?')
      params.push(countryCode)
    }

    if (profileColumns.birth_date) {
      updates.push('birth_date = ?')
      params.push(birthDate)
    }

    if (emailChanged) {
      updates.push(`${verifiedColumn} = 0`)
    }

    await this.pool.query(
      `UPDATE users
       SET ${updates.join(', ')},
           updated_at = NOW()
       WHERE id = ?`,
      [...params, userId]
    )

    return this.findById(userId)
  }

  async listUsers({ search, role, status, limit = 50, offset = 0 }) {
    const conditions = ['1 = 1']
    const params = []

    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (role) {
      conditions.push('u.role = ?')
      params.push(role)
    }

    if (status === 'active') {
      conditions.push('u.is_active = 1')
    }

    if (status === 'inactive') {
      conditions.push('u.is_active = 0')
    }

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50))
    const safeOffset = Math.max(0, Number(offset) || 0)

    const [rows] = await this.pool.query(
      `SELECT u.id,
              u.email,
              u.name,
              u.username,
              u.role,
              u.is_active,
              u.email_verified,
              u.last_login_at,
              u.created_at,
              u.updated_at
       FROM users u
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, safeOffset]
    )

    return rows
  }

  async updateRoleAndStatus({ userId, role, isActive }) {
    const updates = []
    const params = []

    if (role !== undefined) {
      updates.push('role = ?')
      params.push(role)
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?')
      params.push(isActive ? 1 : 0)
    }

    if (updates.length === 0) {
      return this.findById(userId)
    }

    await this.pool.query(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = ?`,
      [...params, userId]
    )

    return this.findById(userId)
  }

  async createAdminAuditLog({ adminUserId, action, entityType, entityId, oldValue, newValue }) {
    await this.pool.query(
      `INSERT INTO admin_audit_log (
          admin_user_id,
          action,
          entity_type,
          entity_id,
          old_value,
          new_value,
          created_at
        )
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        adminUserId,
        action,
        entityType || null,
        entityId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    )
  }

  async searchUsersByUsername({ query, excludeUserId = null, limit = 8 }) {
    const normalizedQuery = String(query || '').trim()
    if (!normalizedQuery) {
      return []
    }

    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 8))
    const [rows] = await this.pool.query(
      `SELECT u.id,
              u.name,
              u.username,
              u.avatar_url,
              u.country_code,
              COALESCE(us.total_xp, 0) AS total_xp,
              COALESCE(us.current_level, 1) AS current_level,
              CASE
                WHEN ? IS NULL THEN 0
                WHEN EXISTS (
                  SELECT 1
                  FROM user_follows uf
                  WHERE uf.follower_id = ?
                    AND uf.following_id = u.id
                ) THEN 1
                ELSE 0
              END AS is_following
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE u.username IS NOT NULL
         AND u.username <> ''
         AND u.is_active = 1
         AND (? IS NULL OR u.id <> ?)
         AND LOWER(u.username) LIKE LOWER(?)
       ORDER BY CASE WHEN LOWER(u.username) = LOWER(?) THEN 0 ELSE 1 END,
                us.total_xp DESC,
                u.username ASC
       LIMIT ?`,
      [excludeUserId, excludeUserId, excludeUserId, excludeUserId, `%${normalizedQuery}%`, normalizedQuery, safeLimit]
    )

    return rows
  }

  async followUser({ followerId, followingId }) {
    const [result] = await this.pool.query(
      `INSERT IGNORE INTO user_follows (follower_id, following_id)
       VALUES (?, ?)`,
      [followerId, followingId]
    )

    return Number(result.affectedRows || 0) > 0
  }

  async unfollowUser({ followerId, followingId }) {
    const [result] = await this.pool.query(
      `DELETE FROM user_follows
       WHERE follower_id = ?
         AND following_id = ?`,
      [followerId, followingId]
    )

    return Number(result.affectedRows || 0) > 0
  }

  async isFollowing({ followerId, followingId }) {
    const [rows] = await this.pool.query(
      `SELECT 1
       FROM user_follows
       WHERE follower_id = ?
         AND following_id = ?
       LIMIT 1`,
      [followerId, followingId]
    )

    return rows.length > 0
  }

  async getFollowCounts(userId) {
    const [[followersRow], [followingRow]] = await Promise.all([
      this.pool.query(
        `SELECT COUNT(*) AS total
         FROM user_follows
         WHERE following_id = ?`,
        [userId]
      ),
      this.pool.query(
        `SELECT COUNT(*) AS total
         FROM user_follows
         WHERE follower_id = ?`,
        [userId]
      ),
    ])

    return {
      followers: Number(followersRow[0]?.total || 0),
      following: Number(followingRow[0]?.total || 0),
    }
  }

  async listFollowing({ userId, limit = 50 }) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50))
    const [rows] = await this.pool.query(
      `SELECT u.id,
              u.name,
              u.username,
              u.avatar_url,
              u.country_code,
              COALESCE(us.total_xp, 0) AS total_xp,
              COALESCE(us.current_level, 1) AS current_level,
              uf.created_at AS followed_at
       FROM user_follows uf
       JOIN users u ON u.id = uf.following_id
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE uf.follower_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ?`,
      [userId, safeLimit]
    )

    return rows
  }

  async listFollowers({ userId, limit = 50 }) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50))
    const [rows] = await this.pool.query(
      `SELECT u.id,
              u.name,
              u.username,
              u.avatar_url,
              u.country_code,
              COALESCE(us.total_xp, 0) AS total_xp,
              COALESCE(us.current_level, 1) AS current_level,
              uf.created_at AS followed_at,
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM user_follows back
                  WHERE back.follower_id = ?
                    AND back.following_id = u.id
                ) THEN 1
                ELSE 0
              END AS is_following_back
       FROM user_follows uf
       JOIN users u ON u.id = uf.follower_id
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE uf.following_id = ?
       ORDER BY uf.created_at DESC
       LIMIT ?`,
      [userId, userId, safeLimit]
    )

    return rows
  }

  async getGlobalLeaderboard({ actorUserId = null, limit = 25 }) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25))
    const [rows] = await this.pool.query(
      `SELECT ranked.rank_position,
              ranked.id,
              ranked.name,
              ranked.username,
              ranked.avatar_url,
              ranked.country_code,
              ranked.total_xp,
              ranked.current_level,
              ranked.lessons_completed,
              CASE
                WHEN ? IS NULL THEN 0
                WHEN EXISTS (
                  SELECT 1
                  FROM user_follows uf
                  WHERE uf.follower_id = ?
                    AND uf.following_id = ranked.id
                ) THEN 1
                ELSE 0
              END AS is_following
       FROM (
         SELECT u.id,
                u.name,
                u.username,
                u.avatar_url,
                u.country_code,
                COALESCE(us.total_xp, 0) AS total_xp,
                COALESCE(us.current_level, 1) AS current_level,
                COALESCE(us.lessons_completed, 0) AS lessons_completed,
                ROW_NUMBER() OVER (
                  ORDER BY COALESCE(us.total_xp, 0) DESC,
                           COALESCE(us.current_level, 1) DESC,
                           u.id ASC
                ) AS rank_position
         FROM users u
         LEFT JOIN user_stats us ON us.user_id = u.id
         WHERE u.is_active = 1
           AND u.username IS NOT NULL
           AND u.username <> ''
       ) AS ranked
       ORDER BY ranked.rank_position ASC
       LIMIT ?`,
      [actorUserId, actorUserId, safeLimit]
    )

    return rows
  }

  async getFollowingLeaderboard({ actorUserId, limit = 25 }) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25))
    const [rows] = await this.pool.query(
      `SELECT ranked.rank_position,
              ranked.id,
              ranked.name,
              ranked.username,
              ranked.avatar_url,
              ranked.country_code,
              ranked.total_xp,
              ranked.current_level,
              ranked.lessons_completed,
              1 AS is_following
       FROM (
         SELECT u.id,
                u.name,
                u.username,
                u.avatar_url,
                u.country_code,
                COALESCE(us.total_xp, 0) AS total_xp,
                COALESCE(us.current_level, 1) AS current_level,
                COALESCE(us.lessons_completed, 0) AS lessons_completed,
                ROW_NUMBER() OVER (
                  ORDER BY COALESCE(us.total_xp, 0) DESC,
                           COALESCE(us.current_level, 1) DESC,
                           u.id ASC
                ) AS rank_position
         FROM user_follows uf
         JOIN users u ON u.id = uf.following_id
         LEFT JOIN user_stats us ON us.user_id = u.id
         WHERE uf.follower_id = ?
           AND u.is_active = 1
           AND u.username IS NOT NULL
           AND u.username <> ''
       ) AS ranked
       ORDER BY ranked.rank_position ASC
       LIMIT ?`,
      [actorUserId, safeLimit]
    )

    return rows
  }

  async #resolveVerifiedColumn() {
    if (!this.verifiedColumnPromise) {
      this.verifiedColumnPromise = this.#detectVerifiedColumn().catch((err) => {
        this.verifiedColumnPromise = null
        throw err
      })
    }

    return this.verifiedColumnPromise
  }

  async #detectVerifiedColumn() {
    const [rows] = await this.pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'users'
         AND column_name IN ('is_email_verified', 'email_verified')`
    )

    const columns = new Set(rows.map((row) => row.column_name || row.COLUMN_NAME))

    if (columns.has('is_email_verified')) {
      return 'is_email_verified'
    }

    if (columns.has('email_verified')) {
      return 'email_verified'
    }

    throw new Error('La tabla users no contiene columna de verificacion de email compatible.')
  }

  async #buildProfileSelectColumns() {
    const profileColumns = await this.#resolveProfileColumns()
    const candidates = [
      ['username', profileColumns.username],
      ['avatar_url', profileColumns.avatar_url],
      ['country_code', profileColumns.country_code],
      ['birth_date', profileColumns.birth_date],
    ]

    return candidates
      .map(([column, exists]) => (exists ? column : `NULL AS ${column}`))
      .join(',\n              ')
  }

  async #resolveProfileColumns() {
    if (!this.profileColumnsPromise) {
      this.profileColumnsPromise = this.#detectProfileColumns().catch((err) => {
        this.profileColumnsPromise = null
        throw err
      })
    }

    return this.profileColumnsPromise
  }

  async #detectProfileColumns() {
    const [rows] = await this.pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'users'
         AND column_name IN ('username', 'avatar_url', 'country_code', 'birth_date')`
    )

    const columns = new Set(rows.map((row) => row.column_name || row.COLUMN_NAME))

    return {
      username: columns.has('username'),
      avatar_url: columns.has('avatar_url'),
      country_code: columns.has('country_code'),
      birth_date: columns.has('birth_date'),
    }
  }

  async #resolveTokensValidAfterColumn() {
    if (!this.tokensValidAfterExistsPromise) {
      this.tokensValidAfterExistsPromise = this.#detectTokensValidAfterColumn().catch((err) => {
        this.tokensValidAfterExistsPromise = null
        throw err
      })
    }

    return this.tokensValidAfterExistsPromise
  }

  async #detectTokensValidAfterColumn() {
    const [rows] = await this.pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'users'
         AND column_name = 'tokens_valid_after'`
    )

    return rows.length > 0 ? 'tokens_valid_after' : 'NULL AS tokens_valid_after'
  }

  async setTokensValidAfter(userId, date) {
    try {
      await this.pool.query(
        `UPDATE users
         SET tokens_valid_after = ?, updated_at = NOW()
         WHERE id = ?`,
        [date, userId]
      )
    } catch (_error) {
      // Column may not exist yet if migration hasn't run — non-fatal
    }
  }
}

module.exports = UserRepository
