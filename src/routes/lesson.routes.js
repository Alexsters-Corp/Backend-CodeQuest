const express = require('express')
const router = express.Router()
const authGuard = require('../middleware/authGuard')
const lessonAccessGuard = require('../middleware/lessonAccessGuard')
const lessonRateLimit = require('../middleware/lessonRateLimit')
const featureFlagGuard = require('../middleware/featureFlagGuard')
const { getLessonById } = require('../controllers/lessons.controller')
const { getModules, getLessons, submitExercise } = require('../controllers/lesson.controller')

router.get('/modules', authGuard, getModules)
router.get('/module/:moduleId', authGuard, getLessons)
router.get(
	'/:id',
	featureFlagGuard('FEATURE_LEARNING_CORE_ENABLED'),
	lessonAccessGuard,
	lessonRateLimit,
	getLessonById
)
router.post('/exercise/submit', authGuard, submitExercise)

module.exports = router
