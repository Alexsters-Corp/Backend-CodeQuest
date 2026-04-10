class TableSchemaRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async findMissingTables(requiredTables) {
    const placeholders = requiredTables.map(() => '?').join(', ')
    const [rows] = await this.pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN (${placeholders})`,
      requiredTables
    )

    const existing = new Set(rows.map((row) => row.table_name))
    return requiredTables.filter((tableName) => !existing.has(tableName))
  }
}

module.exports = TableSchemaRepository
