const express = require('express')
const featureFlagGuard = require('../middleware/feature-flag.guard')
const { getDemoLesson, submitDemoExercise, getDemoPreview } = require('../controllers/demo.controller')
const { executeCode } = require('../controllers/execution.controller')

const router = express.Router()

/**
 * Rutas publicas del demo (HU-025).
 * NO usan requireGatewayUser: aceptan trafico sin autenticacion.
 * El gateway las whitelista en isPublicLearningRoute.
 */

router.get('/lesson', featureFlagGuard('lessons'), getDemoLesson)
router.get('/preview', featureFlagGuard('lessons'), getDemoPreview)

router.post(
  '/lessons/:lessonId/exercises/:exerciseId/submit',
  featureFlagGuard('lessons'),
  submitDemoExercise
)

router.post('/execute', featureFlagGuard('codeExecution'), executeCode)

module.exports = router
