const express = require('express')
const router = express.Router()
const authGuard = require('../middleware/authGuard')
const { getModules, getLessons, getLessonContent, submitExercise } = require('../controllers/lesson.controller')

router.get('/modules', authGuard, getModules)
router.get('/module/:moduleId', authGuard, getLessons)
router.get('/:lessonId', authGuard, getLessonContent)
router.post('/exercise/submit', authGuard, submitExercise)

module.exports = router
