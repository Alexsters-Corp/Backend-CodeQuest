const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

function getRequestLocale(req) {
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'es'
}

const listModulesByLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.params.languageId, 'languageId')
  const modules = await learningService.listModulesByLanguage({
    userId: req.user.id,
    languageId,
    locale: getRequestLocale(req),
  })

  return res.status(200).json(modules)
})

module.exports = {
  listModulesByLanguage,
}
