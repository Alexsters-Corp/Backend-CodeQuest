const { hashToken } = require('../utils/tokenHash')

class TokenBlacklistRepository {
  constructor({ pool }) {
    this.pool = pool
    this.schemaPromise = null
  }

  async revokeToken({ token, userId, expiresAt }) {
    const schema = await this.#resolveSchema()
    const tokenHash = hashToken(token)

    if (schema.hasRevokedAt) {
      await this.pool.query(
        `INSERT INTO token_blacklist (${schema.hashColumn}, user_id, expires_at, revoked_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           user_id = VALUES(user_id),
           expires_at = VALUES(expires_at),
           revoked_at = NOW()`,
        [tokenHash, userId, expiresAt]
      )

      return
    }

    await this.pool.query(
      `INSERT INTO token_blacklist (${schema.hashColumn}, user_id, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         expires_at = VALUES(expires_at)`,
      [tokenHash, userId, expiresAt]
    )
  }

  async isTokenRevoked(token) {
    const schema = await this.#resolveSchema()
    const tokenHash = hashToken(token)

    const [rows] = await this.pool.query(
      `SELECT id
       FROM token_blacklist
       WHERE ${schema.hashColumn} = ?
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    )

    return rows.length > 0
  }

  async #resolveSchema() {
    if (!this.schemaPromise) {
      this.schemaPromise = this.#detectSchema().catch((err) => {
        this.schemaPromise = null
        throw err
      })
    }

    return this.schemaPromise
  }

  async #detectSchema() {
    const [rows] = await this.pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'token_blacklist'`
    )

    const columns = new Set(rows.map((row) => row.column_name || row.COLUMN_NAME))
    const hashColumn = columns.has('token_hash')
      ? 'token_hash'
      : columns.has('token_jti')
        ? 'token_jti'
        : null

    if (!hashColumn) {
      throw new Error('token_blacklist requiere token_hash o token_jti para operar.')
    }

    return {
      hashColumn,
      hasRevokedAt: columns.has('revoked_at'),
    }
  }
}

module.exports = TokenBlacklistRepository
