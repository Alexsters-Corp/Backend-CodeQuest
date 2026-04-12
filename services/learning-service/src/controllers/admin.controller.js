const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { learningService } = require('../services/container')

const createLearningPath = asyncHandler(async (req, res) => {
  const payload = await learningService.adminCreateLearningPath({
    programmingLanguageId: parsePositiveInt(req.body?.programmingLanguageId, 'programmingLanguageId'),
    name: parseString(req.body?.name, 'name'),
    slug: req.body?.slug,
    description: req.body?.description,
    difficultyLevel: parseString(req.body?.difficultyLevel, 'difficultyLevel').toLowerCase(),
    estimatedHours: req.body?.estimatedHours,
    isActive: req.body?.isActive !== false,
  })

  return res.status(201).json(payload)
})

const getGlobalAnalytics = asyncHandler(async (_req, res) => {
  const payload = await learningService.getAdminAnalytics()
  return res.status(200).json(payload)
})

module.exports = {
  createLearningPath,
  getGlobalAnalytics,
}
