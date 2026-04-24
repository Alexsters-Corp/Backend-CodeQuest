const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { authService } = require('../services/container')

const searchUsers = asyncHandler(async (req, res) => {
  const username = parseString(req.query.username || '', 'username', { minLength: 1 })
  const limit = req.query.limit === undefined
    ? undefined
    : parsePositiveInt(req.query.limit, 'limit')

  const data = await authService.searchUsersByUsername({
    actorUserId: req.user.id,
    usernameQuery: username,
    limit,
  })

  return res.status(200).json(data)
})

const followUser = asyncHandler(async (req, res) => {
  const username = parseString(req.params.username, 'username', { minLength: 1 })
  const data = await authService.followUserByUsername({
    actorUserId: req.user.id,
    targetUsername: username,
  })

  return res.status(data.created ? 201 : 200).json({
    message: data.created ? 'Usuario seguido correctamente.' : 'Ya sigues a este usuario.',
    ...data,
  })
})

const unfollowUser = asyncHandler(async (req, res) => {
  const username = parseString(req.params.username, 'username', { minLength: 1 })
  const data = await authService.unfollowUserByUsername({
    actorUserId: req.user.id,
    targetUsername: username,
  })

  return res.status(200).json({
    message: data.removed ? 'Dejaste de seguir al usuario.' : 'No seguias a este usuario.',
    ...data,
  })
})

const getFollowDirectory = asyncHandler(async (req, res) => {
  const limit = req.query.limit === undefined
    ? undefined
    : parsePositiveInt(req.query.limit, 'limit')

  const data = await authService.getFollowDirectory({
    actorUserId: req.user.id,
    limit,
  })

  return res.status(200).json(data)
})

module.exports = {
  searchUsers,
  followUser,
  unfollowUser,
  getFollowDirectory,
}