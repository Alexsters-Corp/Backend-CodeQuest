const crypto = require('crypto')

let tableReady = false
let tablePromise = null

class TokenBlacklistRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async isTokenRevoked(token) {
    await this.#ensureTable()

    const tokenHash = this.#hashToken(token)
    const [rows] = await this.pool.query(
      `SELECT id
       FROM token_blacklist
       WHERE (token_hash = ? OR token_jti = ?)
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash, tokenHash]
    )

    return rows.length > 0
  }

  async #ensureTable() {
    if (tableReady) {
      return
    }

    if (!tablePromise) {
      tablePromise = this.#ensureTableStructure().then(() => {
        tableReady = true
      })
    }

    await tablePromise
  }

  async #ensureTableStructure() {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS token_blacklist (
         id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
       ) ENGINE=InnoDB`
    )

    await this.#ensureColumn(
      'token_hash',
      'ALTER TABLE token_blacklist ADD COLUMN token_hash CHAR(64) NULL'
    )
    await this.#ensureColumn(
      'token_jti',
      'ALTER TABLE token_blacklist ADD COLUMN token_jti VARCHAR(255) NULL'
    )
    await this.#ensureColumn(
      'user_id',
      'ALTER TABLE token_blacklist ADD COLUMN user_id BIGINT UNSIGNED NULL'
    )
    await this.#ensureColumn(
      'expires_at',
      'ALTER TABLE token_blacklist ADD COLUMN expires_at DATETIME NULL'
    )
    await this.#ensureColumn(
      'revoked_at',
      'ALTER TABLE token_blacklist ADD COLUMN revoked_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP'
    )
    await this.#ensureColumn(
      'created_at',
      'ALTER TABLE token_blacklist ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    )

    await this.#ensureIndex(
      'uq_token_blacklist_hash',
      'CREATE UNIQUE INDEX uq_token_blacklist_hash ON token_blacklist (token_hash)'
    )
    await this.#ensureIndex(
      'idx_token_blacklist_expires_at',
      'CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist (expires_at)'
    )
    await this.#ensureIndex(
      'idx_token_blacklist_user_id',
      'CREATE INDEX idx_token_blacklist_user_id ON token_blacklist (user_id)'
    )
  }

  async #ensureColumn(columnName, ddlSql) {
    if (await this.#hasColumn(columnName)) {
      return
    }

    await this.pool.query(ddlSql)
  }

  async #hasColumn(columnName) {
    const [rows] = await this.pool.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'token_blacklist'
         AND column_name = ?
       LIMIT 1`,
      [columnName]
    )

    return rows.length > 0
  }

  async #ensureIndex(indexName, ddlSql) {
    if (await this.#hasIndex(indexName)) {
      return
    }

    await this.pool.query(ddlSql)
  }

  async #hasIndex(indexName) {
    const [rows] = await this.pool.query(
      `SELECT 1
       FROM information_schema.statistics
       WHERE table_schema = DATABASE()
         AND table_name = 'token_blacklist'
         AND index_name = ?
       LIMIT 1`,
      [indexName]
    )

    return rows.length > 0
  }

  #hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex')
  }
}

module.exports = TokenBlacklistRepository
