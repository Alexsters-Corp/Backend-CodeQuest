const { PORTS } = require('../src/constants/ports')

describe('PORTS', () => {
  test('gateway port is 4000', () => {
    expect(PORTS.gateway).toBe(4000)
  })

  test('auth port is 4001', () => {
    expect(PORTS.auth).toBe(4001)
  })

  test('learning port is 4002', () => {
    expect(PORTS.learning).toBe(4002)
  })

  test('PORTS is frozen', () => {
    expect(Object.isFrozen(PORTS)).toBe(true)
  })
})
