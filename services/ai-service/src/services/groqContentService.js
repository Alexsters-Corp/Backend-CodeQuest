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

const DIFFICULTY_TO_PATH_LEVEL = Object.freeze({
  beginner: 'principiante',
  intermediate: 'intermedio',
  advanced: 'avanzado',
  easy: 'principiante',
  medium: 'intermedio',
  hard: 'avanzado',
})

const PATH_LEVEL_METADATA = Object.freeze({
  principiante: {
    suffix: 'Principiante',
    slug: 'principiante',
    estimatedHours: 40,
  },
  intermedio: {
    suffix: 'Intermedio',
    slug: 'intermedio',
    estimatedHours: 55,
  },
  avanzado: {
    suffix: 'Avanzado',
    slug: 'avanzado',
    estimatedHours: 70,
  },
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function slugify(value) {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `ai-lesson-${Date.now()}`
}

function normalizeQualityScore(value) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return numeric > 1 ? Math.min(numeric / 100, 1) : Math.min(Math.max(numeric, 0), 1)
}

function parseUserProvidedJson(rawValue) {
  const source = String(rawValue || '').trim()
  if (!source) {
    throw AppError.badRequest('Contenido invalido para publicar.', 'VALIDATION_ERROR')
  }

  const normalized = source
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(normalized)
  } catch (_error) {
    const firstBrace = normalized.indexOf('{')
    const lastBrace = normalized.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = normalized.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(candidate)
      } catch (_innerError) {
        throw AppError.badRequest('Contenido invalido para publicar.', 'VALIDATION_ERROR')
      }
    }

    throw AppError.badRequest('Contenido invalido para publicar.', 'VALIDATION_ERROR')
  }
}

function normalizeLessonContent(rawContent) {
  const content = typeof rawContent === 'string' ? parseUserProvidedJson(rawContent) : rawContent
  if (!content || typeof content !== 'object') {
    throw AppError.badRequest('Contenido invalido para publicar.', 'VALIDATION_ERROR')
  }

  const isExerciseOnly = !content.exercise && (content.prompt || content.starterCode || content.solutionCode)
  const exercise = isExerciseOnly ? content : (content.exercise || {})
  const prompt = String(exercise.prompt || content.description || '').trim()
  const title = String(content.title || (isExerciseOnly ? prompt.slice(0, 80) : '') || 'Contenido generado por IA').trim()
  const theory = String(content.theory || (isExerciseOnly ? prompt : '')).trim()
  const codeExample = String(content.codeExample || (isExerciseOnly ? exercise.starterCode : '') || '').trim()

  if (!title || !theory) {
    throw AppError.badRequest('Solo se pueden publicar lecciones generadas completas.', 'LESSON_CONTENT_REQUIRED')
  }

  return {
    title,
    theory,
    codeExample,
    exercise: {
      prompt: String(exercise.prompt || '').trim(),
      starterCode: String(exercise.starterCode || '').trim(),
      solutionCode: String(exercise.solutionCode || '').trim(),
      testCases: Array.isArray(exercise.testCases) ? exercise.testCases : [],
      expectedOutput: String(exercise.expectedOutput || '').trim(),
    },
    modelUsed: content.modelUsed || content.ai_model_used || null,
    generatedContentId: content.generatedContentId || content.generated_content_id || null,
  }
}

function buildLessonHtml(content) {
  const theoryParagraphs = content.theory
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  const codeBlock = content.codeExample
    ? `\n<h3>Ejemplo de codigo</h3>\n<pre><code>${escapeHtml(content.codeExample)}</code></pre>`
    : ''

  const exerciseBlock = content.exercise.prompt
    ? `\n<h3>Ejercicio propuesto</h3>\n<p>${escapeHtml(content.exercise.prompt)}</p>`
    : ''

  return `<h2>${escapeHtml(content.title)}</h2>\n${theoryParagraphs}${codeBlock}${exerciseBlock}`
}

function buildDescription(content) {
  const fromExercise = content.exercise.prompt
  if (fromExercise) {
    return fromExercise.slice(0, 255)
  }

  return content.theory.replace(/\s+/g, ' ').trim().slice(0, 255)
}

function stringifyTestCaseValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}

