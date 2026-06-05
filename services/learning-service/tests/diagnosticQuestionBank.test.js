const { buildExam, LEVEL_WEIGHTS, EXAM_QUESTIONS_PER_LEVEL } = require('../src/services/diagnostic-question-bank.service')

describe('diagnostic-question-bank', () => {
  describe('LEVEL_WEIGHTS', () => {
    test('has weights for all three levels', () => {
      expect(LEVEL_WEIGHTS.principiante).toBeDefined()
      expect(LEVEL_WEIGHTS.intermedio).toBeDefined()
      expect(LEVEL_WEIGHTS.avanzado).toBeDefined()
    })

    test('weights increase with difficulty', () => {
      expect(LEVEL_WEIGHTS.avanzado).toBeGreaterThan(LEVEL_WEIGHTS.intermedio)
      expect(LEVEL_WEIGHTS.intermedio).toBeGreaterThan(LEVEL_WEIGHTS.principiante)
    })
  })

  describe('EXAM_QUESTIONS_PER_LEVEL', () => {
    test('is a positive number', () => {
      expect(EXAM_QUESTIONS_PER_LEVEL).toBeGreaterThan(0)
    })
  })

  describe('buildExam', () => {
    test('returns array for valid language', () => {
      const exam = buildExam('python')
      expect(Array.isArray(exam)).toBe(true)
      expect(exam.length).toBeGreaterThan(0)
    })

    test('exam has questions for each level', () => {
      const exam = buildExam('python')
      const levels = new Set(exam.map((q) => q.level))
      expect(levels.has('principiante')).toBe(true)
      expect(levels.has('intermedio')).toBe(true)
      expect(levels.has('avanzado')).toBe(true)
    })

    test('exam keeps 12 progressive questions split by level', () => {
      const exam = buildExam('javascript', 42)
      expect(exam).toHaveLength(EXAM_QUESTIONS_PER_LEVEL * 3)
      expect(exam.slice(0, 4).every((q) => q.level === 'principiante')).toBe(true)
      expect(exam.slice(4, 8).every((q) => q.level === 'intermedio')).toBe(true)
      expect(exam.slice(8, 12).every((q) => q.level === 'avanzado')).toBe(true)
    })

    test('each question has required fields', () => {
      const exam = buildExam('python')
      exam.forEach((q) => {
        expect(q.id).toBeDefined()
        expect(q.level).toBeDefined()
        expect(q.prompt).toBeDefined()
        expect(q.options).toBeDefined()
        expect(Array.isArray(q.options)).toBe(true)
        expect(q.correctOption).toBeDefined()
      })
    })

    test('each question has 4 options', () => {
      const exam = buildExam('python')
      exam.forEach((q) => {
        expect(q.options.length).toBe(4)
      })
    })

    test('correctOption is within valid range', () => {
      const exam = buildExam('python')
      exam.forEach((q) => {
        expect(q.correctOption).toBeGreaterThanOrEqual(0)
        expect(q.correctOption).toBeLessThan(4)
      })
    })

    test('options are unique per question', () => {
      const exam = buildExam('python')
      exam.forEach((q) => {
        const uniqueOptions = new Set(q.options)
        expect(uniqueOptions.size).toBe(q.options.length)
      })
    })

    test('uses seeded RNG for reproducibility', () => {
      const exam1 = buildExam('python', 42)
      const exam2 = buildExam('python', 42)
      expect(JSON.stringify(exam1)).toBe(JSON.stringify(exam2))
    })

    test('different seeds produce different exams', () => {
      const exam1 = buildExam('python', 1)
      const exam2 = buildExam('python', 2)
      expect(JSON.stringify(exam1)).not.toBe(JSON.stringify(exam2))
    })

    test('works for javascript', () => {
      const exam = buildExam('javascript')
      expect(Array.isArray(exam)).toBe(true)
      expect(exam.length).toBeGreaterThan(0)
    })

    test('includes language-specific anchors for supported languages', () => {
      const cases = [
        ['javascript', 'event loop'],
        ['python', '__name__'],
        ['java', 'Collections'],
        ['cpp', 'RAII'],
        ['csharp', 'LINQ'],
        ['go', 'Goroutines'],
        ['ruby', 'Metaprogramacion'],
      ]

      cases.forEach(([language, marker]) => {
        const examText = buildExam(language, 7)
          .map((question) => `${question.prompt} ${question.options.join(' ')}`)
          .join(' ')
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()

        expect(examText).toContain(marker.toLowerCase())
      })
    })

    test('works for java', () => {
      const exam = buildExam('java')
      expect(Array.isArray(exam)).toBe(true)
    })

    test('works for cpp', () => {
      const exam = buildExam('cpp')
      expect(Array.isArray(exam)).toBe(true)
    })

    test('works for csharp', () => {
      const exam = buildExam('csharp')
      expect(Array.isArray(exam)).toBe(true)
    })

    test('works for go', () => {
      const exam = buildExam('go')
      expect(Array.isArray(exam)).toBe(true)
    })

    test('works for ruby', () => {
      const exam = buildExam('ruby')
      expect(Array.isArray(exam)).toBe(true)
    })

    test('falls back to python for unknown language', () => {
      const exam = buildExam('unknown')
      expect(Array.isArray(exam)).toBe(true)
      expect(exam.length).toBeGreaterThan(0)
    })
  })
})
