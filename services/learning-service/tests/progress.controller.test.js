jest.mock('../src/services/container', () => ({
  learningService: {
    listStudentClasses: jest.fn(),
  },
}))

const { learningService } = require('../src/services/container')
const { listStudentClasses } = require('../src/controllers/progress.controller')

describe('progress.controller listStudentClasses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 200 with student classes payload', async () => {
    learningService.listStudentClasses.mockResolvedValue({
      classes: [{ id: 10, name: 'Clase test' }],
    })

    const req = { user: { id: 44 } }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    await listStudentClasses(req, res, next)

    expect(learningService.listStudentClasses).toHaveBeenCalledWith({ studentUserId: 44 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ classes: [{ id: 10, name: 'Clase test' }] })
    expect(next).not.toHaveBeenCalled()
  })

  test('forwards errors to next middleware', async () => {
    const error = new Error('boom')
    learningService.listStudentClasses.mockRejectedValue(error)

    const req = { user: { id: 44 } }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    listStudentClasses(req, res, next)
    await new Promise((resolve) => setImmediate(resolve))

    expect(next).toHaveBeenCalledWith(error)
  })
})
