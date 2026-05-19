const { requireFields, parsePositiveInt, parseString } = require('../src/validation/request')
const AppError = require('../src/errors/AppError')

describe('requireFields', () => {
  test('throws when fields are missing', () => {
    expect(() => requireFields({}, ['email', 'password'])).toThrow(AppError)
    const fn = () => requireFields({}, ['email', 'password'])
    expect(fn).toThrow('Campos requeridos: email, password.')
  })

  test('throws when field is undefined', () => {
    expect(() => requireFields({ email: 'a' }, ['email', 'password'])).toThrow(AppError)
  })

  test('throws when field is null', () => {
    expect(() => requireFields({ email: 'a', password: null }, ['email', 'password'])).toThrow(AppError)
  })

  test('throws when field is empty string', () => {
    expect(() => requireFields({ email: 'a', password: '' }, ['email', 'password'])).toThrow(AppError)
  })

  test('passes when all fields present', () => {
    expect(() => requireFields({ email: 'a', password: 'b' }, ['email', 'password'])).not.toThrow()
  })

  test('handles null payload', () => {
    expect(() => requireFields(null, ['email'])).toThrow(AppError)
  })

  test('handles undefined payload', () => {
    expect(() => requireFields(undefined, ['email'])).toThrow(AppError)
  })

  test('throws with correct error code', () => {
    try {
      requireFields({}, ['email'])
    } catch (e) {
      expect(e.code).toBe('VALIDATION_ERROR')
      expect(e.statusCode).toBe(400)
    }
  })
})

describe('parsePositiveInt', () => {
  test('parses valid positive integer string', () => {
    expect(parsePositiveInt('5', 'count')).toBe(5)
  })

  test('parses valid positive integer number', () => {
    expect(parsePositiveInt(10, 'count')).toBe(10)
  })

  test('throws for zero', () => {
    expect(() => parsePositiveInt(0, 'count')).toThrow(AppError)
  })

  test('throws for negative number', () => {
    expect(() => parsePositiveInt(-1, 'count')).toThrow(AppError)
  })

  test('throws for float', () => {
    expect(() => parsePositiveInt(1.5, 'count')).toThrow(AppError)
  })

  test('throws for non-numeric string', () => {
    expect(() => parsePositiveInt('abc', 'count')).toThrow(AppError)
  })

  test('throws for empty string', () => {
    expect(() => parsePositiveInt('', 'count')).toThrow(AppError)
  })

  test('throws with correct message', () => {
    const fn = () => parsePositiveInt(-1, 'age')
    expect(fn).toThrow('age debe ser un entero positivo.')
  })
})

describe('parseString', () => {
  test('returns trimmed string by default', () => {
    expect(parseString('  hello  ', 'name')).toBe('hello')
  })

  test('returns string without trim when trim=false', () => {
    expect(parseString('  hello  ', 'name', { trim: false })).toBe('  hello  ')
  })

  test('throws for non-string value', () => {
    expect(() => parseString(123, 'name')).toThrow(AppError)
  })

  test('throws for null value', () => {
    expect(() => parseString(null, 'name')).toThrow(AppError)
  })

  test('throws for undefined value', () => {
    expect(() => parseString(undefined, 'name')).toThrow(AppError)
  })

  test('throws when string is shorter than minLength', () => {
    expect(() => parseString('ab', 'name', { minLength: 3 })).toThrow(AppError)
  })

  test('passes when string meets minLength', () => {
    expect(parseString('abc', 'name', { minLength: 3 })).toBe('abc')
  })

  test('trims before checking minLength', () => {
    expect(parseString('  abc  ', 'name', { minLength: 3 })).toBe('abc')
  })

  test('throws with correct message for minLength', () => {
    const fn = () => parseString('a', 'title', { minLength: 5 })
    expect(fn).toThrow('title no cumple longitud minima de 5.')
  })

  test('throws with correct message for non-string', () => {
    const fn = () => parseString(42, 'title')
    expect(fn).toThrow('title debe ser texto.')
  })
})
