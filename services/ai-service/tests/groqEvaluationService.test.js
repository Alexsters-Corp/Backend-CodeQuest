const express = require('express')
const request = require('supertest')

describe('GroqEvaluationService', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.GROQ_API_KEY = 'test-key'
    process.env.AI_MODEL_EVALUATION = 'llama-3.3-70b'
    process.env.AI_MAX_RETRIES = '1'
    process.env.AI_TIMEOUT_MS = '1000'
    process.env.FEATURE_AI_CONTENT_ENABLED = 'true'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('flags hardcoded output when Judge0 accepted', async () => {
    const pool = { query: jest.fn().mockResolvedValue([[]]) }

    const create = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 90,
              feedback: 'Ok',
              conceptUnderstood: true,
              confidenceScore: 0.9,
            }),
          },
        },
      ],
    })

    jest.doMock('groq-sdk', () => ({
      Groq: jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create,
          },
        },
      })),
    }))

    const { GroqEvaluationService } = require('../src/services/groqEvaluationService')
    const service = new GroqEvaluationService({ pool })

    const result = await service.evaluateUserResponse(
      'console.log("42")',
      'exercise-1',
      { status: { id: 3 }, stdout: '42', userId: 'user-1' }
    )

    expect(result.passed).toBe(true)
    expect(result.conceptUnderstood).toBe(false)
    expect(pool.query).toHaveBeenCalled()
  })

  test('returns 403 for user role on admin AI route', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    jest.doMock('../src/middleware/require-gateway-user', () => {
      return (req, _res, next) => {
        req.user = { id: 'user-1', role: 'user' }
        next()
      }
    })

    jest.doMock('../src/services/container', () => ({
      groqContentService: {
        generateLesson: jest.fn(),
        generateExercise: jest.fn(),
        validateContentQuality: jest.fn(),
      },
      groqEvaluationService: {
        evaluateExplanation: jest.fn(),
        generatePersonalizedFeedback: jest.fn(),
      },
      pool: { query: jest.fn().mockResolvedValue([[]]) },
    }))

    const aiRoutes = require('../src/routes/ai.routes')
    const app = express()
    app.use(express.json())
    app.use('/api', aiRoutes)

    const response = await request(app)
      .post('/api/admin/generate-lesson')
      .send({ topic: 'Loops', language: 'javascript', level: 'beginner' })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('INSUFFICIENT_ROLE')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[RBAC] Acceso denegado: user=user-1 role=user path=POST /api/admin/generate-lesson'
    )
  })
})
