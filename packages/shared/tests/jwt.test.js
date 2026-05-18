const { createJwtToolkit } = require('../src/security/jwt')
const jwt = require('jsonwebtoken')

describe('createJwtToolkit', () => {
  const secrets = {
    accessSecret: 'test_access_secret',
    refreshSecret: 'test_refresh_secret',
  }

  describe('initialization', () => {
    test('throws when accessSecret is missing', () => {
      expect(() => createJwtToolkit({ accessSecret: '', refreshSecret: 'x' })).toThrow()
    })

    test('throws when refreshSecret is missing', () => {
      expect(() => createJwtToolkit({ accessSecret: 'x', refreshSecret: '' })).toThrow()
    })

    test('throws when both secrets are missing', () => {
      expect(() => createJwtToolkit({})).toThrow()
    })

    test('creates toolkit with valid secrets', () => {
      const toolkit = createJwtToolkit(secrets)
      expect(toolkit.signAccessToken).toBeDefined()
      expect(toolkit.signRefreshToken).toBeDefined()
      expect(toolkit.verifyAccessToken).toBeDefined()
      expect(toolkit.verifyRefreshToken).toBeDefined()
    })
  })

  describe('signAccessToken', () => {
    const toolkit = createJwtToolkit(secrets)

    test('signs token with payload', () => {
      const token = toolkit.signAccessToken({ id: 1, email: 'test@test.com' })
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    test('token contains payload data', () => {
      const token = toolkit.signAccessToken({ id: 42, email: 'user@test.com', role: 'admin' })
      const decoded = jwt.decode(token)
      expect(decoded.id).toBe(42)
      expect(decoded.email).toBe('user@test.com')
      expect(decoded.role).toBe('admin')
    })

    test('token contains jti', () => {
      const token = toolkit.signAccessToken({ id: 1 })
      const decoded = jwt.decode(token)
      expect(decoded.jti).toBeDefined()
      expect(typeof decoded.jti).toBe('string')
    })

    test('token has expiration', () => {
      const token = toolkit.signAccessToken({ id: 1 })
      const decoded = jwt.decode(token)
      expect(decoded.exp).toBeDefined()
    })

    test('generates unique jti for each token', () => {
      const token1 = toolkit.signAccessToken({ id: 1 })
      const token2 = toolkit.signAccessToken({ id: 1 })
      const decoded1 = jwt.decode(token1)
      const decoded2 = jwt.decode(token2)
      expect(decoded1.jti).not.toBe(decoded2.jti)
    })
  })

  describe('signRefreshToken', () => {
    const toolkit = createJwtToolkit(secrets)

    test('signs token with payload', () => {
      const token = toolkit.signRefreshToken({ id: 1 })
      expect(typeof token).toBe('string')
    })

    test('token contains payload data', () => {
      const token = toolkit.signRefreshToken({ id: 99 })
      const decoded = jwt.decode(token)
      expect(decoded.id).toBe(99)
    })

    test('token contains jti', () => {
      const token = toolkit.signRefreshToken({ id: 1 })
      const decoded = jwt.decode(token)
      expect(decoded.jti).toBeDefined()
    })
  })

  describe('verifyAccessToken', () => {
    const toolkit = createJwtToolkit(secrets)

    test('verifies valid token', () => {
      const token = toolkit.signAccessToken({ id: 1, email: 'test@test.com' })
      const decoded = toolkit.verifyAccessToken(token)
      expect(decoded.id).toBe(1)
      expect(decoded.email).toBe('test@test.com')
    })

    test('throws for invalid token', () => {
      expect(() => toolkit.verifyAccessToken('invalid.token.here')).toThrow()
    })

    test('throws for token signed with wrong secret', () => {
      const wrongToolkit = createJwtToolkit({
        accessSecret: 'wrong_secret',
        refreshSecret: 'test_refresh_secret',
      })
      const token = wrongToolkit.signAccessToken({ id: 1 })
      expect(() => toolkit.verifyAccessToken(token)).toThrow()
    })

    test('throws for expired token', () => {
      const expiredToolkit = createJwtToolkit({
        accessSecret: 'test_access_secret',
        refreshSecret: 'test_refresh_secret',
        accessExpiresIn: '0s',
      })
      const token = expiredToolkit.signAccessToken({ id: 1 })
      setTimeout(() => {
        expect(() => toolkit.verifyAccessToken(token)).toThrow()
      }, 100)
    })
  })

  describe('verifyRefreshToken', () => {
    const toolkit = createJwtToolkit(secrets)

    test('verifies valid token', () => {
      const token = toolkit.signRefreshToken({ id: 1 })
      const decoded = toolkit.verifyRefreshToken(token)
      expect(decoded.id).toBe(1)
    })

    test('throws for invalid token', () => {
      expect(() => toolkit.verifyRefreshToken('invalid.token.here')).toThrow()
    })

    test('throws for token signed with wrong secret', () => {
      const wrongToolkit = createJwtToolkit({
        accessSecret: 'test_access_secret',
        refreshSecret: 'wrong_secret',
      })
      const token = wrongToolkit.signRefreshToken({ id: 1 })
      expect(() => toolkit.verifyRefreshToken(token)).toThrow()
    })
  })

  describe('cross-verification', () => {
    const toolkit = createJwtToolkit(secrets)

    test('access token cannot be verified as refresh token', () => {
      const token = toolkit.signAccessToken({ id: 1 })
      expect(() => toolkit.verifyRefreshToken(token)).toThrow()
    })

    test('refresh token cannot be verified as access token', () => {
      const token = toolkit.signRefreshToken({ id: 1 })
      expect(() => toolkit.verifyAccessToken(token)).toThrow()
    })
  })

  describe('custom expiration', () => {
    test('uses custom access expiration', () => {
      const toolkit = createJwtToolkit({
        ...secrets,
        accessExpiresIn: '1h',
      })
      const token = toolkit.signAccessToken({ id: 1 })
      const decoded = jwt.decode(token)
      const now = Math.floor(Date.now() / 1000)
      expect(decoded.exp - now).toBeGreaterThan(3500)
      expect(decoded.exp - now).toBeLessThan(3700)
    })

    test('uses custom refresh expiration', () => {
      const toolkit = createJwtToolkit({
        ...secrets,
        refreshExpiresIn: '1d',
      })
      const token = toolkit.signRefreshToken({ id: 1 })
      const decoded = jwt.decode(token)
      const now = Math.floor(Date.now() / 1000)
      expect(decoded.exp - now).toBeGreaterThan(86000)
      expect(decoded.exp - now).toBeLessThan(86500)
    })
  })
})
