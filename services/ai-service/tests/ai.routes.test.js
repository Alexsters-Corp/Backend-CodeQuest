const express = require('express')
const request = require('supertest')

function createApp({ user, groqContentService, pool }) {
  jest.resetModules()
  process.env.FEATURE_AI_CONTENT_ENABLED = 'true'
  process.env.NODE_ENV = 'test'

  jest.doMock('../src/middleware/require-gateway-user', () => {
    return (req, _res, next) => {
      req.user = user
      next()
    }
  })

  jest.doMock('../src/middleware/rateLimiter', () => ({
    instructorAiLimit: (_req, _res, next) => next(),
    userAiLimit: (_req, _res, next) => next(),
  }))

  jest.doMock('../src/services/container', () => ({
    groqContentService,
    groqEvaluationService: {
      evaluateExplanation: jest.fn(),
      generatePersonalizedFeedback: jest.fn(),
      recommendLessons: jest.fn(),
    },
    pool,
  }))

  const aiRoutes = require('../src/routes/ai.routes')
  const app = express()
  app.use(express.json())
  app.use('/api', aiRoutes)
  return app
}

function buildPayload(overrides = {}) {
  return {
    content: {
      title: 'Arrays esenciales',
      theory: 'Los arrays permiten agrupar valores.',
      codeExample: 'const valores = [1, 2, 3]',
      exercise: {
        prompt: 'Crea un array.',
        starterCode: 'const valores = []',
        solutionCode: 'const valores = [1]',
        testCases: [],
      },
    },
    languageId: 63,
    level: 'beginner',
    validation: {
      approved: true,
      qualityScore: 95,
      issues: [],
    },
    ...overrides,
  }
}

describe('AI admin routes integration', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('admin publishes generated lesson globally', async () => {
    const publishGeneratedLesson = jest.fn().mockResolvedValue({
      lessonId: 44,
      learningPathId: 8,
      position: 3,
    })
    const app = createApp({
      user: { id: 1, role: 'admin' },
      groqContentService: { publishGeneratedLesson },
      pool: { query: jest.fn() },
    })

    const response = await request(app)
      .post('/api/admin/publish-content')
      .send(buildPayload({ learningPathId: 8 }))

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ lessonId: 44, learningPathId: 8, position: 3 })
    expect(publishGeneratedLesson).toHaveBeenCalledWith(expect.objectContaining({
      publishedBy: 1,
      classId: null,
      learningPathId: 8,
      languageId: 63,
    }))
  })

  test('admin cannot publish with classId because class publishing belongs to instructor flow', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const publishGeneratedLesson = jest.fn()
    const app = createApp({
      user: { id: 1, role: 'admin' },
      groqContentService: { publishGeneratedLesson },
      pool: { query: jest.fn() },
    })

    const response = await request(app)
      .post('/api/admin/publish-content')
      .send(buildPayload({ classId: 9 }))

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('CONTENT_PUBLISH_FAILED')
    expect(response.body.error).toBe('classId solo puede usarse para publicaciones de instructor en clases.')
    expect(publishGeneratedLesson).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('instructor publication requires a classId destination', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const publishGeneratedLesson = jest.fn()
    const app = createApp({
      user: { id: 11, role: 'instructor' },
      groqContentService: { publishGeneratedLesson },
      pool: { query: jest.fn() },
    })

    const response = await request(app)
      .post('/api/admin/publish-content')
      .send(buildPayload())

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('CONTENT_PUBLISH_FAILED')
    expect(response.body.error).toBe('classId es requerido para publicar como instructor.')
    expect(publishGeneratedLesson).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('admin publish targets groups active languages with their learning paths', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue([[
        {
          language_id: 2,
          language_name: 'JavaScript',
          language_slug: 'javascript',
          judge0_language_id: 63,
          path_id: 5,
          path_name: 'Glosario JavaScript',
          path_slug: 'glosario-javascript',
          difficulty_level: 'principiante',
          path_is_optional: 1,
          path_order_position: 0,
        },
        {
          language_id: 2,
          language_name: 'JavaScript',
          language_slug: 'javascript',
          judge0_language_id: 63,
          path_id: 6,
          path_name: 'JavaScript Esencial',
          path_slug: 'javascript-esencial',
          difficulty_level: 'principiante',
          path_is_optional: 0,
          path_order_position: 1,
        },
      ]]),
    }
    const app = createApp({
      user: { id: 1, role: 'admin' },
      groqContentService: {},
      pool,
    })

    const response = await request(app).get('/api/admin/publish-targets')

    expect(response.status).toBe(200)
    expect(response.body.languages).toEqual([
      {
        id: 2,
        name: 'JavaScript',
        slug: 'javascript',
        judge0LanguageId: 63,
        paths: [
          {
            id: 5,
            name: 'Glosario JavaScript',
            slug: 'glosario-javascript',
            difficultyLevel: 'principiante',
            isOptional: true,
            orderPosition: 0,
          },
          {
            id: 6,
            name: 'JavaScript Esencial',
            slug: 'javascript-esencial',
            difficultyLevel: 'principiante',
            isOptional: false,
            orderPosition: 1,
          },
        ],
      },
    ])
  })
})
