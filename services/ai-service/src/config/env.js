const { PORTS } = require('@codequest/shared')
require('dotenv').config({ quiet: process.env.NODE_ENV === 'test' })

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
  port: toInteger(process.env.PORT, PORTS.ai),
  serviceName: 'ai-service',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'codequest',
    port: toInteger(process.env.DB_PORT, 3306),
    connectionLimit: toInteger(process.env.DB_CONNECTION_LIMIT, 10),
  },
  features: {
    aiContent: toBoolean(process.env.FEATURE_AI_CONTENT_ENABLED, true),
    aiEvaluation: toBoolean(process.env.FEATURE_AI_EVALUATION_ENABLED, true),
  },
  execution: {
    judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://ce.judge0.com',
    judge0ApiKey: process.env.JUDGE0_API_KEY || '',
    timeoutMs: toInteger(process.env.CODE_EXECUTION_TIMEOUT_MS, 5000),
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    modelContentGeneration: process.env.AI_MODEL_CONTENT_GENERATION || 'llama-3.3-70b-versatile',
    modelEvaluation: process.env.AI_MODEL_EVALUATION || 'llama-3.3-70b-versatile',
    modelSafetyCheck: process.env.AI_MODEL_SAFETY_CHECK || 'llama-3.3-70b-versatile',
    maxRetries: toInteger(process.env.AI_MAX_RETRIES, 3),
    timeoutMs: toInteger(process.env.AI_TIMEOUT_MS, 10000),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: toInteger(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || '',
  },
}

module.exports = { env }
