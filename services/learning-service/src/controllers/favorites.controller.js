const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const listPathFavorites = asyncHandler(async (req, res) => {
  const favorites = await learningService.listPathFavorites(req.user.id)
  return res.status(200).json(favorites)
})

const togglePathFavorite = asyncHandler(async (req, res) => {
  const pathId = parsePositiveInt(req.params.pathId, 'pathId')

  const result = await learningService.togglePathFavorite({
    userId: req.user.id,
    pathId,
  })

  return res.status(200).json(result)
})

const listLessonFavorites = asyncHandler(async (req, res) => {
  const favorites = await learningService.listLessonFavorites(req.user.id)
  return res.status(200).json(favorites)
})

const toggleLessonFavorite = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const result = await learningService.toggleLessonFavorite({
    userId: req.user.id,
    lessonId,
  })

  return res.status(200).json(result)
})

module.exports = {
  listPathFavorites,
  togglePathFavorite,
  listLessonFavorites,
  toggleLessonFavorite,
}
