describe('api-gateway env', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    jest.resetModules()
  })

  function loadEnv(overrides = {}) {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      ...overrides,
    }

    return require('../src/config/env').env
  }

  test('keeps trust proxy disabled by default for local development', () => {
    const env = loadEnv({ TRUST_PROXY: undefined })

    expect(env.trustProxy).toBe(false)
  })

  test('parses TRUST_PROXY=1 as the immediate reverse proxy hop', () => {
    const env = loadEnv({ TRUST_PROXY: '1' })

    expect(env.trustProxy).toBe(1)
  })

  test('parses boolean trust proxy values', () => {
    expect(loadEnv({ TRUST_PROXY: 'true' }).trustProxy).toBe(true)
    expect(loadEnv({ TRUST_PROXY: 'false' }).trustProxy).toBe(false)
  })
})
