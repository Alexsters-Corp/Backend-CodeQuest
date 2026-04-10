class UserRepository {
  constructor({ pool }) {
    this.pool = pool
    this.verifiedColumnPromise = null
  }

  async findByEmail(email) {
    const verifiedColumn = await this.#resolveVerifiedColumn()
    const [rows] = await this.pool.query(
      `SELECT id, name, email, password_hash, ${verifiedColumn} AS is_email_verified
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
      `SELECT id, name, email, ${verifiedColumn} AS is_email_verified
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
