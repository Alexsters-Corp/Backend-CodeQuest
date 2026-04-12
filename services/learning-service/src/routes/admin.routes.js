const express = require('express')
const { authorize } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const { createLearningPath, getGlobalAnalytics } = require('../controllers/admin.controller')

const router = express.Router()

router.use(requireGatewayUser)
router.use(authorize('admin'))

router.post('/learning-paths', createLearningPath)
router.get('/analytics', getGlobalAnalytics)

module.exports = router
