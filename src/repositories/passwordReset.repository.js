const AppError = require('../core/errors/AppError')

class PasswordResetRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  /**
   * Guarda un token de recuperación para el usuario.
   * Elimina cualquier token previo del mismo usuario antes de insertar,
   * garantizando un único token activo por usuario.
   * Usa la tabla `password_resets` del schema oficial de CodeQuest.
   * @param {number} userId
   * @param {string} tokenHash - Hash SHA-256 del token crudo enviado al usuario
   * @param {Date} expiresAt
   */
  async saveToken(userId, tokenHash, expiresAt) {
    await this.pool.query(
      `DELETE FROM password_resets WHERE user_id = ?`,
      [userId]
    )

    await this.pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, used)
       VALUES (?, ?, ?, FALSE)`,
      [userId, tokenHash, expiresAt]
    )
  }

  /**
   * Busca un registro válido por hash de token.
   * Retorna solo si el token no fue usado y no ha expirado.
   * @param {string} tokenHash
   * @returns {{ user_id: number, expires_at: Date, used: boolean } | null}
   */
  async findValidToken(tokenHash) {
    const [rows] = await this.pool.query(
      `SELECT user_id, expires_at, used
       FROM password_resets
       WHERE token_hash = ?
         AND used = FALSE
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    )

    return rows[0] || null
  }

  /**
   * Marca el token como usado registrando la fecha/hora exacta de uso.
   * Acepta una conexión de transacción opcional para operar dentro de
   * una transacción existente (withTransaction).
   * @param {string} tokenHash
   * @param {object} [conn] - Conexión de transacción opcional
   */
  async markTokenAsUsed(tokenHash, conn) {
    const db = conn || this.pool

    await db.query(
      `UPDATE password_resets
       SET used = TRUE, used_at = NOW()
       WHERE token_hash = ?`,
      [tokenHash]
    )
  }
}

module.exports = PasswordResetRepository
