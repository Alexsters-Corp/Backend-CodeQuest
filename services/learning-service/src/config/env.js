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
    codeExecution: toBoolean(process.env.FEATURE_CODE_EXECUTION_ENABLED, true),
    guestAccess: toBoolean(process.env.FEATURE_GUEST_ACCESS_ENABLED, false),
    aiContent: toBoolean(process.env.FEATURE_AI_CONTENT_ENABLED, true),
  },
  execution: {
    judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://ce.judge0.com',
    judge0ApiKey: process.env.JUDGE0_API_KEY || '',
    timeoutMs: toInteger(process.env.CODE_EXECUTION_TIMEOUT_MS, 5000),
    maxCodeLength: toInteger(process.env.CODE_EXECUTION_MAX_CODE_LENGTH, 16000),
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '', // FIXED: never hardcode the key
    modelContentGeneration: process.env.AI_MODEL_CONTENT_GENERATION || 'llama-3.3-70b-versatile', // FIXED: correct Groq model ID
    modelEvaluation: process.env.AI_MODEL_EVALUATION || 'llama-3.3-70b-versatile', // FIXED: correct Groq model ID
    modelSafetyCheck: process.env.AI_MODEL_SAFETY_CHECK || 'llama-3.3-70b-versatile', // FIXED: llama-guard-3-8b decommissioned; versatile model supports JSON mode
    maxRetries: toInteger(process.env.AI_MAX_RETRIES, 3),
    timeoutMs: toInteger(process.env.AI_TIMEOUT_MS, 10000),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: toInteger(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || '',
  },
}

module.exports = {
  env,
}
