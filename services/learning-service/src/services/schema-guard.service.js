const { AppError } = require('@codequest/shared')

const TABLE_GROUPS = {
  base: ['programming_languages', 'learning_paths'],
  lessons: ['lessons', 'user_progress'],
  progress: ['user_progress'],
  favorites: ['user_favorite_paths'],
  diagnostic: ['user_diagnostic_attempts', 'user_learning_paths'],
}

class SchemaGuardService {
  constructor({ schemaRepository, ttlMs = 60000 }) {
    this.schemaRepository = schemaRepository
    this.ttlMs = ttlMs
    this.cache = new Map()
  }

  async assertGroup(groupName) {
    const requiredTables = TABLE_GROUPS[groupName]
    if (!requiredTables) {
      throw new Error(`Grupo de esquema no soportado: ${groupName}`)
    }

    const now = Date.now()
    const cached = this.cache.get(groupName)

    if (cached && cached.expiresAt > now) {
      if (cached.error) {
        throw cached.error
      }
      return
    }

    const missingTables = await this.schemaRepository.findMissingTables(requiredTables)
    if (missingTables.length > 0) {
      const error = AppError.serviceUnavailable(
        `El esquema para ${groupName} aun no esta disponible. Ejecuta las migraciones pendientes.`,
        'LEARNING_SCHEMA_PENDING',
        { group: groupName, missingTables }
      )

      this.cache.set(groupName, {
        expiresAt: now + this.ttlMs,
        error,
      })

      throw error
    }

    this.cache.set(groupName, {
      expiresAt: now + this.ttlMs,
      error: null,
    })
  }
}

module.exports = SchemaGuardService
