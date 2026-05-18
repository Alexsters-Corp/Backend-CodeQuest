const TableSchemaRepository = require('../src/db/TableSchemaRepository')

describe('TableSchemaRepository', () => {
  let pool, repo

  beforeEach(() => {
    pool = { query: jest.fn() }
    repo = new TableSchemaRepository({ pool })
  })

  describe('findMissingTables', () => {
    test('returns empty array when all tables exist', async () => {
      pool.query.mockResolvedValue([
        [{ table_name: 'users' }, { table_name: 'lessons' }],
      ])

      const missing = await repo.findMissingTables(['users', 'lessons'])
      expect(missing).toEqual([])
    })

    test('returns missing tables', async () => {
      pool.query.mockResolvedValue([
        [{ table_name: 'users' }],
      ])

      const missing = await repo.findMissingTables(['users', 'lessons', 'paths'])
      expect(missing).toEqual(['lessons', 'paths'])
    })

    test('returns all tables when none exist', async () => {
      pool.query.mockResolvedValue([[]])

      const missing = await repo.findMissingTables(['users', 'lessons'])
      expect(missing).toEqual(['users', 'lessons'])
    })

    test('generates correct SQL query', async () => {
      pool.query.mockResolvedValue([[{ table_name: 'users' }]])

      await repo.findMissingTables(['users', 'lessons', 'paths'])
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT table_name'),
        ['users', 'lessons', 'paths']
      )
    })

    test('uses correct placeholders count', async () => {
      pool.query.mockResolvedValue([[{ table_name: 'a' }]])

      await repo.findMissingTables(['a', 'b', 'c', 'd'])
      const [sql] = pool.query.mock.calls[0]
      const placeholderCount = (sql.match(/\?/g) || []).length
      expect(placeholderCount).toBe(4)
    })
  })
})
