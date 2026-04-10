const { asyncHandler } = require('@codequest/shared')
const { authService } = require('../services/container')

const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile({ userId: req.user.id })
  return res.status(200).json({ user: profile })
})

module.exports = {
  getMe,
}
