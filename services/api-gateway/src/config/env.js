const { PORTS } = require('@codequest/shared')
require('dotenv').config()

function toInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback
  }

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'api-gateway',
  port: toInteger(process.env.PORT, PORTS.gateway),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  authServiceUrl: process.env.AUTH_SERVICE_URL || `http://localhost:${PORTS.auth}`,
  learningServiceUrl: process.env.LEARNING_SERVICE_URL || `http://localhost:${PORTS.learning}`,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInteger(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'codequest',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'codequest',
  },
  authValidationFailOpen: toBoolean(process.env.AUTH_VALIDATION_FAIL_OPEN, false),
}

module.exports = { env }
