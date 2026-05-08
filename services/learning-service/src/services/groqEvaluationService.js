// g:/IUP - Yamith Alexander Ardila Cabrera/PSW3/CodeQuest Project/Backend-CodeQuest/services/learning-service/src/services/groqEvaluationService.js
const { AppError } = require('@codequest/shared')
const { env } = require('../config/env')
const { groqClient } = require('../config/groqClient') // FIXED: singleton client, not per-request

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeGroqContent(content) {
  if (typeof content === 'string') {
    return content
  }

  if (content === null || content === undefined) {
    return ''
  }

  return String(content)
}

// FIXED: uses singleton groqClient; added jsonMode for response_format; added error logging
async function callGroq({ model, messages, temperature = 0.4, maxTokens = 600, timeoutMs = 10000, jsonMode = false }) {
  try {
    const requestOptions = {
      messages,
      model,
      temperature,
      max_completion_tokens: maxTokens,
      top_p: 1,
      stream: false,
    }

    if (jsonMode) {
      requestOptions.response_format = { type: 'json_object' } // FIXED: enforce JSON output when expected
    }

    const request = groqClient.chat.completions.create(requestOptions)

    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('Groq timeout'))
      }, timeoutMs)
    })

    const response = await Promise.race([request, timeoutPromise])
    return normalizeGroqContent(response?.choices?.[0]?.message?.content)
  } catch (error) {
    // FIXED: log model, endpoint context, and HTTP status on every error
    const statusCode = error?.status || error?.statusCode || 'unknown'
    console.error(`[groqEvaluation] model=${model} status=${statusCode} message=${error.message}`)
    throw error
  }
}

// FIXED: 429 gets dedicated longer backoff; unreachable/timeout errors map to AI_UNAVAILABLE 503
async function callGroqWithRetry(payload, maxRetries) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await callGroq(payload)
    } catch (error) {
      lastError = error
      const is429 = error?.status === 429 || error?.statusCode === 429
      const base = is429 ? 1000 : 300 // FIXED: longer base for rate-limit backoff
      const backoff = base * Math.pow(2, attempt - 1)
      await sleep(backoff)
    }
  }

  // FIXED: convert connectivity/timeout/5xx errors into structured 503 response
  const isUnavailable =
    lastError?.message === 'Groq timeout' ||
    lastError?.code === 'ECONNREFUSED' ||
    lastError?.status === 429 ||
    (lastError?.status !== undefined && lastError.status >= 500)

  if (isUnavailable) {
    throw AppError.serviceUnavailable('AI service temporarily unavailable', 'AI_UNAVAILABLE')
  }

  throw lastError
}

function parseJsonPayload(payload, fallbackMessage) {
  try {
    return JSON.parse(payload)
  } catch (_error) {
    throw AppError.serviceUnavailable(fallbackMessage || 'No se pudo interpretar respuesta del modelo.', 'AI_PARSE_ERROR')
  }
}

