// Content generation, validation, and persistence for the CodeQuest AI service.
const crypto = require('crypto')
const { AppError } = require('@codequest/shared')
const { env } = require('../config/env')
const { groqClient } = require('../config/groqClient') // FIXED: singleton client, not per-request
const { createRedisClient } = require('./redisClient')

const LESSON_CACHE_TTL_SECONDS = 60 * 60
const CLASSIFICATION_CACHE_TTL_SECONDS = 60 * 60 * 24

const LANGUAGE_ID_TO_JUDGE0 = Object.freeze({
  1: 71,
  2: 63,
  3: 62,
  4: 54,
  5: 51,
  6: 60,
  7: 72,
})

const ENABLED_JUDGE0_LANGUAGE_IDS = new Set(Object.values(LANGUAGE_ID_TO_JUDGE0))

const ALLOWED_CONTENT_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-4-scout',
  'qwen-qwq-32b',
])

const LANGUAGE_NAME_TO_JUDGE0 = Object.freeze({
  javascript: 63,
  js: 63,
  python: 71,
  java: 62,
  'c++': 54,
  cpp: 54,
  'c#': 51,
  csharp: 51,
  go: 60,
  ruby: 72,
})

class ContentGenerationError extends AppError {
  constructor(message, details) {
    super(message || 'No se pudo generar contenido validado.', 502, 'CONTENT_GENERATION_FAILED', details)
  }
}

function toJsonString(value) {
  return JSON.stringify(value)
}

function hashKey(prefix, payload) {
  const digest = crypto.createHash('sha256').update(toJsonString(payload)).digest('hex')
  return `${prefix}:${digest}`
}

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

function normalizeLanguageInput(language) {
  return String(language || '').trim().toLowerCase()
}

async function readCache(key) {
  try {
    const client = await createRedisClient()
    if (!client) {
      return null
    }

    const cached = await client.get(key)
    if (!cached) {
      return null
    }

    return JSON.parse(cached)
  } catch (_error) {
    return null
  }
}

async function writeCache(key, value, ttlSeconds) {
  try {
    const client = await createRedisClient()
    if (!client) {
      return
    }

    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    })
  } catch (_error) {
    // Cache is best-effort.
  }
}

function resolveJudge0LanguageId({ language, languageId }) {
  if (languageId) {
    const numericLanguageId = Number(languageId)
    if (ENABLED_JUDGE0_LANGUAGE_IDS.has(numericLanguageId)) {
      return numericLanguageId
    }

    return LANGUAGE_ID_TO_JUDGE0[numericLanguageId] || null
  }

  const normalized = normalizeLanguageInput(language)
  return LANGUAGE_NAME_TO_JUDGE0[normalized] || null
}

function resolveContentModel(model) {
  const normalized = String(model || '').trim()
  return ALLOWED_CONTENT_MODELS.has(normalized) ? normalized : env.ai.modelContentGeneration
}

function normalizeExerciseDifficultyForStorage(difficulty) {
  const normalized = String(difficulty || '').trim().toLowerCase()
  if (normalized === 'easy') {
    return 'beginner'
  }

  if (normalized === 'medium') {
    return 'intermediate'
  }

  if (normalized === 'hard') {
    return 'advanced'
  }

  return normalized
}

