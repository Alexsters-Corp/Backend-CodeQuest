const express = require('express')
const { authorize } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const {
  createClass,
  listClasses,
  listInvites,
  generateInvite,
  revokeInvite,
  rotateInvite,
  deleteClass,
  updateClass,
  kickStudent,
  assignPath,
  classAnalytics,
} = require('../controllers/instructor.controller')

const router = express.Router()

router.use(requireGatewayUser)
router.use(authorize('instructor', 'admin'))

router.post('/classes', createClass)
router.get('/classes', listClasses)
router.get('/invites', listInvites)
router.post('/classes/:id/invite', generateInvite)
router.patch('/invites/:id/revoke', revokeInvite)
router.post('/classes/:id/rotate-code', rotateInvite)
router.patch('/classes/:id', updateClass)
router.delete('/classes/:id', deleteClass)
router.delete('/classes/:id/students/:studentId', kickStudent)
router.post('/classes/:id/assign-path', assignPath)
router.get('/classes/:id/analytics', classAnalytics)

module.exports = router
