const { asyncHandler, parsePositiveInt, parseString } = require('@codequest/shared')
const { learningService } = require('../services/container')

const createClass = asyncHandler(async (req, res) => {
  const payload = await learningService.createInstructorClass({
    instructorUserId: req.user.id,
    name: parseString(req.body?.name, 'name'),
    description: req.body?.description,
  })

  return res.status(201).json(payload)
})

const listClasses = asyncHandler(async (req, res) => {
  const payload = await learningService.listInstructorClasses({
    instructorUserId: req.user.id,
  })

  return res.status(200).json(payload)
})

const generateInvite = asyncHandler(async (req, res) => {
  const classId = parsePositiveInt(req.params.id, 'id')

  const payload = await learningService.generateClassInvite({
    actorUserId: req.user.id,
    actorRole: req.user.role,
    classId,
    inviteEmail: req.body?.email,
    expiresAt: req.body?.expiresAt,
    maxUses: req.body?.maxUses,
  })

  return res.status(201).json(payload)
})

const assignPath = asyncHandler(async (req, res) => {
  const classId = parsePositiveInt(req.params.id, 'id')
  const learningPathId = parsePositiveInt(req.body?.learningPathId, 'learningPathId')

  const payload = await learningService.assignPathToClass({
    actorUserId: req.user.id,
    actorRole: req.user.role,
    classId,
    learningPathId,
    isRequired: req.body?.isRequired !== false,
  })

  return res.status(200).json(payload)
})

const classAnalytics = asyncHandler(async (req, res) => {
  const classId = parsePositiveInt(req.params.id, 'id')

  const payload = await learningService.getClassAnalytics({
    actorUserId: req.user.id,
    actorRole: req.user.role,
    classId,
  })

  return res.status(200).json(payload)
})

module.exports = {
  createClass,
  listClasses,
  generateInvite,
  assignPath,
  classAnalytics,
}
