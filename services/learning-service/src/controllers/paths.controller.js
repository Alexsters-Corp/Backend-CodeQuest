const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { learningService } = require('../services/container')

function getRequestLocale(req) {
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'es'
}

const listPaths = asyncHandler(async (req, res) => {
  const languageId = req.query.languageId ? parsePositiveInt(req.query.languageId, 'languageId') : undefined
  const difficulty = req.query.difficulty ? parseString(req.query.difficulty, 'difficulty') : undefined

  const paths = await learningService.listPaths({ languageId, difficulty, locale: getRequestLocale(req) })
  return res.status(200).json(paths)
})

const getPathById = asyncHandler(async (req, res) => {
  const pathId = parsePositiveInt(req.params.pathId, 'pathId')
  const path = await learningService.getPathById(pathId, { locale: getRequestLocale(req) })

  return res.status(200).json(path)
})

module.exports = {
  listPaths,
  getPathById,
}
