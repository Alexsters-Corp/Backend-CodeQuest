const { newRawToken, hashToken } = require('../src/utils/tokenHash')

describe('tokenHash utils', () => {
  describe('newRawToken', () => {
    test('generates 64 character hex string', () => {
      const token = newRawToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64)
    })

    test('returns hex string', () => {
      const token = newRawToken()
      expect(/^[a-f0-9]+$/.test(token)).toBe(true)
    })
  })

  describe('hashToken', () => {
    test('hashes token using sha256', () => {
      const hash = hashToken('test-token')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64)
    })

    test('same token produces same hash', () => {
      const hash1 = hashToken('same-token')
      const hash2 = hashToken('same-token')
      expect(hash1).toBe(hash2)
    })

    test('different tokens produce different hashes', () => {
      const hash1 = hashToken('token-a')
      const hash2 = hashToken('token-b')
      expect(hash1).not.toBe(hash2)
    })
  })
})
