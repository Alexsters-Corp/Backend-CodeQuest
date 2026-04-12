const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { authService } = require('../services/container')

const listUsers = asyncHandler(async (req, res) => {
  const role = req.query.role ? parseString(req.query.role, 'role') : undefined
  const status = req.query.status ? parseString(req.query.status, 'status') : undefined
  const search = req.query.search ? String(req.query.search).trim() : undefined
  const limit = req.query.limit ? Number(req.query.limit) : undefined
  const offset = req.query.offset ? Number(req.query.offset) : undefined

  const payload = await authService.listUsers({
    actorUserId: req.user.id,
    role,
    status,
    search,
    limit,
    offset,
  })

  return res.status(200).json(payload)
})

const updateUser = asyncHandler(async (req, res) => {
  const targetUserId = parsePositiveInt(req.params.id, 'id')
  const role = req.body.role !== undefined ? parseString(req.body.role, 'role') : undefined

  const payload = await authService.updateUserRole({
    actorUserId: req.user.id,
    targetUserId,
    role,
    isActive: req.body.isActive,
  })

  return res.status(200).json({
    message: 'Usuario actualizado correctamente.',
    ...payload,
  })
})

module.exports = {
  listUsers,
  updateUser,
}