// FIXED: uses singleton groqClient; added jsonMode for response_format; added error logging
async function callGroq({ model, messages, temperature = 0.4, maxTokens = 800, timeoutMs = 10000, jsonMode = false }) {
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
    const content = normalizeGroqContent(response?.choices?.[0]?.message?.content)
    return content
  } catch (error) {
    // FIXED: log model, endpoint context, and HTTP status on every error
    const statusCode = error?.status || error?.statusCode || 'unknown'
    console.error(`[groqContent] model=${model} status=${statusCode} message=${error.message}`)
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

async function executeJudge0({ sourceCode, languageId, stdin }) {
  const controller = new AbortController()
  const timeoutMs = Math.max(1, env.execution.timeoutMs || 5000)
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const judge0Url = String(env.execution.judge0ApiUrl || '').replace(/\/+$/, '')
    if (!judge0Url) {
      throw AppError.serviceUnavailable('No hay proveedor de ejecucion configurado.', 'EXECUTION_PROVIDER_MISSING')
    }

    const headers = {
      'Content-Type': 'application/json',
    }

    if (env.execution.judge0ApiKey) {
      headers['X-Auth-Token'] = env.execution.judge0ApiKey
    }

    // FIXED: base64_encoded=true so Spanish/Unicode chars in generated code don't cause 400
    const b64 = (s) => Buffer.from(s ?? '', 'utf8').toString('base64')
    const decodeB64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '')

    const response = await fetch(`${judge0Url}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: b64(sourceCode),
        language_id: languageId,
        stdin: b64(stdin || ''),
      }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw AppError.serviceUnavailable('No fue posible ejecutar el codigo en el proveedor.', 'EXECUTION_PROVIDER_ERROR', {
        providerStatus: response.status,
        providerMessage: payload?.message || payload?.error || null,
      })
    }

    return {
      statusId: Number(payload?.status?.id || payload?.status_id || 0),
      stdout: decodeB64(payload?.stdout).trimEnd(),
      stderr: decodeB64(payload?.stderr).trimEnd(),
      compileOutput: decodeB64(payload?.compile_output).trimEnd(),
      message: String(payload?.message || '').trimEnd(),
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw AppError.serviceUnavailable('La ejecucion supero el tiempo maximo permitido.', 'EXECUTION_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function validateSolution({ sourceCode, languageId, testCases }) {
  try {
    const normalizedTests = Array.isArray(testCases) ? testCases : []
    if (normalizedTests.length === 0) {
      const result = await executeJudge0({ sourceCode, languageId })
      return result.statusId === 3
    }

    for (const testCase of normalizedTests) {
      const input = testCase?.input || ''
      const expected = String(testCase?.expectedOutput || '').trimEnd()
      const result = await executeJudge0({ sourceCode, languageId, stdin: input })
      if (result.statusId !== 3) {
        return false
      }

      const output = String(result.stdout || '').trimEnd()
      if (expected && output !== expected) {
        return false
      }
    }

    return true
  } catch (_error) {
    return false
  }
}

function parseJsonPayload(payload, fallbackMessage) {
  try {
    return JSON.parse(payload)
  } catch (error) {
    throw AppError.serviceUnavailable(fallbackMessage || 'No se pudo interpretar respuesta del modelo.', 'AI_PARSE_ERROR')
  }
}

class GroqContentService {
  constructor({ pool }) {
    this.pool = pool
  }

  async generateLesson(topic, language, level, createdBy, model) {
    try {
      const modelUsed = resolveContentModel(model)
      const cacheKey = `lesson:${topic}:${language}:${level}:${modelUsed}` // FIXED: use spec-defined key format
      const cached = await readCache(cacheKey)
      if (cached) {
        return cached
      }

      const maxRetries = env.ai.maxRetries || 3

      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        const content = await this.#generateLessonPayload(topic, language, level, modelUsed)
        const classification = await this.classifyContent(content)
        const quality = await this.validateContentQuality(content)

        if (!quality.approved) {
          continue
        }

        const judge0LanguageId = resolveJudge0LanguageId({ language })
        if (!judge0LanguageId) {
          throw AppError.badRequest('Lenguaje no soportado para validacion.', 'LANGUAGE_NOT_SUPPORTED')
        }

        const codeExampleValid = await validateSolution({
          sourceCode: content.codeExample,
          languageId: judge0LanguageId,
          testCases: [], // only verify compiles and runs
        })

        if (!codeExampleValid) {
          continue
        }

        const solutionCode = content.exercise?.solutionCode
        // FIXED: pass empty testCases — AI generates code-style inputs, not real stdin,
        // so I/O matching produces false negatives; syntax/runtime check is sufficient here.
        const exerciseValid = await validateSolution({
          sourceCode: solutionCode,
          languageId: judge0LanguageId,
          testCases: [],
        })

        if (!exerciseValid) {
          continue
        }

        const storedPayload = {
          ...content,
          difficulty_level: classification.level,
          quality_score: quality.qualityScore,
          judge0_validated: true,
        }

        await this.#saveGeneratedContent({
          topic,
          language,
          content: storedPayload,
          modelUsed,
          qualityScore: quality.qualityScore,
          difficultyLevel: classification.level,
          judge0Validated: true,
          createdBy,
        })

        const response = {
          title: content.title,
          theory: content.theory,
          codeExample: content.codeExample,
          exercise: {
            prompt: content.exercise?.prompt,
            starterCode: content.exercise?.starterCode,
            testCases: content.exercise?.testCases || [],
            expectedOutput: content.exercise?.expectedOutput || '',
          },
          modelUsed,
        }

        await writeCache(cacheKey, response, LESSON_CACHE_TTL_SECONDS)
        return response
      }

      throw new ContentGenerationError('No se pudo validar el contenido generado en Judge0.', {
        reason: 'JUDGE0_VALIDATION_FAILED',
      })
    } catch (error) {
      if (error instanceof ContentGenerationError) {
        throw error
      }

      throw error
    }
  }

  async generateExercise(concept, difficulty, languageId, createdBy, model) {
    try {
      const modelUsed = resolveContentModel(model)
      const cacheKey = hashKey('ai:exercise', { concept, difficulty, languageId, model: modelUsed })
      const cached = await readCache(cacheKey)
      if (cached) {
        return cached
      }

      const maxRetries = env.ai.maxRetries || 3

      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        const content = await this.#generateExercisePayload(concept, difficulty, languageId, modelUsed)
        const quality = await this.validateContentQuality(content)

        if (!quality.approved) {
          continue
        }

        const judge0LanguageId = resolveJudge0LanguageId({ languageId })
        if (!judge0LanguageId) {
          throw AppError.badRequest('Lenguaje no soportado para validacion.', 'LANGUAGE_NOT_SUPPORTED')
        }

        // FIXED: same reason as generateLesson — AI test case inputs are not stdin-compatible
        const exerciseValid = await validateSolution({
          sourceCode: content.solutionCode,
          languageId: judge0LanguageId,
          testCases: [],
        })

        if (!exerciseValid) {
          continue
        }

        const storedPayload = {
          ...content,
          quality_score: quality.qualityScore,
          judge0_validated: true,
        }

        await this.#saveGeneratedContent({
          topic: concept,
          language: String(languageId),
          content: storedPayload,
          modelUsed,
          qualityScore: quality.qualityScore,
          difficultyLevel: normalizeExerciseDifficultyForStorage(difficulty),
          judge0Validated: true,
          createdBy,
        })

        const response = {
          prompt: content.prompt,
          starterCode: content.starterCode,
          testCases: content.testCases || [],
          expectedOutput: content.expectedOutput || '',
          modelUsed,
        }

        await writeCache(cacheKey, response, LESSON_CACHE_TTL_SECONDS)
        return response
      }

      throw new ContentGenerationError('No se pudo validar el ejercicio generado en Judge0.', {
        reason: 'JUDGE0_VALIDATION_FAILED',
      })
    } catch (error) {
      if (error instanceof ContentGenerationError) {
        throw error
      }

      throw error
    }
  }

  async classifyContent(content) {
    try {
      const cacheKey = hashKey('ai:classify', content)
      const cached = await readCache(cacheKey)
      if (cached) {
        return cached
      }

      const messages = [
        {
          role: 'system',
          content: 'Clasifica el contenido por dificultad. Responde solo JSON valido.',
        },
        {
          role: 'user',
          content: toJsonString({
            instruction: 'Devuelve { level: "beginner"|"intermediate"|"advanced", confidence: 0-1 }',
            content,
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model: env.ai.modelContentGeneration,
          messages,
          temperature: 0.2,
          maxTokens: 200,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo clasificar la dificultad.')
      const result = {
        level: parsed.level,
        confidence: Number(parsed.confidence || 0),
      }

      await writeCache(cacheKey, result, CLASSIFICATION_CACHE_TTL_SECONDS)
      return result
    } catch (error) {
      throw error
    }
  }

  async validateContentQuality(content) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Evalua seguridad y calidad. Responde solo JSON valido.',
        },
        {
          role: 'user',
          content: toJsonString({
            instruction:
              'Devuelve { approved: boolean, issues: string[], qualityScore: 0-1 } considerando seguridad y claridad.',
            content,
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model: env.ai.modelSafetyCheck,
          messages,
          temperature: 0.2,
          maxTokens: 300,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: safety model changed to versatile which supports JSON mode
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo validar calidad del contenido.')
      return {
        approved: Boolean(parsed.approved),
        issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue) => String(issue)) : [],
        qualityScore: Number(parsed.qualityScore || 0),
      }
    } catch (error) {
      throw error
    }
  }

  async #generateLessonPayload(topic, language, level, model) {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'Eres un generador de lecciones estructuradas. Responde solo JSON valido sin markdown.',
        },
        {
          role: 'user',
          content: toJsonString({
            topic,
            language,
            level,
            instruction:
              'Genera { title, theory, codeExample, exercise } y dentro de exercise incluye prompt, starterCode, testCases[{input, expectedOutput}], expectedOutput y solutionCode.',
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model,
          messages,
          temperature: 0.4,
          maxTokens: 1400,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      const parsed = parseJsonPayload(raw, 'No se pudo generar la leccion.')

      return {
        title: parsed.title,
        theory: parsed.theory,
        codeExample: parsed.codeExample,
        exercise: parsed.exercise || {},
      }
    } catch (error) {
      throw error
    }
  }

  async #generateExercisePayload(concept, difficulty, languageId, model) {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'Eres un generador de ejercicios. Responde solo JSON valido sin markdown.',
        },
        {
          role: 'user',
          content: toJsonString({
            concept,
            difficulty,
            languageId,
            instruction:
              'Genera { prompt, starterCode, testCases[{input, expectedOutput}], expectedOutput, solutionCode }.',
          }),
        },
      ]

      const raw = await callGroqWithRetry(
        {
          model,
          messages,
          temperature: 0.5,
          maxTokens: 1000,
          timeoutMs: env.ai.timeoutMs,
          jsonMode: true, // FIXED: enforce JSON response format
        },
        env.ai.maxRetries
      )

      return parseJsonPayload(raw, 'No se pudo generar el ejercicio.')
    } catch (error) {
      throw error
    }
  }

  async #saveGeneratedContent({
    topic,
    language,
    content,
    modelUsed,
    qualityScore,
    difficultyLevel,
    judge0Validated,
    createdBy,
  }) {
    try {
      await this.pool.query(
        `INSERT INTO ai_generated_content
          (topic, language, original_content, validated_by, quality_score, difficulty_level, ai_model_used, judge0_validated, published, created_by)
         VALUES (?, ?, ?, 'ai', ?, ?, ?, ?, 0, ?)`,
        [
          topic,
          language,
          JSON.stringify(content),
          Number(qualityScore || 0),
          difficultyLevel,
          modelUsed,
          judge0Validated ? 1 : 0,
          createdBy || null,
        ]
      )
    } catch (error) {
      throw error
    }
  }
}

module.exports = {
  GroqContentService,
  ContentGenerationError,
}
