const mysql = require('mysql2/promise')

function toInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function createDbPool({
  host,
  user,
  password,
  database,
  port,
  connectionLimit = 10,
}) {
  return mysql.createPool({
    host,
    user,
    password,
    database,
    port: toInteger(port, 3306),
    waitForConnections: true,
    connectionLimit: toInteger(connectionLimit, 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    dateStrings: true,
  })
}

module.exports = {
  createDbPool,
}
