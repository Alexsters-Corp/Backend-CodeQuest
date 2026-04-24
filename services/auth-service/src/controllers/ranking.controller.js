const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { authService } = require('../services/container')

const getLeaderboard = asyncHandler(async (req, res) => {
  const scope = req.query.scope === undefined
    ? 'global'
    : parseString(req.query.scope, 'scope', { minLength: 1 })
  const limit = req.query.limit === undefined
    ? undefined
    : parsePositiveInt(req.query.limit, 'limit')

  const data = await authService.getLeaderboard({
    actorUserId: req.user.id,
    scope,
    limit,
  })

  return res.status(200).json(data)
})

module.exports = {
  getLeaderboard,
}