function looksHardcoded({ userCode, output }) {
  const normalizedOutput = String(output || '').trim()
  if (!normalizedOutput) {
    return false
  }

  const normalizedCode = String(userCode || '').toLowerCase()
  if (!normalizedCode) {
    return false
  }

  const hasOutputLiteral = normalizedCode.includes(`'${normalizedOutput.toLowerCase()}'`)
    || normalizedCode.includes(`"${normalizedOutput.toLowerCase()}"`)

  const usesInput = /\binput\b|prompt\(|scanner|cin|readline|sys\.stdin/.test(normalizedCode)
  const shortCode = normalizedCode.length < 40

  return (hasOutputLiteral && !usesInput) || (shortCode && hasOutputLiteral)
}

class GroqEvaluationService {
  constructor({ pool }) {
    this.pool = pool
  }

  async evaluateUserResponse(userCode, exerciseId, judge0Result) {
    try {
      const judge0StatusId = Number(judge0Result?.status?.id || judge0Result?.status_id || 0)
      const stdout = String(judge0Result?.stdout || judge0Result?.output || '')
      const passed = judge0StatusId === 3

      let evaluation = {
        passed,
        feedback: passed ? 'Buen trabajo. Respuesta aceptada.' : 'La solucion no paso las pruebas.',
        conceptUnderstood: passed,
        score: passed ? 80 : 40,
      }

      try {
        const aiEvaluation = await this.#evaluateWithGroq(userCode, judge0Result)
        evaluation = {
          ...evaluation,
          ...aiEvaluation,
          passed,
        }
      } catch (_error) {
        // Fallback to heuristic.
      }

      const hardcoded = passed && looksHardcoded({ userCode, output: stdout })
      if (hardcoded) {
        evaluation = {
          ...evaluation,
          conceptUnderstood: false,
          feedback: `${evaluation.feedback} Se detecto posible hardcodeo del resultado.`,
        }
      }

      const flaggedForReview = passed && evaluation.conceptUnderstood === false

      await this.#saveEvaluation({
        userId: judge0Result?.userId,
        exerciseId,
        judge0StatusId,
        judge0Output: stdout,
        evaluation,
        confidenceScore: evaluation.confidenceScore || 0,
        conceptUnderstood: evaluation.conceptUnderstood,
        flaggedForReview,
      })

      return {
        passed: evaluation.passed,
        feedback: evaluation.feedback,
        conceptUnderstood: evaluation.conceptUnderstood,
        score: evaluation.score,
      }
    } catch (error) {
      throw error
    }
  }

  async evaluateExplanation(studentAnswer, expectedConcepts) {
    try {
      const concepts = Array.isArray(expectedConcepts) ? expectedConcepts : []

      const messages = [
        {
          role: 'system',
          content: 'Evalua explicaciones de estudiantes. Responde solo JSON valido.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            studentAnswer,
            expectedConcepts: concepts,
            instruction:
              'Devuelve { score: 0-100, missingConcepts: string[], feedback: string }.',
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model: env.ai.modelEvaluation,
          messages,
          temperature: 0.3,
          maxTokens: 400,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo evaluar la explicacion.')
      return {
        score: Number(parsed.score || 0),
        missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts.map(String) : [],
        feedback: String(parsed.feedback || ''),
      }
    } catch (error) {
      throw error
    }
  }

  async generatePersonalizedFeedback(userId, recentMistakes) {
    try {
      const mistakes = Array.isArray(recentMistakes) ? recentMistakes : []

      if (!mistakes.length) {
        return {
          message: 'Buen trabajo. Sigue practicando para mantener el ritmo.',
          suggestedTopics: [],
        }
      }

      const messages = [
        {
          role: 'system',
          content: 'Genera feedback personalizado breve. Responde solo JSON valido.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            userId,
            mistakes,
            instruction: 'Devuelve { message: string, suggestedTopics: string[] }.',
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model: env.ai.modelEvaluation,
          messages,
          temperature: 0.4,
          maxTokens: 300,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo generar feedback personalizado.')
      return {
        message: String(parsed.message || ''),
        suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics.map(String) : [],
      }
    } catch (error) {
      throw error
    }
  }

  async #evaluateWithGroq(userCode, judge0Result) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Evalua comprension conceptual. Responde solo JSON valido.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            userCode,
            judge0Result,
            instruction:
              'Devuelve { score: 0-100, feedback: string, conceptUnderstood: boolean, confidenceScore: 0-1 }.',
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model: env.ai.modelEvaluation,
          messages,
          temperature: 0.3,
          maxTokens: 400,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo evaluar respuesta.')
      return {
        score: Number(parsed.score || 0),
        feedback: String(parsed.feedback || ''),
        conceptUnderstood: Boolean(parsed.conceptUnderstood),
        confidenceScore: Number(parsed.confidenceScore || 0),
      }
    } catch (error) {
      throw error
    }
  }

  async #saveEvaluation({
    userId,
    exerciseId,
    judge0StatusId,
    judge0Output,
    evaluation,
    confidenceScore,
    conceptUnderstood,
    flaggedForReview,
  }) {
    try {
      if (!userId || !exerciseId) {
        return
      }

      await this.pool.query(
        `INSERT INTO ai_evaluations
          (user_id, exercise_id, ai_model_used, judge0_status_id, judge0_output, evaluation_result, confidence_score, concept_understood, flagged_for_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          exerciseId,
          env.ai.modelEvaluation,
          judge0StatusId,
          judge0Output,
          JSON.stringify(evaluation),
          Number(confidenceScore || 0),
          conceptUnderstood ? 1 : 0,
          flaggedForReview ? 1 : 0,
        ]
      )
    } catch (error) {
      throw error
    }
  }
}

module.exports = {
  GroqEvaluationService,
}
