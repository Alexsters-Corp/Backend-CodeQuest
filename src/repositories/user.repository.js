const AppError = require('../core/errors/AppError')

let cachedSchema = null
let schemaPromise = null

class UserRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async findExistingByEmail(email) {
    const schema = await this.#resolveSchema()
    const [rows] = await this.pool.query(
      `SELECT ${schema.idColumn} AS id
       FROM ${schema.tableName}
       WHERE ${schema.emailColumn} = ?
       LIMIT 1`,
      [email]
    )

    return rows[0] || null
  }

  async createUser({ nombre, email, passwordHash }) {
    const schema = await this.#resolveSchema()

    const [result] = await this.pool.query(
      `INSERT INTO ${schema.tableName} (${schema.nameColumn}, ${schema.emailColumn}, ${schema.passwordColumn})
       VALUES (?, ?, ?)`,
      [nombre, email, passwordHash]
    )

    return {
      id: result.insertId,
      nombre,
      email,
    }
  }

  async findAuthUserByEmail(email) {
    const schema = await this.#resolveSchema()
    const activeClause = schema.activeWhereClause ? ` AND ${schema.activeWhereClause}` : ''

    const [rows] = await this.pool.query(
      `SELECT ${schema.idColumn} AS id,
              ${schema.nameColumn} AS nombre,
              ${schema.emailColumn} AS email,
              ${schema.passwordColumn} AS passwordHash
       FROM ${schema.tableName}
       WHERE ${schema.emailColumn} = ?${activeClause}
       LIMIT 1`,
      [email]
    )

    return rows[0] || null
  }

  async touchLastLoginIfSupported(userId) {
    const schema = await this.#resolveSchema()
    if (!schema.lastLoginColumn) {
      return
    }

    await this.pool.query(
      `UPDATE ${schema.tableName}
       SET ${schema.lastLoginColumn} = NOW()
       WHERE ${schema.idColumn} = ?`,
      [userId]
    )
  }

  async findBasicById(userId) {
    const schema = await this.#resolveSchema()

    const [rows] = await this.pool.query(
      `SELECT ${schema.idColumn} AS id,
              ${schema.emailColumn} AS email,
              ${schema.nameColumn} AS nombre
       FROM ${schema.tableName}
       WHERE ${schema.idColumn} = ?
       LIMIT 1`,
      [userId]
    )

    return rows[0] || null
  }

  async findMeById(userId) {
    const schema = await this.#resolveSchema()
    const statusProjection = this.#buildStatusProjection(schema)
    const createdProjection = schema.createdAtColumn
      ? `${schema.createdAtColumn} AS fecha_registro`
      : 'NULL AS fecha_registro'

    const [rows] = await this.pool.query(
      `SELECT ${schema.idColumn} AS id,
              ${schema.nameColumn} AS nombre,
              ${schema.emailColumn} AS email,
              ${statusProjection},
              ${createdProjection}
       FROM ${schema.tableName}
       WHERE ${schema.idColumn} = ?
       LIMIT 1`,
      [userId]
    )

    return rows[0] || null
  }

  async updateName(userId, nombre) {
    const schema = await this.#resolveSchema()

    await this.pool.query(
      `UPDATE ${schema.tableName}
       SET ${schema.nameColumn} = ?
       WHERE ${schema.idColumn} = ?`,
      [nombre, userId]
    )
  }

  /**
   * Actualiza la contraseña de un usuario por su ID.
   * Acepta una conexión de transacción opcional para operar dentro de una transacción existente.
   * @param {number} userId
   * @param {string} passwordHash - Nuevo hash bcrypt
   * @param {object} [conn] - Conexión de transacción opcional (de withTransaction)
   */
  async updatePasswordById(userId, passwordHash, conn) {
    const schema = await this.#resolveSchema()
    const db = conn || this.pool

    await db.query(
      `UPDATE ${schema.tableName}
       SET ${schema.passwordColumn} = ?
       WHERE ${schema.idColumn} = ?`,
      [passwordHash, userId]
    )
  }

  #buildStatusProjection(schema) {
    if (schema.statusColumn === 'estado') {
      return 'estado'
    }

    if (schema.statusColumn === 'is_active' || schema.statusColumn === 'activo') {
      return `CASE WHEN ${schema.statusColumn} = 1 THEN 'activo' ELSE 'inactivo' END AS estado`
    }

    return `'activo' AS estado`
  }

  async #resolveSchema() {
    if (cachedSchema) {
      return cachedSchema
    }

    if (!schemaPromise) {
      schemaPromise = this.#detectSchema()
    }

    cachedSchema = await schemaPromise
    return cachedSchema
  }

  async #detectSchema() {
    const [tableRows] = await this.pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN ('users', 'usuarios')`
    )

    const existingTables = new Set(tableRows.map((row) => row.table_name || row.TABLE_NAME))
    const tableName = existingTables.has('users') ? 'users' : existingTables.has('usuarios') ? 'usuarios' : null

    if (!tableName) {
      throw new AppError(
        'No se encontro una tabla de usuarios compatible (users o usuarios).',
        500,
        'USER_SCHEMA_NOT_SUPPORTED'
      )
    }

    const [columnRows] = await this.pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = ?`,
      [tableName]
    )

    const columns = new Set(columnRows.map((row) => row.column_name || row.COLUMN_NAME))
    const nameColumn = columns.has('name') ? 'name' : columns.has('nombre') ? 'nombre' : null
    const passwordColumn = columns.has('password_hash')
      ? 'password_hash'
      : columns.has('password')
        ? 'password'
        : null

    if (!columns.has('id') || !columns.has('email') || !nameColumn || !passwordColumn) {
      throw new AppError(
        `La tabla ${tableName} no tiene columnas minimas requeridas para autenticacion.`,
        500,
        'USER_SCHEMA_NOT_SUPPORTED'
      )
    }

    let activeWhereClause = null
    let statusColumn = null

    if (columns.has('is_active')) {
      activeWhereClause = 'is_active = 1'
      statusColumn = 'is_active'
    } else if (columns.has('activo')) {
      activeWhereClause = 'activo = 1'
      statusColumn = 'activo'
    } else if (columns.has('estado')) {
      activeWhereClause = "estado = 'activo'"
      statusColumn = 'estado'
    }

    const createdAtColumn = columns.has('created_at')
      ? 'created_at'
      : columns.has('fecha_registro')
        ? 'fecha_registro'
        : columns.has('fecha_creacion')
          ? 'fecha_creacion'
          : null

    const lastLoginColumn = columns.has('last_login')
      ? 'last_login'
      : columns.has('ultimo_login')
        ? 'ultimo_login'
        : null

    return {
      tableName,
      idColumn: 'id',
      emailColumn: 'email',
      nameColumn,
      passwordColumn,
      statusColumn,
      activeWhereClause,
      createdAtColumn,
      lastLoginColumn,
    }
  }
}

module.exports = UserRepository
