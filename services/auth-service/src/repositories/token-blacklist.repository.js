const { hashToken } = require('../utils/tokenHash')

function extractTokenJti(token) {
  const parts = String(token || '').split('.')
  if (parts.length < 2) {
    return null
  }

  const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (payloadPart.length % 4)) % 4)

  try {
    const payload = JSON.parse(Buffer.from(`${payloadPart}${padding}`, 'base64').toString('utf8'))
    if (typeof payload?.jti !== 'string' || !payload.jti.trim()) {
      return null
    }

    return payload.jti.trim()
  } catch (_error) {
    return null
  }
}

class TokenBlacklistRepository {
  constructor({ pool }) {
    this.pool = pool
    this.schemaPromise = null
  }

  async revokeToken({ token, userId, expiresAt, tokenJti = null }) {
    const schema = await this.#resolveSchema()
    const tokenHash = hashToken(token)

    const insertColumns = []
    const insertValues = []
    const insertPlaceholders = []

    if (schema.hasTokenHash) {
      insertColumns.push('token_hash')
      insertValues.push(tokenHash)
      insertPlaceholders.push('?')
    }

    if (schema.hasTokenJti) {
      const persistedTokenJti = this.#resolveTokenJti({ token, tokenJti })
      if (!persistedTokenJti) {
        throw new Error('No se pudo resolver token_jti para revocar el token.')
      }

      insertColumns.push('token_jti')
      insertValues.push(persistedTokenJti)
      insertPlaceholders.push('?')
    }

    insertColumns.push('user_id')
    insertValues.push(userId)
    insertPlaceholders.push('?')

    insertColumns.push('expires_at')
    insertValues.push(expiresAt)
    insertPlaceholders.push('?')

    if (schema.hasRevokedAt) {
      insertColumns.push('revoked_at')
      insertPlaceholders.push('NOW()')
    }

    const updateClauses = [
      'user_id = VALUES(user_id)',
      'expires_at = VALUES(expires_at)',
    ]

    if (schema.hasTokenHash) {
      updateClauses.push('token_hash = VALUES(token_hash)')
    }

    if (schema.hasTokenJti) {
      updateClauses.push('token_jti = VALUES(token_jti)')
    }

    if (schema.hasRevokedAt) {
      updateClauses.push('revoked_at = NOW()')
    }

    await this.pool.query(
      `INSERT INTO token_blacklist (${insertColumns.join(', ')})
       VALUES (${insertPlaceholders.join(', ')})
       ON DUPLICATE KEY UPDATE
         ${updateClauses.join(',\n         ')}`,
      insertValues
    )
  }

  async isTokenRevoked(token) {
    const schema = await this.#resolveSchema()
    const tokenHash = hashToken(token)

    if (schema.hasTokenHash) {
      const [rows] = await this.pool.query(
        `SELECT id
         FROM token_blacklist
         WHERE token_hash = ?
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      )

      if (rows.length > 0) {
        return true
      }
    }

    if (!schema.hasTokenJti) {
      return false
    }

    const tokenJti = this.#resolveTokenJti({ token })
    if (!tokenJti) {
      return false
    }

    const [rows] = await this.pool.query(
      `SELECT id
       FROM token_blacklist
       WHERE token_jti = ?
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenJti]
    )

    return rows.length > 0
  }

  #resolveTokenJti({ token, tokenJti = null }) {
    if (typeof tokenJti === 'string' && tokenJti.trim()) {
      return tokenJti.trim()
    }

    return extractTokenJti(token)
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
    const hasTokenHash = columns.has('token_hash')
    const hasTokenJti = columns.has('token_jti')

    if (!hasTokenHash && !hasTokenJti) {
      throw new Error('token_blacklist requiere token_hash o token_jti para operar.')
    }

    return {
      hasTokenHash,
      hasTokenJti,
      hasRevokedAt: columns.has('revoked_at'),
    }
  }
}

module.exports = TokenBlacklistRepository
