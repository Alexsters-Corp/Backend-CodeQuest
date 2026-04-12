class UserRepository {
  constructor({ pool }) {
    this.pool = pool
    this.verifiedColumnPromise = null
  }

  async findByEmail(email) {
    const verifiedColumn = await this.#resolveVerifiedColumn()
    const [rows] = await this.pool.query(
      `SELECT id,
              name,
              email,
              password_hash,
              role,
              is_active,
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
    const [rows] = await this.pool.query(
      `SELECT id,
              name,
              email,
              role,
              is_active,
              ${verifiedColumn} AS is_email_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
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

  async #resolveVerifiedColumn() {
    if (!this.verifiedColumnPromise) {
      this.verifiedColumnPromise = this.#detectVerifiedColumn()
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
}

module.exports = UserRepository
