const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const listLanguages = asyncHandler(async (req, res) => {
  const languages = await learningService.listAvailableLanguages(req.user.id)
  return res.status(200).json(languages)
})

const selectLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body?.languageId, 'languageId')
  const result = await learningService.selectLanguage({
    userId: req.user.id,
    languageId,
  })

  return res.status(200).json(result)
})

const deleteSelectedLanguage = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.params.languageId, 'languageId')

  const result = await learningService.removeLanguageForUser({
    userId: req.user.id,
    languageId,
    confirmationText: req.body?.confirmationText,
    confirmationLanguageName: req.body?.confirmationLanguageName,
    confirmProgressText: req.body?.confirmProgressText,
  })

  return res.status(200).json(result)
})

module.exports = {
  listLanguages,
  selectLanguage,
  deleteSelectedLanguage,
}
