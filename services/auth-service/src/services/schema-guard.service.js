const { AppError } = require('@codequest/shared')

const REQUIRED_TABLES = ['users', 'token_blacklist', 'auth_tokens']

class SchemaGuardService {
  constructor({ schemaRepository, ttlMs = 60000 }) {
    this.schemaRepository = schemaRepository
    this.ttlMs = ttlMs
    this.cachedUntil = 0
    this.cachedError = null
  }

  async assertReady() {
    const now = Date.now()
    if (this.cachedUntil > now) {
      if (this.cachedError) {
        throw this.cachedError
      }
      return
    }

    const missingTables = await this.schemaRepository.findMissingTables(REQUIRED_TABLES)
    if (missingTables.length > 0) {
      const error = AppError.serviceUnavailable(
        'El esquema de autenticacion aun no esta migrado. Ejecuta las migraciones de auth antes de usar este endpoint.',
        'AUTH_SCHEMA_PENDING',
        { missingTables }
      )

      this.cachedError = error
      this.cachedUntil = now + this.ttlMs
      throw error
    }

    this.cachedError = null
    this.cachedUntil = now + this.ttlMs
  }
}

module.exports = SchemaGuardService
