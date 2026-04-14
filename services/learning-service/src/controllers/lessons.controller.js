const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const listLessonsByPath = asyncHandler(async (req, res) => {
  const pathId = parsePositiveInt(req.params.pathId, 'pathId')
  const userId = req.user?.id

  const lessons = await learningService.listLessons({ pathId, userId })
  return res.status(200).json(lessons)
})

const getLessonById = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')
  const userId = req.user?.id

  const lesson = await learningService.getLessonById({ lessonId, userId })
  return res.status(200).json(lesson)
})

const getLessonSession = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const payload = await learningService.getLessonSession({
    lessonId,
    userId: req.user.id,
  })

  return res.status(200).json(payload)
})

const submitLessonExercise = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')
  const exerciseId = String(req.params.exerciseId || '').trim()

  const result = await learningService.submitLessonExercise({
    userId: req.user.id,
    lessonId,
    exerciseId,
    answer: req.body?.answer,
  })

  return res.status(200).json(result)
})

const listCompletedLessons = asyncHandler(async (req, res) => {
  const lessons = await learningService.listCompletedLessons(req.user.id)
  return res.status(200).json(lessons)
})

const submitSolution = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const result = await learningService.submitSolution({
    userId: req.user.id,
    lessonId,
    code: req.body?.code,
    languageId: req.body?.language_id,
  })

  return res.status(200).json(result)
})

module.exports = {
  listLessonsByPath,
  getLessonById,
  getLessonSession,
  submitLessonExercise,
  listCompletedLessons,
  submitSolution,
}
