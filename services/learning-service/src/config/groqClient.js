const { Groq } = require('groq-sdk')
const { env } = require('./env')

// FIXED: validate API key at startup so the service fails fast with a clear message
if (!env.ai.groqApiKey) {
  throw new Error(
    '[learning-service] GROQ_API_KEY is required but not set. ' +
      'Add it to your environment or .env file.'
  )
}

// FIXED: single Groq client instance shared across all service modules
const groqClient = new Groq({
  apiKey: env.ai.groqApiKey,
  timeout: env.ai.timeoutMs,
  maxRetries: 0,
})

module.exports = { groqClient }
