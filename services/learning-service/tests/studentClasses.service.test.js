const { LearningService } = require('../src/services/learning.service')

function buildLearningService({ studentClassRows = [] } = {}) {
  const classManagementRepository = {
    listClassesByStudent: jest.fn().mockResolvedValue(studentClassRows),
  }

  const schemaGuardService = {
    assertGroup: jest.fn().mockResolvedValue(undefined),
  }

  const service = new LearningService({
    pathsRepository: {},
    lessonsRepository: {},
    progressRepository: {},
    favoritesRepository: {},
    diagnosticRepository: {},
    classManagementRepository,
    submissionsRepository: {},
    solutionsRepository: {},
    schemaGuardService,
    diagnosticQuestionBank: {},
  })

  return {
    service,
    classManagementRepository,
    schemaGuardService,
  }
}

describe('LearningService.listStudentClasses', () => {
  test('returns empty classes list when student has no enrollments', async () => {
    const { service, classManagementRepository } = buildLearningService({ studentClassRows: [] })

    const result = await service.listStudentClasses({ studentUserId: 25 })

    expect(classManagementRepository.listClassesByStudent).toHaveBeenCalledWith(25)
    expect(result).toEqual({ classes: [] })
  })

  test('maps classes, assigned paths and progress for enrolled student', async () => {
    const { service, schemaGuardService } = buildLearningService({
      studentClassRows: [
        {
          class_id: 8,
          class_name: 'Clase Backend',
          class_description: 'Rutas de backend',
          class_created_at: '2026-05-19T10:00:00.000Z',
          joined_at: '2026-05-20T10:00:00.000Z',
          instructor_user_id: 3,
          instructor_name: 'Instructor Uno',
          instructor_email: 'instructor@codequest.local',
          learning_path_id: 11,
          is_required: 1,
          assigned_at: '2026-05-20T11:00:00.000Z',
          learning_path_name: 'Node Intermedio',
          difficulty_level: 'intermedio',
          programming_language_id: 2,
          total_lessons: 10,
          completed_lessons: 4,
        },
        {
          class_id: 8,
          class_name: 'Clase Backend',
          class_description: 'Rutas de backend',
          class_created_at: '2026-05-19T10:00:00.000Z',
          joined_at: '2026-05-20T10:00:00.000Z',
          instructor_user_id: 3,
          instructor_name: 'Instructor Uno',
          instructor_email: 'instructor@codequest.local',
          learning_path_id: 12,
          is_required: 0,
          assigned_at: '2026-05-20T11:30:00.000Z',
          learning_path_name: 'Node Avanzado',
          difficulty_level: 'avanzado',
          programming_language_id: 2,
          total_lessons: 8,
          completed_lessons: 2,
        },
      ],
    })

    const result = await service.listStudentClasses({ studentUserId: 25 })

    expect(schemaGuardService.assertGroup).toHaveBeenNthCalledWith(1, 'rbac_instructor')
    expect(schemaGuardService.assertGroup).toHaveBeenNthCalledWith(2, 'lessons')

    expect(result.classes).toHaveLength(1)
    expect(result.classes[0]).toMatchObject({
      id: 8,
      name: 'Clase Backend',
      assigned_paths_total: 2,
      instructor: {
        id: 3,
        name: 'Instructor Uno',
        email: 'instructor@codequest.local',
      },
    })

    expect(result.classes[0].assigned_paths).toHaveLength(2)
    expect(result.classes[0].assigned_paths[0]).toMatchObject({
      id: 11,
      name: 'Node Intermedio',
      is_required: true,
      progress: {
        total_lessons: 10,
        completed_lessons: 4,
        completion_percentage: 40,
      },
    })

    expect(result.classes[0].assigned_paths[1]).toMatchObject({
      id: 12,
      name: 'Node Avanzado',
      is_required: false,
      progress: {
        total_lessons: 8,
        completed_lessons: 2,
        completion_percentage: 25,
      },
    })
  })
})