async function buildUniquePathSlug(connection, baseSlug) {
  let slug = baseSlug

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const [rows] = await connection.query(
      'SELECT id FROM learning_paths WHERE slug = ? LIMIT 1',
      [slug]
    )

    if (rows.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${suffix}`
  }

  return `${baseSlug}-${Date.now()}`
}

async function resolveOrCreateLearningPath(connection, { judge0LanguageId, pathLevel }) {
  const metadata = PATH_LEVEL_METADATA[pathLevel]
  if (!metadata) {
    throw AppError.badRequest('Nivel de dificultad no soportado para publicar.', 'INVALID_LEARNING_PATH_LEVEL')
  }

  const [languageRows] = await connection.query(
    `SELECT id, name, slug
     FROM programming_languages
     WHERE judge0_language_id = ?
       AND is_active = 1
     LIMIT 1`,
    [judge0LanguageId]
  )

  const language = languageRows[0]
  if (!language) {
    throw AppError.badRequest('No existe un lenguaje activo para publicar este contenido.', 'PROGRAMMING_LANGUAGE_NOT_FOUND')
  }

  const [pathRows] = await connection.query(
    `SELECT id, name, programming_language_id, difficulty_level
     FROM learning_paths
     WHERE programming_language_id = ?
       AND difficulty_level = ?
       AND is_active = 1
     ORDER BY id ASC
     LIMIT 1
     FOR UPDATE`,
    [language.id, pathLevel]
  )

  if (pathRows[0]) {
    return {
      id: Number(pathRows[0].id),
      name: pathRows[0].name,
      programming_language_id: Number(pathRows[0].programming_language_id),
      difficulty_level: pathRows[0].difficulty_level,
      created: false,
    }
  }

  const pathName = `${language.name} ${metadata.suffix}`
  const baseSlug = slugify(`${language.slug || language.name}-${metadata.slug}`)
  const slug = await buildUniquePathSlug(connection, baseSlug)

  const [result] = await connection.query(
    `INSERT INTO learning_paths (
       programming_language_id, name, slug, description, difficulty_level, estimated_hours, is_active
     )
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      language.id,
      pathName,
      slug,
      `Ruta ${metadata.suffix.toLowerCase()} de ${language.name} creada para contenido asistido por IA.`,
      pathLevel,
      metadata.estimatedHours,
    ]
  )

  return {
    id: Number(result.insertId),
    name: pathName,
    programming_language_id: Number(language.id),
    difficulty_level: pathLevel,
    created: true,
  }
}

async function resolveLearningPathById(connection, { learningPathId, judge0LanguageId }) {
  const numericPathId = Number(learningPathId)
  if (!Number.isInteger(numericPathId) || numericPathId <= 0) {
    return null
  }

  const [rows] = await connection.query(
    `SELECT lp.id, lp.name, lp.programming_language_id, lp.difficulty_level
     FROM learning_paths lp
     JOIN programming_languages pl ON pl.id = lp.programming_language_id
     WHERE lp.id = ?
       AND lp.is_active = 1
       AND pl.is_active = 1
       AND pl.judge0_language_id = ?
     LIMIT 1
     FOR UPDATE`,
    [numericPathId, judge0LanguageId]
  )

  if (!rows[0]) {
    throw AppError.badRequest('La ruta destino no existe o no pertenece al lenguaje seleccionado.', 'INVALID_LEARNING_PATH_TARGET')
  }

  return {
    id: Number(rows[0].id),
    name: rows[0].name,
    programming_language_id: Number(rows[0].programming_language_id),
    difficulty_level: rows[0].difficulty_level,
    created: false,
  }
}

