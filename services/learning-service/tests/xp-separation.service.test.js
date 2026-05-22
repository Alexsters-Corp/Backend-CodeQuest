const { LearningService } = require('../src/services/learning.service')

describe('LearningService XP Separation', () => {
  let service
  let progressRepository
  let classManagementRepository
  let lessonsRepository
  let submissionsRepository
  let solutionsRepository

  beforeEach(() => {
    progressRepository = {
      addXpToStats: jest.fn().mockResolvedValue(undefined),
      markLessonCompleted: jest.fn().mockResolvedValue(undefined),
      upsertProgressIfBetter: jest.fn().mockResolvedValue(undefined),
      getProgressForLesson: jest.fn().mockResolvedValue({ status: 'in_progress' }),
      updateStreak: jest.fn().mockResolvedValue(undefined),
    }

    classManagementRepository = {
      isPathAssignedToStudentClasses: jest.fn(),
    }

    lessonsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 101,
        learning_path_id: 11,
        xp_reward: 50,
        programming_language_id: 2,
      }),
    }

    submissionsRepository = {
      createSubmission: jest.fn().mockResolvedValue(1),
    }

    solutionsRepository = {
      findByLesson: jest.fn().mockResolvedValue(null),
    }

    service = new LearningService({
      pathsRepository: {},
      lessonsRepository,
      progressRepository,
      favoritesRepository: {},
      diagnosticRepository: {},
      classManagementRepository,
      submissionsRepository,
      solutionsRepository,
      schemaGuardService: { assertGroup: jest.fn().mockResolvedValue(undefined) },
      diagnosticQuestionBank: { buildExam: () => [] },
    })
  })

  test('submitSolution adds XP to global stats if NOT a class lesson', async () => {
    classManagementRepository.isPathAssignedToStudentClasses.mockResolvedValue(false)

    await service.submitSolution({
      userId: 1,
      lessonId: 101,
      correctCount: 3,
      totalExercises: 3,
      isRetry: false,
    })

    expect(classManagementRepository.isPathAssignedToStudentClasses).toHaveBeenCalledWith(1, 11)
    expect(progressRepository.addXpToStats).toHaveBeenCalledWith({ userId: 1, xp: 50 })
    expect(progressRepository.markLessonCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ isClassXp: false })
    )
  })

  test('submitSolution DOES NOT add XP to global stats if it is a class lesson', async () => {
    classManagementRepository.isPathAssignedToStudentClasses.mockResolvedValue(true)

    await service.submitSolution({
      userId: 1,
      lessonId: 101,
      correctCount: 3,
      totalExercises: 3,
      isRetry: false,
    })

    expect(classManagementRepository.isPathAssignedToStudentClasses).toHaveBeenCalledWith(1, 11)
    expect(progressRepository.addXpToStats).not.toHaveBeenCalled()
    expect(progressRepository.markLessonCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ isClassXp: true })
    )
  })
})
