describe('GroqContentService classifyContent', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.GROQ_API_KEY = 'test-key'
    process.env.AI_MODEL_CONTENT_GENERATION = 'llama-3.3-70b'
    process.env.AI_MAX_RETRIES = '3'
    process.env.AI_TIMEOUT_MS = '1000'
  })

  test('retries Groq and caches response', async () => {
    const get = jest.fn().mockResolvedValue(null)
    const set = jest.fn().mockResolvedValue(undefined)

    jest.doMock('../src/services/redisClient', () => ({
      createRedisClient: jest.fn().mockResolvedValue({ get, set }),
    }))

    const create = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ level: 'beginner', confidence: 0.9 }) } }],
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

    const { GroqContentService } = require('../src/services/groqContentService')
    const service = new GroqContentService({ pool: { query: jest.fn() } })

    const result = await service.classifyContent({ text: 'hello' })

    expect(result.level).toBe('beginner')
    expect(create).toHaveBeenCalledTimes(2)
    expect(set).toHaveBeenCalledTimes(1)
  })

  test('returns cached classification without Groq call', async () => {
    const cachedValue = JSON.stringify({ level: 'intermediate', confidence: 0.8 })
    const get = jest.fn().mockResolvedValue(cachedValue)
    const set = jest.fn().mockResolvedValue(undefined)

    jest.doMock('../src/services/redisClient', () => ({
      createRedisClient: jest.fn().mockResolvedValue({ get, set }),
    }))

    const create = jest.fn()

    jest.doMock('groq-sdk', () => ({
      Groq: jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create,
          },
        },
      })),
    }))

    const { GroqContentService } = require('../src/services/groqContentService')
    const service = new GroqContentService({ pool: { query: jest.fn() } })

    const result = await service.classifyContent({ text: 'cached' })

    expect(result.level).toBe('intermediate')
    expect(create).not.toHaveBeenCalled()
  })
})
