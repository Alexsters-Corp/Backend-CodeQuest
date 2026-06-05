const ProgressRepository = require('../src/repositories/progress.repository')

describe('ProgressRepository', () => {
  describe('getRecentXP', () => {
    test('groups recent XP by the same formatted date selected for ONLY_FULL_GROUP_BY compatibility', async () => {
      const pool = {
        query: jest.fn().mockResolvedValue([[]]),
      }
      const repository = new ProgressRepository({ pool })

      await repository.getRecentXP(42)

      const [sql, params] = pool.query.mock.calls[0]

      expect(params).toEqual([42])
      expect(sql).toContain("DATE_FORMAT(us.created_at, '%Y-%m-%d') AS dia")
      expect(sql).toContain("GROUP BY DATE_FORMAT(us.created_at, '%Y-%m-%d')")
      expect(sql).not.toContain('GROUP BY DATE(us.created_at)')
    })

    test('returns the last seven days with zeroes when the user has no recent XP', async () => {
      const pool = {
        query: jest.fn().mockResolvedValue([[]]),
      }
      const repository = new ProgressRepository({ pool })

      const result = await repository.getRecentXP(42)

      expect(result).toHaveLength(7)
      expect(result.every((day) => day.xp === 0)).toBe(true)
      expect(result.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.dia))).toBe(true)
    })
  })
})
