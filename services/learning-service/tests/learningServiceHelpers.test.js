const { normalizeDifficulty, sortPathsByDifficulty, resolveAssignedLevel, pickBestPathForLevel, toRoundedNumber, normalizeAnswers, slugify, createInviteCode, stripLeadingHeading, normalizeComparableText, stripTrailingSemicolon, repairMojibake, sanitizeDisplayText, hasCorruptedGlyphs, inferBaseCodeByLanguage } = require('../src/services/learning.service')
const AppError = require('@codequest/shared')

describe('LearningService helpers', () => {
  describe('normalizeDifficulty', () => {
    test('returns principiante for non-string', () => {
      expect(normalizeDifficulty(123)).toBe('principiante')
      expect(normalizeDifficulty(null)).toBe('principiante')
      expect(normalizeDifficulty(undefined)).toBe('principiante')
    })

    test('returns valid difficulty', () => {
      expect(normalizeDifficulty('principiante')).toBe('principiante')
      expect(normalizeDifficulty('intermedio')).toBe('intermedio')
      expect(normalizeDifficulty('avanzado')).toBe('avanzado')
    })

    test('returns principiante for invalid string', () => {
      expect(normalizeDifficulty('invalid')).toBe('principiante')
    })
  })

  describe('sortPathsByDifficulty', () => {
    test('sorts by difficulty level', () => {
      const paths = [
        { id: 1, difficulty_level: 'avanzado' },
        { id: 2, difficulty_level: 'principiante' },
        { id: 3, difficulty_level: 'intermedio' },
      ]
      const sorted = sortPathsByDifficulty(paths)
      expect(sorted[0].difficulty_level).toBe('principiante')
      expect(sorted[1].difficulty_level).toBe('intermedio')
      expect(sorted[2].difficulty_level).toBe('avanzado')
    })

    test('sorts by id within same difficulty', () => {
      const paths = [
        { id: 3, difficulty_level: 'principiante' },
        { id: 1, difficulty_level: 'principiante' },
        { id: 2, difficulty_level: 'principiante' },
      ]
      const sorted = sortPathsByDifficulty(paths)
      expect(sorted[0].id).toBe(1)
      expect(sorted[1].id).toBe(2)
      expect(sorted[2].id).toBe(3)
    })

    test('does not mutate original array', () => {
      const paths = [{ id: 2, difficulty_level: 'avanzado' }, { id: 1, difficulty_level: 'principiante' }]
      const original = [...paths]
      sortPathsByDifficulty(paths)
      expect(paths).toEqual(original)
    })
  })

  describe('resolveAssignedLevel', () => {
    test('returns avanzado for >= 75%', () => {
      expect(resolveAssignedLevel(75)).toBe('avanzado')
      expect(resolveAssignedLevel(100)).toBe('avanzado')
    })

    test('returns intermedio for >= 45%', () => {
      expect(resolveAssignedLevel(45)).toBe('intermedio')
      expect(resolveAssignedLevel(74)).toBe('intermedio')
    })

    test('returns principiante for < 45%', () => {
      expect(resolveAssignedLevel(0)).toBe('principiante')
      expect(resolveAssignedLevel(44)).toBe('principiante')
    })
  })

  describe('pickBestPathForLevel', () => {
    const paths = [
      { id: 1, difficulty_level: 'principiante' },
      { id: 2, difficulty_level: 'intermedio' },
      { id: 3, difficulty_level: 'avanzado' },
    ]

    test('returns exact match', () => {
      const result = pickBestPathForLevel(paths, 'intermedio')
      expect(result.difficulty_level).toBe('intermedio')
    })

    test('returns closest match when no exact', () => {
      const result = pickBestPathForLevel(paths, 'unknown')
      expect(result.difficulty_level).toBe('principiante')
    })

    test('returns null for empty array', () => {
      expect(pickBestPathForLevel([], 'principiante')).toBeNull()
    })

    test('returns null for non-array', () => {
      expect(pickBestPathForLevel(null, 'principiante')).toBeNull()
    })

    test('prefers non-optional path over optional primer for same level', () => {
      const optionalAndRequired = [
        { id: 10, difficulty_level: 'principiante', is_optional: 1, order_position: 1 },
        { id: 11, difficulty_level: 'principiante', is_optional: 0, order_position: 2 },
      ]

      const result = pickBestPathForLevel(optionalAndRequired, 'principiante')
      expect(result.id).toBe(11)
    })

    test('falls back to optional when there are no required paths', () => {
      const optionalOnly = [
        { id: 20, difficulty_level: 'principiante', is_optional: 1, order_position: 1 },
      ]

      const result = pickBestPathForLevel(optionalOnly, 'principiante')
      expect(result.id).toBe(20)
    })
  })

  describe('toRoundedNumber', () => {
    test('rounds to 2 decimals by default', () => {
      expect(toRoundedNumber(3.14159)).toBe(3.14)
    })

    test('rounds to specified decimals', () => {
      expect(toRoundedNumber(3.14159, 3)).toBe(3.142)
    })

    test('returns 0 for non-finite', () => {
      expect(toRoundedNumber(NaN)).toBe(0)
      expect(toRoundedNumber(Infinity)).toBe(0)
    })
  })

  describe('normalizeAnswers', () => {
    test('throws for non-array', () => {
      expect(() => normalizeAnswers('not-array')).toThrow()
    })

    test('throws for empty questionId', () => {
      expect(() => normalizeAnswers([{ questionId: '', selectedOption: 0 }])).toThrow()
    })

    test('throws for invalid selectedOption', () => {
      expect(() => normalizeAnswers([{ questionId: 'q1', selectedOption: -1 }])).toThrow()
    })

    test('normalizes valid answers', () => {
      const result = normalizeAnswers([{ questionId: 'q1', selectedOption: 0 }])
      expect(result).toBeInstanceOf(Map)
      expect(result.get('q1')).toBe(0)
    })

    test('handles multiple answers', () => {
      const result = normalizeAnswers([
        { questionId: 'q1', selectedOption: 0 },
        { questionId: 'q2', selectedOption: 2 },
      ])
      expect(result.size).toBe(2)
      expect(result.get('q1')).toBe(0)
      expect(result.get('q2')).toBe(2)
    })

    test('throws for non-object item', () => {
      expect(() => normalizeAnswers(['string'])).toThrow()
    })
  })

  describe('slugify', () => {
    test('converts to lowercase', () => {
      expect(slugify('Hello World')).toContain('hello')
    })

    test('replaces spaces with hyphens', () => {
      expect(slugify('Hello World')).toContain('-')
    })

    test('removes special characters', () => {
      expect(slugify('Hello! World?')).not.toContain('!')
      expect(slugify('Hello! World?')).not.toContain('?')
    })

    test('handles accented characters', () => {
      const slug = slugify('Introducción a Python')
      expect(slug).toContain('introduccion')
    })

    test('handles empty string', () => {
      expect(slugify('')).toBe('')
    })
  })

  describe('createInviteCode', () => {
    test('generates code with CQ- prefix', () => {
      const code = createInviteCode()
      expect(code.startsWith('CQ-')).toBe(true)
    })

    test('generates 8 character code after prefix', () => {
      const code = createInviteCode()
      expect(code.length).toBe(11)
    })

    test('generates alphanumeric code', () => {
      const code = createInviteCode()
      expect(/^[A-Z0-9]+$/.test(code.slice(3))).toBe(true)
    })
  })

  describe('stripLeadingHeading', () => {
    test('removes leading HTML heading', () => {
      const result = stripLeadingHeading('<h1>Title</h1>\nSome content')
      expect(result).toBe('Some content')
    })

    test('removes h2 heading', () => {
      const result = stripLeadingHeading('<h2>Subtitle</h2>\nContent')
      expect(result).toBe('Content')
    })

    test('handles text without heading', () => {
      const result = stripLeadingHeading('Just content')
      expect(result).toBe('Just content')
    })
  })

  describe('normalizeComparableText', () => {
    test('trims whitespace', () => {
      expect(normalizeComparableText('  hello  ')).toBe('hello')
    })

    test('normalizes line endings and collapses whitespace', () => {
      expect(normalizeComparableText('line1\r\nline2')).toBe('line1 line2')
    })

    test('collapses multiple spaces', () => {
      expect(normalizeComparableText('hello   world')).toBe('hello world')
    })

    test('converts to lowercase', () => {
      expect(normalizeComparableText('HELLO')).toBe('hello')
    })
  })

  describe('stripTrailingSemicolon', () => {
    test('removes trailing semicolon', () => {
      expect(stripTrailingSemicolon('console.log("hi");')).toBe('console.log("hi")')
    })

    test('does not remove internal semicolons', () => {
      expect(stripTrailingSemicolon('a = 1; b = 2')).toBe('a = 1; b = 2')
    })

    test('handles string without semicolon', () => {
      expect(stripTrailingSemicolon('no semicolon')).toBe('no semicolon')
    })
  })

  describe('repairMojibake', () => {
    test('removes replacement characters', () => {
      const result = repairMojibake('hello\ufffdworld')
      expect(result).not.toContain('\ufffd')
    })

    test('handles clean text', () => {
      expect(repairMojibake('clean text')).toBe('clean text')
    })
  })

  describe('sanitizeDisplayText', () => {
    test('removes corrupted glyphs', () => {
      const result = sanitizeDisplayText('hello\ufffdworld')
      expect(result).not.toContain('\ufffd')
    })

    test('handles clean text', () => {
      expect(sanitizeDisplayText('clean')).toBe('clean')
    })
  })

  describe('hasCorruptedGlyphs', () => {
    test('detects corrupted glyphs', () => {
      expect(hasCorruptedGlyphs('hello\ufffdworld')).toBe(true)
    })

    test('returns false for clean text', () => {
      expect(hasCorruptedGlyphs('clean text')).toBe(false)
    })
  })

  describe('inferBaseCodeByLanguage', () => {
    test('returns python template for language id 1', () => {
      const code = inferBaseCodeByLanguage(1)
      expect(code).toContain('print')
    })

    test('returns javascript template for language id 2', () => {
      const code = inferBaseCodeByLanguage(2)
      expect(code).toContain('console.log')
    })

    test('returns java template for language id 3', () => {
      const code = inferBaseCodeByLanguage(3)
      expect(code).toContain('System.out.println')
    })

    test('returns default for unknown language id', () => {
      const code = inferBaseCodeByLanguage(99)
      expect(code).toContain('print')
    })

    test('returns default for zero', () => {
      const code = inferBaseCodeByLanguage(0)
      expect(code).toContain('print')
    })
  })
})
