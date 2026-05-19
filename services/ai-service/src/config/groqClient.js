const { Groq } = require('groq-sdk')
const { env } = require('./env')

const aiRequiresProvider = env.features.aiContent || env.features.aiEvaluation

// Validate API key at startup when AI features are enabled.
if (aiRequiresProvider && !env.ai.groqApiKey) {
  throw new Error(
    '[ai-service] GROQ_API_KEY is required but not set. ' +
      'Add it to your environment or .env file.'
  )
}

// FIXED: single Groq client instance shared across all service modules
const groqClient = new Groq({
  apiKey: env.ai.groqApiKey || 'disabled',
  timeout: env.ai.timeoutMs,
  maxRetries: 0,
})

module.exports = { groqClient }
