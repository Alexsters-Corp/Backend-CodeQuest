const { asyncHandler } = require('@codequest/shared')
const { learningService } = require('../services/container')

const getDashboardOverview = asyncHandler(async (req, res) => {
  const dashboard = await learningService.getDashboardOverview(req.user.id)
  return res.status(200).json(dashboard)
})

module.exports = {
  getDashboardOverview,
}
