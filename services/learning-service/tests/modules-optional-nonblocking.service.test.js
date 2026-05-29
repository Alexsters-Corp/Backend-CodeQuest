const { LearningService } = require('../src/services/learning.service')

describe('LearningService optional module non-blocking behavior', () => {
  test('reassigns selected optional path to first required path and keeps required module available', async () => {
    const pathsRepository = {
      findLanguageById: jest.fn().mockResolvedValue({ id: 1, slug: 'python' }),
      getSelectedPathForUserLanguage: jest.fn().mockResolvedValue(24),
      replaceSelectedPathForUserLanguage: jest.fn().mockResolvedValue(undefined),
      listPaths: jest.fn().mockResolvedValue([
        { id: 24, name: 'Python Primer', description: 'Opcional', difficulty_level: 'principiante', is_optional: 1, order_position: 1 },
        { id: 1, name: 'Python desde Cero', description: 'Base', difficulty_level: 'principiante', is_optional: 0, order_position: 2 },
        { id: 2, name: 'Python Intermedio', description: 'Intermedio', difficulty_level: 'intermedio', is_optional: 0, order_position: 3 },
      ]),
    }

    const diagnosticRepository = {
      getLatestAttemptByLanguage: jest.fn().mockResolvedValue({ status: 'completed', assigned_path_id: 24 }),
    }

    const progressRepository = {
      getPathLessonStatsByLanguage: jest.fn().mockResolvedValue([
        { path_id: 24, total_lessons: 5, completed_lessons: 0 },
        { path_id: 1, total_lessons: 7, completed_lessons: 0 },
        { path_id: 2, total_lessons: 7, completed_lessons: 0 },
      ]),
    }

    const service = new LearningService({
      pathsRepository,
      lessonsRepository: {},
      progressRepository,
      favoritesRepository: {},
      diagnosticRepository,
      classManagementRepository: {},
      submissionsRepository: {},
      solutionsRepository: {},
      schemaGuardService: { assertGroup: jest.fn().mockResolvedValue(undefined) },
      diagnosticQuestionBank: { buildExam: () => [] },
    })

    const modules = await service.listModulesByLanguage({ userId: 55, languageId: 1, locale: 'es' })

    const primer = modules.find((m) => m.id === 24)
    const basics = modules.find((m) => m.id === 1)
    const intermediate = modules.find((m) => m.id === 2)

    expect(pathsRepository.replaceSelectedPathForUserLanguage).toHaveBeenCalledWith({
      userId: 55,
      languageId: 1,
      pathId: 1,
    })

    expect(primer.estado).toBe('disponible')
    expect(basics.estado).toBe('en_progreso')
    expect(intermediate.estado).toBe('bloqueado')
  })
})
