require('dotenv').config()

function toInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInteger(process.env.PORT, 4000),
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'codequest',
    port: toInteger(process.env.DB_PORT, 3306),
    connectionLimit: toInteger(process.env.DB_CONNECTION_LIMIT, 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
}

function validateEnv() {
  const hasDefaultSecrets =
    env.jwt.accessSecret === 'dev_access_secret_change_me' ||
    env.jwt.refreshSecret === 'dev_refresh_secret_change_me'

  if (env.nodeEnv === 'production' && hasDefaultSecrets) {
    throw new Error('JWT secrets no pueden usar valores por defecto en producción.')
  }
}

validateEnv()

module.exports = { env }
