const { hashToken } = require('../src/security/tokenHash')

describe('hashToken', () => {
  test('hashes token to sha256 hex string', () => {
    const hash = hashToken('my-token')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true)
  })

  test('same token produces same hash', () => {
    const hash1 = hashToken('my-token')
    const hash2 = hashToken('my-token')
    expect(hash1).toBe(hash2)
  })

  test('different tokens produce different hashes', () => {
    const hash1 = hashToken('token-a')
    const hash2 = hashToken('token-b')
    expect(hash1).not.toBe(hash2)
  })

  test('handles numeric tokens', () => {
    const hash = hashToken(12345)
    expect(hash.length).toBe(64)
  })

  test('handles empty string', () => {
    const hash = hashToken('')
    expect(hash.length).toBe(64)
  })

  test('hash is deterministic', () => {
    const expected = hashToken('deterministic-test')
    expect(hashToken('deterministic-test')).toBe(expected)
  })
})
