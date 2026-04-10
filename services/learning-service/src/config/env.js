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
  port: toInteger(process.env.PORT, PORTS.learning),
  serviceName: 'learning-service',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'codequest',
    port: toInteger(process.env.DB_PORT, 3306),
    connectionLimit: toInteger(process.env.DB_CONNECTION_LIMIT, 10),
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  features: {
    paths: toBoolean(process.env.FEATURE_LEARNING_PATHS, true),
    lessons: toBoolean(process.env.FEATURE_LEARNING_LESSONS, true),
    progress: toBoolean(process.env.FEATURE_LEARNING_PROGRESS, true),
    favorites: toBoolean(process.env.FEATURE_LEARNING_FAVORITES, true),
  },
}

module.exports = {
  env,
}