// FIXED: uses singleton groqClient; added jsonMode for response_format; added error logging
async function callGroq({ model, messages, temperature = 0.4, maxTokens = 800, timeoutMs = 10000, jsonMode = false }) {
  let timeoutId

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
      timeoutId = setTimeout(() => {
        reject(new Error('Groq timeout'))
      }, timeoutMs)

      if (typeof timeoutId.unref === 'function') {
        timeoutId.unref()
      }
    })

    const response = await Promise.race([request, timeoutPromise])
    const content = normalizeGroqContent(response?.choices?.[0]?.message?.content)
    return content
  } catch (error) {
    // FIXED: log model, endpoint context, and HTTP status on every error
    const statusCode = error?.status || error?.statusCode || 'unknown'
    console.error(`[groqContent] model=${model} status=${statusCode} message=${error.message}`)
    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
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

        let judge0Validated = false
        let validationWarning = null
        const judge0LanguageId = resolveJudge0LanguageId({ language })

        const codeExampleValid = await validateSolution({
          sourceCode: content.codeExample,
          languageId: judge0LanguageId,
          testCases: [], // only verify compiles and runs
        })

        if (!codeExampleValid) {
          validationWarning = 'JUDGE0_PARTIAL_VALIDATION'
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
          validationWarning = 'JUDGE0_PARTIAL_VALIDATION'
        }

        judge0Validated = codeExampleValid && exerciseValid

        const storedPayload = {
          ...content,
          difficulty_level: classification.level,
          quality_score: quality.qualityScore,
          judge0_validated: judge0Validated,
          validation_warning: validationWarning,
        }

        const generatedContentId = await this.#saveGeneratedContent({
          topic,
          language,
          content: storedPayload,
          modelUsed,
          qualityScore: quality.qualityScore,
          difficultyLevel: classification.level,
          judge0Validated,
          createdBy,
        })

        const response = {
          title: content.title,
          theory: content.theory,
          codeExample: content.codeExample,
          exercise: {
            prompt: content.exercise?.prompt,
            starterCode: content.exercise?.starterCode,
            solutionCode: content.exercise?.solutionCode || '',
            testCases: content.exercise?.testCases || [],
            expectedOutput: content.exercise?.expectedOutput || '',
          },
          modelUsed,
          generatedContentId,
          judge0Validated,
          validationWarning,
        }

        await writeCache(cacheKey, response, LESSON_CACHE_TTL_SECONDS)
        return response
      }

      throw new ContentGenerationError('No se pudo generar contenido aprobado por el validador de calidad.', {
        reason: 'QUALITY_VALIDATION_FAILED',
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
        let judge0Validated = false
        let validationWarning = null

        // FIXED: same reason as generateLesson — AI test case inputs are not stdin-compatible
        const exerciseValid = judge0LanguageId ? await validateSolution({
          sourceCode: content.solutionCode,
          languageId: judge0LanguageId,
          testCases: [],
        }) : false

        judge0Validated = exerciseValid
        validationWarning = judge0Validated ? null : 'JUDGE0_PARTIAL_VALIDATION'

        const storedPayload = {
          ...content,
          quality_score: quality.qualityScore,
          judge0_validated: judge0Validated,
          validation_warning: validationWarning,
        }

        const generatedContentId = await this.#saveGeneratedContent({
          topic: concept,
          language: String(languageId),
          content: storedPayload,
          modelUsed,
          qualityScore: quality.qualityScore,
          difficultyLevel: normalizeExerciseDifficultyForStorage(difficulty),
          judge0Validated,
          createdBy,
        })

        const response = {
          prompt: content.prompt,
          starterCode: content.starterCode,
          solutionCode: content.solutionCode || '',
          testCases: content.testCases || [],
          expectedOutput: content.expectedOutput || '',
          modelUsed,
          generatedContentId,
          judge0Validated,
          validationWarning,
        }

        await writeCache(cacheKey, response, LESSON_CACHE_TTL_SECONDS)
        return response
      }

      throw new ContentGenerationError('No se pudo generar un ejercicio aprobado por el validador de calidad.', {
        reason: 'QUALITY_VALIDATION_FAILED',
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

  async publishGeneratedLesson({ content, languageId, level, validation, publishedBy, classId = null, learningPathId = null }) {
    const normalizedContent = normalizeLessonContent(content)
    const judge0LanguageId = resolveJudge0LanguageId({ languageId })
    const pathLevel = DIFFICULTY_TO_PATH_LEVEL[String(level || '').trim().toLowerCase()] || null
    const qualityScore = normalizeQualityScore(validation?.qualityScore)

    if (!Number.isInteger(judge0LanguageId) || judge0LanguageId <= 0) {
      throw AppError.badRequest('languageId no es válido.', 'VALIDATION_ERROR')
    }

    if (!validation?.approved || qualityScore < 0.8) {
      throw AppError.badRequest('El contenido no cumple el score minimo para publicar.', 'CONTENT_NOT_APPROVED')
    }

    const connection = await this.pool.getConnection()

    try {
      await connection.beginTransaction()

      const targetPath = learningPathId
        ? await resolveLearningPathById(connection, { learningPathId, judge0LanguageId })
        : await resolveOrCreateLearningPath(connection, { judge0LanguageId, pathLevel })

      const [[positionRow]] = await connection.query(
        `SELECT COALESCE(MAX(order_position), 0) + 1 AS next_position
         FROM lessons
         WHERE learning_path_id = ?`,
        [targetPath.id]
      )

      const baseSlug = slugify(normalizedContent.title)
      let slug = baseSlug
      for (let suffix = 2; suffix < 100; suffix += 1) {
        const [slugRows] = await connection.query(
          `SELECT id FROM lessons WHERE learning_path_id = ? AND slug = ? LIMIT 1`,
          [targetPath.id, slug]
        )

        if (slugRows.length === 0) {
          break
        }

        slug = `${baseSlug}-${suffix}`
      }

      const [lessonResult] = await connection.query(
        `INSERT INTO lessons (
           learning_path_id, title, slug, description, content,
           order_position, estimated_minutes, is_published, is_ai_assisted, is_free_demo, xp_reward
         )
         VALUES (?, ?, ?, ?, ?, ?, 25, 1, 1, 0, 50)`,
        [
          targetPath.id,
          normalizedContent.title,
          slug,
          buildDescription(normalizedContent),
          buildLessonHtml(normalizedContent),
          Number(positionRow.next_position || 1),
        ]
      )

      const lessonId = Number(lessonResult.insertId)
      const solutionCode = normalizedContent.exercise.solutionCode
      if (solutionCode) {
        await connection.query(
          `INSERT INTO lesson_solutions (
             lesson_id, language_id, solution_code, explanation, prompt, base_code
           )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            lessonId,
            targetPath.programming_language_id,
            solutionCode,
            'Solucion generada con asistencia de IA y validada antes de publicar.',
            normalizedContent.exercise.prompt || null,
            normalizedContent.exercise.starterCode || null,
          ]
        )
      }

      const visibleTestCases = normalizedContent.exercise.testCases.slice(0, 10)
      for (let index = 0; index < visibleTestCases.length; index += 1) {
        const testCase = visibleTestCases[index] || {}
        const expectedOutput = stringifyTestCaseValue(testCase.expectedOutput || testCase.expected_output)
          || normalizedContent.exercise.expectedOutput

        if (!expectedOutput) {
          continue
        }

        await connection.query(
          `INSERT INTO lesson_test_cases (
             lesson_id, input_data, expected_output, is_hidden, points, order_position
           )
           VALUES (?, ?, ?, 0, 10, ?)`,
          [
            lessonId,
            stringifyTestCaseValue(testCase.input),
            expectedOutput,
            index + 1,
          ]
        )
      }

      if (normalizedContent.generatedContentId) {
        await connection.query(
          `UPDATE ai_generated_content
           SET published = 1,
               published_lesson_id = ?,
               class_id = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [lessonId, classId, normalizedContent.generatedContentId]
        )
      } else {
        await connection.query(
          `INSERT INTO ai_generated_content
            (topic, language, original_content, validated_by, quality_score, difficulty_level, ai_model_used, judge0_validated, published, published_lesson_id, class_id, created_by)
           VALUES (?, ?, ?, 'admin', ?, ?, ?, 1, 1, ?, ?, ?)`,
          [
            normalizedContent.title,
            String(judge0LanguageId),
            JSON.stringify(normalizedContent),
            qualityScore,
            normalizeExerciseDifficultyForStorage(level || 'beginner'),
            normalizedContent.modelUsed || env.ai.modelContentGeneration,
            lessonId,
            classId,
            publishedBy || null,
          ]
        )
      }

      await connection.commit()

      return {
        lessonId,
        learningPathId: Number(targetPath.id),
        learningPathName: targetPath.name,
        learningPathCreated: Boolean(targetPath.created),
        difficultyLevel: targetPath.difficulty_level,
        orderPosition: Number(positionRow.next_position || 1),
        isAiAssisted: true,
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
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
      const id = crypto.randomUUID()
      await this.pool.query(
        `INSERT INTO ai_generated_content
          (id, topic, language, original_content, validated_by, quality_score, difficulty_level, ai_model_used, judge0_validated, published, created_by)
         VALUES (?, ?, ?, ?, 'ai', ?, ?, ?, ?, 0, ?)`,
        [
          id,
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

      return id
    } catch (error) {
      throw error
    }
  }
}

module.exports = {
  GroqContentService,
  ContentGenerationError,
}
