const { PORTS } = require('@codequest/shared')
require('dotenv').config()

function toInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
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
}

module.exports = { env }
