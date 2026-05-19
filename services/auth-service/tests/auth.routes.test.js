const express = require('express')
const request = require('supertest')

describe('Auth Service API', () => {
  let app, mockAuthService, mockRequireCurrentUser

  beforeEach(() => {
    jest.resetModules()

    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      searchUsersByUsername: jest.fn(),
      followUserByUsername: jest.fn(),
      unfollowUserByUsername: jest.fn(),
      getFollowDirectory: jest.fn(),
      getLeaderboard: jest.fn(),
      listUsers: jest.fn(),
      updateUserRole: jest.fn(),
      deleteUser: jest.fn(),
    }

    mockRequireCurrentUser = jest.fn((req, res, next) => {
      req.user = { id: 1, email: 'test@test.com', role: 'user' }
      next()
    })

    jest.doMock('../src/services/container', () => ({
      authService: mockAuthService,
      authGuard: (req, res, next) => {
        req.user = { id: 1, email: 'test@test.com', role: 'user' }
        next()
      },
      pool: { query: jest.fn().mockResolvedValue([[]]) },
      schemaGuardService: { assertReady: jest.fn().mockResolvedValue(undefined) },
    }))

    jest.doMock('../src/middleware/require-current-user', () => mockRequireCurrentUser)

    const authRoutes = require('../src/routes/auth.routes')
    const userRoutes = require('../src/routes/user.routes')
    const adminRoutes = require('../src/routes/admin.routes')
    const socialRoutes = require('../src/routes/social.routes')
    const rankingRoutes = require('../src/routes/ranking.routes')

    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/social', socialRoutes)
    app.use('/api/ranking', rankingRoutes)

    app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500
      res.status(statusCode).json({ message: err.message, code: err.code })
    })
  })

  describe('POST /api/auth/login', () => {
    test('logs in successfully', async () => {
      mockAuthService.login.mockResolvedValue({
        user: { id: 1, email: 'test@test.com', nombre: 'Test' },
        accessToken: 'token',
        refreshToken: 'refresh',
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe('test@test.com')
    })
  })

  describe('POST /api/auth/refresh', () => {
    test('refreshes token', async () => {
      mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-token' })

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'refresh-token' })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBe('new-token')
    })
  })

  describe('POST /api/auth/logout', () => {
    test('logs out successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer access-token')
        .send({ refreshToken: 'refresh-token' })

      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    test('requests password reset', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined)

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' })

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/users/me', () => {
    test('returns current user', async () => {
      mockAuthService.getProfile.mockResolvedValue({ id: 1, email: 'test@test.com', nombre: 'Test' })

      const res = await request(app).get('/api/users/me')

      expect(res.status).toBe(200)
    })
  })

  describe('PUT /api/users/profile', () => {
    test('updates profile', async () => {
      mockAuthService.updateProfile.mockResolvedValue({ id: 1, email: 'updated@test.com', nombre: 'Updated' })

      const res = await request(app)
        .put('/api/users/profile')
        .send({ nombre: 'Updated', email: 'updated@test.com' })

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/social/directory', () => {
    test('returns follow directory', async () => {
      mockAuthService.getFollowDirectory.mockResolvedValue({
        counts: { following: 1, followers: 1 },
        following: [],
        followers: [],
      })

      const res = await request(app).get('/api/social/directory')

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/ranking/leaderboard', () => {
    test('returns global leaderboard', async () => {
      mockAuthService.getLeaderboard.mockResolvedValue({
        scope: 'global',
        counts: { following: 0, followers: 0 },
        entries: [],
      })

      const res = await request(app).get('/api/ranking/leaderboard')

      expect(res.status).toBe(200)
      expect(res.body.scope).toBe('global')
    })
  })

  describe('GET /api/admin/users', () => {
    test('lists users for admin', async () => {
      mockRequireCurrentUser.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@test.com', role: 'admin' }
        next()
      })
      mockAuthService.listUsers.mockResolvedValue({ users: [] })

      const res = await request(app).get('/api/admin/users')

      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/admin/users/:id', () => {
    test('updates user role', async () => {
      mockRequireCurrentUser.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@test.com', role: 'admin' }
        next()
      })
      mockAuthService.updateUserRole.mockResolvedValue({ user: { id: 2, role: 'instructor' } })

      const res = await request(app)
        .patch('/api/admin/users/2')
        .send({ role: 'instructor' })

      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/admin/users/:id', () => {
    test('deletes user', async () => {
      mockRequireCurrentUser.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'admin@test.com', role: 'admin' }
        next()
      })
      mockAuthService.deleteUser.mockResolvedValue({ message: 'Usuario eliminado correctamente.' })

      const res = await request(app).delete('/api/admin/users/2')

      expect(res.status).toBe(200)
    })
  })
})
