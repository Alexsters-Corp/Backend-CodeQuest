const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { authService } = require('../services/container')

const getLeaderboard = asyncHandler(async (req, res) => {
  const scope = req.query.scope === undefined
    ? 'global'
    : parseString(req.query.scope, 'scope', { minLength: 1 })
  
  const timeframe = req.query.timeframe === undefined
    ? 'all_time'
    : parseString(req.query.timeframe, 'timeframe', { minLength: 1 })

  const limit = req.query.limit === undefined
    ? undefined
    : parsePositiveInt(req.query.limit, 'limit')

  const offset = req.query.offset === undefined
    ? 0
    : Math.max(0, Number(req.query.offset) || 0)

  const data = await authService.getLeaderboard({
    actorUserId: req.user.id,
    scope,
    timeframe,
    limit,
    offset,
  })

  return res.status(200).json(data)
})

module.exports = {
  getLeaderboard,
}