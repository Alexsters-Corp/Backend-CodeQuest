const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const getOverview = asyncHandler(async (req, res) => {
  const overview = await learningService.getProgressOverview(req.user.id)
  return res.status(200).json(overview)
})

const completeLesson = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const result = await learningService.markLessonCompleted({
    userId: req.user.id,
    lessonId,
  })

  return res.status(200).json(result)
})

module.exports = {
  getOverview,
  completeLesson,
}
