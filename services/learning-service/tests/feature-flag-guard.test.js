jest.mock('../src/config/env', () => ({
  env: {
    features: {},
  },
}))

const AppError = require('@codequest/shared')

describe('featureFlagGuard', () => {
  let req, res, next

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    const envModule = require('../src/config/env')
    envModule.env.features = {}

    req = { originalUrl: '/api/test' }
    res = {}
    next = jest.fn()
  })

  test('allows request when feature is enabled', () => {
    const envModule = require('../src/config/env')
    envModule.env.features.FEATURE_LEARNING_PATHS = true

    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_LEARNING_PATHS')
    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  test('blocks request when feature is disabled', () => {
    const envModule = require('../src/config/env')
    envModule.env.features.FEATURE_LEARNING_PATHS = false

    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_LEARNING_PATHS')
    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(503)
    expect(error.code).toBe('FEATURE_DISABLED')
  })

  test('blocks request when feature is not set', () => {
    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_UNKNOWN')
    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(503)
  })

  test('includes feature name in error details', () => {
    const envModule = require('../src/config/env')
    envModule.env.features.FEATURE_TEST = false

    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_TEST')
    middleware(req, res, next)

    const error = next.mock.calls[0][0]
    expect(error.details.featureName).toBe('FEATURE_TEST')
  })

  test('handles AI features', () => {
    const envModule = require('../src/config/env')
    envModule.env.features.FEATURE_AI_CONTENT_ENABLED = true

    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_AI_CONTENT_ENABLED')
    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  test('handles code execution feature', () => {
    const envModule = require('../src/config/env')
    envModule.env.features.FEATURE_CODE_EXECUTION_ENABLED = true

    const featureFlagGuard = require('../src/middleware/feature-flag.guard')
    const middleware = featureFlagGuard('FEATURE_CODE_EXECUTION_ENABLED')
    middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })
})
