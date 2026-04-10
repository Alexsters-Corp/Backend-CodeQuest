class AuthTokenRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async createToken({ userId, tokenHash, tokenType, expiresAt }) {
    await this.pool.query(
      `INSERT INTO auth_tokens (user_id, token_hash, token_type, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, NULL, NOW())`,
      [userId, tokenHash, tokenType, expiresAt]
    )
  }

  async findValidToken({ tokenHash, tokenType }) {
    const [rows] = await this.pool.query(
      `SELECT id, user_id
       FROM auth_tokens
       WHERE token_hash = ?
         AND token_type = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash, tokenType]
    )

    return rows[0] || null
  }

  async markTokenUsed(tokenId) {
    await this.pool.query(
      `UPDATE auth_tokens
       SET used_at = NOW()
       WHERE id = ?`,
      [tokenId]
    )
  }
}

module.exports = AuthTokenRepository
