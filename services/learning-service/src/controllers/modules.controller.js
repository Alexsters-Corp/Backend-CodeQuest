const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const listModulesByLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.params.languageId, 'languageId')
  const modules = await learningService.listModulesByLanguage({
    userId: req.user.id,
    languageId,
  })

  return res.status(200).json(modules)
})

module.exports = {
  listModulesByLanguage,
}
