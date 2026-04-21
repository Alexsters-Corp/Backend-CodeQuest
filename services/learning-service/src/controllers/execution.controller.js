const { AppError, asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { env } = require('../config/env')

const LANGUAGE_TO_JUDGE0 = Object.freeze({
  1: 71, // Python
  2: 63, // JavaScript (Node.js)
  3: 62, // Java
  4: 54, // C++
  5: 51, // C#
  6: 60, // Go
  7: 72, // Ruby
})

function sanitizeCode(rawCode, maxLength) {
  return String(rawCode || '')
    .replaceAll('\u0000', '')
    .slice(0, Math.max(1, maxLength || 16000))
}

function resolveJudge0LanguageId(languageId) {
  return LANGUAGE_TO_JUDGE0[languageId] || null
}

function normalizeExecutionPayload(payload) {
  const stdout = String(payload?.stdout || '').trimEnd()
  const stderr = String(payload?.stderr || '').trimEnd()
  const compileOutput = String(payload?.compile_output || '').trimEnd()
  const providerMessage = String(payload?.message || '').trimEnd()
  const statusId = Number(payload?.status?.id || payload?.status_id || 0)
  const statusDescription = String(payload?.status?.description || '').trim()

  let errors = [stderr, compileOutput, providerMessage]
    .filter(Boolean)
    .join('\n')

  if (!errors && statusId > 0 && statusId !== 3 && statusDescription) {
    errors = statusDescription
  }

  return {
    output: stdout,
    errors,
    executionTime: Number(payload?.time) || 0,
  }
}

const executeCode = asyncHandler(async (req, res) => {
  const sourceCode = sanitizeCode(req.body?.code, env.execution.maxCodeLength)
  if (!sourceCode.trim()) {
    throw AppError.badRequest('Debes enviar codigo para ejecutar.', 'CODE_REQUIRED')
  }

  const languageId = parsePositiveInt(req.body?.languageId, 'languageId')
  const judge0LanguageId = resolveJudge0LanguageId(languageId)

  if (!judge0LanguageId) {
    throw AppError.badRequest('El lenguaje solicitado no esta soportado para ejecucion.', 'LANGUAGE_NOT_SUPPORTED')
  }

  const judge0Url = String(env.execution.judge0ApiUrl || '').replace(/\/+$/, '')
  if (!judge0Url) {
    throw AppError.serviceUnavailable('No hay proveedor de ejecucion configurado.', 'EXECUTION_PROVIDER_MISSING')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1, env.execution.timeoutMs || 5000))

  try {
    const headers = {
      'Content-Type': 'application/json',
    }

    if (env.execution.judge0ApiKey) {
      headers['X-Auth-Token'] = env.execution.judge0ApiKey
    }

    const response = await fetch(`${judge0Url}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: judge0LanguageId,
      }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw AppError.serviceUnavailable(
        'No fue posible ejecutar el codigo en el proveedor.',
        'EXECUTION_PROVIDER_ERROR',
        {
          providerStatus: response.status,
          providerMessage: payload?.message || payload?.error || null,
        }
      )
    }

    return res.status(200).json(normalizeExecutionPayload(payload))
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw AppError.serviceUnavailable('La ejecucion supero el tiempo maximo permitido.', 'EXECUTION_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
})

module.exports = {
  executeCode,
}
