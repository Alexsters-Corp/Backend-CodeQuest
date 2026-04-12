const express = require('express')
const featureFlagGuard = require('../middleware/feature-flag.guard')
const requireGatewayUser = require('../middleware/require-gateway-user')
const { listLanguages, selectLanguage, deleteSelectedLanguage } = require('../controllers/languages.controller')
const { startDiagnostic, finishDiagnostic } = require('../controllers/diagnostic.controller')
const { getDashboardOverview } = require('../controllers/dashboard.controller')
const { listModulesByLanguage } = require('../controllers/modules.controller')
const { listPaths, getPathById } = require('../controllers/paths.controller')
const {
	listLessonsByPath,
	getLessonById,
	getLessonSession,
	submitLessonExercise,
} = require('../controllers/lessons.controller')
const { getOverview, completeLesson } = require('../controllers/progress.controller')
const { listPathFavorites, togglePathFavorite } = require('../controllers/favorites.controller')
const { submitSolution } = require('../controllers/submissions.controller')

const router = express.Router()

router.get('/languages', featureFlagGuard('paths'), requireGatewayUser, listLanguages)
router.post('/languages/select', featureFlagGuard('paths'), requireGatewayUser, selectLanguage)
router.delete('/languages/:languageId', featureFlagGuard('paths'), requireGatewayUser, deleteSelectedLanguage)
router.get('/languages/:languageId/modules', featureFlagGuard('paths'), requireGatewayUser, listModulesByLanguage)

router.post('/diagnostic/start', featureFlagGuard('progress'), requireGatewayUser, startDiagnostic)
router.post('/diagnostic/attempts/:attemptId/finish', featureFlagGuard('progress'), requireGatewayUser, finishDiagnostic)

router.get('/dashboard', featureFlagGuard('progress'), requireGatewayUser, getDashboardOverview)

router.get('/paths', featureFlagGuard('paths'), listPaths)
router.get('/paths/:pathId', featureFlagGuard('paths'), getPathById)

router.get('/paths/:pathId/lessons', featureFlagGuard('lessons'), requireGatewayUser, listLessonsByPath)
router.get('/lessons/:lessonId', featureFlagGuard('lessons'), requireGatewayUser, getLessonById)
router.get('/lessons/:lessonId/session', featureFlagGuard('lessons'), requireGatewayUser, getLessonSession)
router.post(
	'/lessons/:lessonId/exercises/:exerciseId/submit',
	featureFlagGuard('progress'),
	requireGatewayUser,
	submitLessonExercise
)

router.get('/progress/overview', featureFlagGuard('progress'), requireGatewayUser, getOverview)
router.post('/progress/lessons/:lessonId/complete', featureFlagGuard('progress'), requireGatewayUser, completeLesson)

router.get('/favorites/paths', featureFlagGuard('favorites'), requireGatewayUser, listPathFavorites)
router.post('/favorites/paths/:pathId/toggle', featureFlagGuard('favorites'), requireGatewayUser, togglePathFavorite)

// Issue #31: Gestionar envíos de soluciones y actualización de progreso
router.post('/submissions', featureFlagGuard('progress'), requireGatewayUser, submitSolution)

module.exports = router
