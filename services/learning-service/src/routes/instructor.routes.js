const express = require('express')
const { authorize } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const {
  createClass,
  listClasses,
  generateInvite,
  assignPath,
  classAnalytics,
} = require('../controllers/instructor.controller')

const router = express.Router()

router.use(requireGatewayUser)
router.use(authorize('instructor', 'admin'))

router.post('/classes', createClass)
router.get('/classes', listClasses)
router.post('/classes/:id/invite', generateInvite)
router.post('/classes/:id/assign-path', assignPath)
router.get('/classes/:id/analytics', classAnalytics)

module.exports = router
