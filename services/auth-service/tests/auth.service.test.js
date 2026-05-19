const bcrypt = require('bcryptjs')
const AuthService = require('../src/services/auth.service')
const AppError = require('@codequest/shared')

jest.mock('bcryptjs')

describe('AuthService', () => {
  let authService, mockUserRepo, mockAuthTokenRepo, mockTokenBlacklistRepo, mockSchemaGuard, mockEmailService, mockJwtToolkit

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    username: 'testuser',
    role: 'user',
    password_hash: 'hashed',
    is_active: true,
    is_email_verified: false,
    total_xp: 0,
    current_level: 1,
    avatar_url: null,
    country_code: null,
    birth_date: null,
  }

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
      touchLastLogin: jest.fn(),
      updatePasswordById: jest.fn(),
      markEmailVerified: jest.fn(),
      updateProfileById: jest.fn(),
      searchUsersByUsername: jest.fn(),
      followUser: jest.fn(),
      unfollowUser: jest.fn(),
      getFollowCounts: jest.fn(),
      listFollowing: jest.fn(),
      listFollowers: jest.fn(),
      getGlobalLeaderboard: jest.fn(),
      getFollowingLeaderboard: jest.fn(),
      listUsers: jest.fn(),
      updateRoleAndStatus: jest.fn(),
      deleteUserById: jest.fn(),
      createAdminAuditLog: jest.fn(),
      setTokensValidAfter: jest.fn(),
    }

    mockAuthTokenRepo = {
      createToken: jest.fn(),
      findValidToken: jest.fn(),
      markTokenUsed: jest.fn(),
      invalidatePreviousTokens: jest.fn(),
    }

    mockTokenBlacklistRepo = {
      isTokenRevoked: jest.fn(),
      revokeToken: jest.fn(),
    }

    mockSchemaGuard = {
      assertReady: jest.fn().mockResolvedValue(undefined),
    }

    mockEmailService = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
    }

    mockJwtToolkit = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    }

    authService = new AuthService({
      userRepository: mockUserRepo,
      authTokenRepository: mockAuthTokenRepo,
      tokenBlacklistRepository: mockTokenBlacklistRepo,
      schemaGuardService: mockSchemaGuard,
      emailService: mockEmailService,
      jwtToolkit: mockJwtToolkit,
    })

    bcrypt.hash.mockResolvedValue('hashed-password')
    bcrypt.compare.mockResolvedValue(true)
  })

  describe('register', () => {
    test('registers user successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.createUser.mockResolvedValue(mockUser)

      const result = await authService.register({
        nombre: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      })

      expect(result.user.email).toBe('test@test.com')
      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    })

    test('throws when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      await expect(
        authService.register({ nombre: 'Test', email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('El email ya esta registrado.')
    })

    test('throws when username already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(mockUser)
      await expect(
        authService.register({ nombre: 'Test', email: 'new@test.com', username: 'testuser', password: 'pass' })
      ).rejects.toThrow('El nombre de usuario ya esta en uso.')
    })

    test('allows registration without username', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.createUser.mockResolvedValue({ ...mockUser, username: null })

      const result = await authService.register({
        nombre: 'Test',
        email: 'test@test.com',
        password: 'pass',
      })

      expect(result.user.email).toBe('test@test.com')
      expect(mockUserRepo.findByUsername).not.toHaveBeenCalled()
    })

    test('sends verification email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.createUser.mockResolvedValue(mockUser)

      await authService.register({ nombre: 'Test', email: 'test@test.com', password: 'pass' })

      expect(mockEmailService.sendVerifyEmail).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    test('logs in successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      const result = await authService.login({ email: 'test@test.com', password: 'password123' })

      expect(result.user.email).toBe('test@test.com')
      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(mockUserRepo.touchLastLogin).toHaveBeenCalledWith(1)
    })

    test('throws when user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      await expect(
        authService.login({ email: 'unknown@test.com', password: 'pass' })
      ).rejects.toThrow('Credenciales incorrectas.')
    })

    test('throws when account is disabled', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, is_active: false })
      await expect(
        authService.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Tu cuenta se encuentra desactivada.')
    })

    test('throws when password is incorrect', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(false)
      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow('Credenciales incorrectas.')
    })
  })

  describe('refresh', () => {
    test('refreshes token successfully', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, iat: 1000 })
      mockTokenBlacklistRepo.isTokenRevoked.mockResolvedValue(false)
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const result = await authService.refresh({ refreshToken: 'refresh-token' })

      expect(result.accessToken).toBe('access-token')
    })

    test('throws when refresh token is invalid', async () => {
      mockJwtToolkit.verifyRefreshToken.mockImplementation(() => { throw new Error('invalid') })
      await expect(
        authService.refresh({ refreshToken: 'bad-token' })
      ).rejects.toThrow('Refresh token invalido o expirado.')
    })

    test('throws when refresh token is revoked', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, iat: 1000 })
      mockTokenBlacklistRepo.isTokenRevoked.mockResolvedValue(true)
      await expect(
        authService.refresh({ refreshToken: 'revoked-token' })
      ).rejects.toThrow('Refresh token revocado.')
    })

    test('throws when user not found', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 999, iat: 1000 })
      mockTokenBlacklistRepo.isTokenRevoked.mockResolvedValue(false)
      mockUserRepo.findById.mockResolvedValue(null)
      await expect(
        authService.refresh({ refreshToken: 'refresh-token' })
      ).rejects.toThrow('Usuario no encontrado.')
    })

    test('throws when account is disabled', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, iat: 1000 })
      mockTokenBlacklistRepo.isTokenRevoked.mockResolvedValue(false)
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, is_active: false })
      await expect(
        authService.refresh({ refreshToken: 'refresh-token' })
      ).rejects.toThrow('Tu cuenta se encuentra desactivada.')
    })

    test('throws when tokens_valid_after is after token issued', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, iat: 1000 })
      mockTokenBlacklistRepo.isTokenRevoked.mockResolvedValue(false)
      mockUserRepo.findById.mockResolvedValue({
        ...mockUser,
        tokens_valid_after: new Date(Date.now() + 10000).toISOString(),
      })
      await expect(
        authService.refresh({ refreshToken: 'refresh-token' })
      ).rejects.toThrow('Sesion invalidada.')
    })
  })

  describe('logout', () => {
    let mockReq

    beforeEach(() => {
      mockReq = { headers: { authorization: 'Bearer access-token' } }
      mockJwtToolkit.verifyAccessToken.mockReturnValue({ id: 1, exp: Math.floor(Date.now() / 1000) + 3600, jti: 'jti-123' })
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, exp: Math.floor(Date.now() / 1000) + 86400, jti: 'jti-456' })
    })

    test('revokes access token', async () => {
      await authService.logout({ req: mockReq, refreshToken: 'refresh-token' })

      expect(mockTokenBlacklistRepo.revokeToken).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'access-token', userId: 1 })
      )
    })

    test('revokes refresh token when provided', async () => {
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, exp: Math.floor(Date.now() / 1000) + 86400, jti: 'jti-456' })
      await authService.logout({ req: mockReq, refreshToken: 'refresh-token' })
      expect(mockTokenBlacklistRepo.revokeToken).toHaveBeenCalledTimes(2)
    })

    test('handles expired access token gracefully', async () => {
      const expiredError = new Error('expired')
      expiredError.name = 'TokenExpiredError'
      mockJwtToolkit.verifyAccessToken.mockImplementation(() => { throw expiredError })
      mockJwtToolkit.verifyRefreshToken.mockReturnValue({ id: 1, exp: Math.floor(Date.now() / 1000) + 86400, jti: 'jti-456' })
      await authService.logout({ req: mockReq, refreshToken: 'refresh-token' })
      expect(mockTokenBlacklistRepo.revokeToken).toHaveBeenCalledTimes(1)
    })

    test('throws when no token in request', async () => {
      mockReq.headers.authorization = null
      await expect(
        authService.logout({ req: mockReq })
      ).rejects.toThrow('Token de autenticacion requerido.')
    })
  })

  describe('forgotPassword', () => {
    test('sends reset email when user exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      await authService.forgotPassword({ email: 'test@test.com' })

      expect(mockAuthTokenRepo.invalidatePreviousTokens).toHaveBeenCalled()
      expect(mockAuthTokenRepo.createToken).toHaveBeenCalled()
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalled()
    })

    test('silently succeeds when user does not exist', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)

      await expect(
        authService.forgotPassword({ email: 'unknown@test.com' })
      ).resolves.toBeUndefined()
    })
  })

  describe('resetPassword', () => {
    test('resets password successfully', async () => {
      mockAuthTokenRepo.findValidToken.mockResolvedValue({ id: 1, user_id: 1 })

      await authService.resetPassword({ rawToken: 'raw-token', newPassword: 'newpass' })

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10)
      expect(mockUserRepo.updatePasswordById).toHaveBeenCalled()
      expect(mockAuthTokenRepo.markTokenUsed).toHaveBeenCalled()
      expect(mockUserRepo.setTokensValidAfter).toHaveBeenCalled()
    })

    test('throws when token is invalid', async () => {
      mockAuthTokenRepo.findValidToken.mockResolvedValue(null)
      await expect(
        authService.resetPassword({ rawToken: 'bad-token', newPassword: 'newpass' })
      ).rejects.toThrow('El token de recuperacion es invalido o expiro.')
    })
  })

  describe('verifyEmail', () => {
    test('verifies email successfully', async () => {
      mockAuthTokenRepo.findValidToken.mockResolvedValue({ id: 1, user_id: 1 })
      await authService.verifyEmail({ rawToken: 'raw-token' })
      expect(mockUserRepo.markEmailVerified).toHaveBeenCalled()
      expect(mockAuthTokenRepo.markTokenUsed).toHaveBeenCalled()
    })

    test('throws when token is invalid', async () => {
      mockAuthTokenRepo.findValidToken.mockResolvedValue(null)
      await expect(
        authService.verifyEmail({ rawToken: 'bad-token' })
      ).rejects.toThrow('Token de verificacion invalido o expirado.')
    })
  })

  describe('getProfile', () => {
    test('returns user profile', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      const result = await authService.getProfile({ userId: 1 })
      expect(result.email).toBe('test@test.com')
      expect(result.nombre).toBe('Test User')
    })

    test('throws when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null)
      await expect(
        authService.getProfile({ userId: 999 })
      ).rejects.toThrow('Usuario no encontrado.')
    })
  })

  describe('updateProfile', () => {
    test('updates profile successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.updateProfileById.mockResolvedValue(mockUser)
      const result = await authService.updateProfile({
        userId: 1,
        nombre: 'New Name',
        email: 'test@test.com',
      })
      expect(result.nombre).toBe('Test User')
    })

    test('throws when email is taken by another user', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, id: 2 })
      await expect(
        authService.updateProfile({ userId: 1, email: 'other@test.com' })
      ).rejects.toThrow('El email ya esta registrado.')
    })

    test('allows same email for current user', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      mockUserRepo.updateProfileById.mockResolvedValue(mockUser)
      await expect(
        authService.updateProfile({ userId: 1, email: 'test@test.com' })
      ).resolves.toBeDefined()
    })
  })

  describe('followUserByUsername', () => {
    test('follows user successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByUsername.mockResolvedValue({ ...mockUser, id: 2, username: 'target' })
      mockUserRepo.followUser.mockResolvedValue(true)
      mockUserRepo.getFollowCounts.mockResolvedValue({ following: 1, followers: 0 })
      const result = await authService.followUserByUsername({ actorUserId: 1, targetUsername: 'target' })
      expect(result.created).toBe(true)
      expect(result.user.isFollowing).toBe(true)
    })

    test('throws when following self', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByUsername.mockResolvedValue(mockUser)
      await expect(
        authService.followUserByUsername({ actorUserId: 1, targetUsername: 'testuser' })
      ).rejects.toThrow('No puedes seguirte a ti mismo.')
    })

    test('throws when target not found', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByUsername.mockResolvedValue(null)
      await expect(
        authService.followUserByUsername({ actorUserId: 1, targetUsername: 'unknown' })
      ).rejects.toThrow('El usuario no existe')
    })
  })

  describe('unfollowUserByUsername', () => {
    test('unfollows user successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.findByUsername.mockResolvedValue({ ...mockUser, id: 2, username: 'target' })
      mockUserRepo.unfollowUser.mockResolvedValue(true)
      mockUserRepo.getFollowCounts.mockResolvedValue({ following: 0, followers: 0 })
      const result = await authService.unfollowUserByUsername({ actorUserId: 1, targetUsername: 'target' })
      expect(result.removed).toBe(true)
      expect(result.user.isFollowing).toBe(false)
    })
  })

  describe('getLeaderboard', () => {
    test('returns global leaderboard', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.getGlobalLeaderboard.mockResolvedValue([])
      mockUserRepo.getFollowCounts.mockResolvedValue({ following: 0, followers: 0 })
      const result = await authService.getLeaderboard({ actorUserId: 1, scope: 'global', limit: 10 })
      expect(result.scope).toBe('global')
      expect(result.entries).toEqual([])
    })

    test('returns following leaderboard', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.getFollowingLeaderboard.mockResolvedValue([])
      mockUserRepo.getFollowCounts.mockResolvedValue({ following: 0, followers: 0 })
      const result = await authService.getLeaderboard({ actorUserId: 1, scope: 'following', limit: 10 })
      expect(result.scope).toBe('following')
    })

    test('throws for invalid scope', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      await expect(
        authService.getLeaderboard({ actorUserId: 1, scope: 'invalid' })
      ).rejects.toThrow('scope invalido')
    })
  })

  describe('listUsers', () => {
    const adminUser = { ...mockUser, role: 'admin' }

    test('lists users for admin', async () => {
      mockUserRepo.findById.mockResolvedValue(adminUser)
      mockUserRepo.listUsers.mockResolvedValue([mockUser])
      const result = await authService.listUsers({ actorUserId: 1, limit: 10, offset: 0 })
      expect(result.users).toHaveLength(1)
      expect(result.users[0].email).toBe('test@test.com')
    })

    test('throws for non-admin', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      await expect(
        authService.listUsers({ actorUserId: 1 })
      ).rejects.toThrow('Acceso denegado')
    })
  })

  describe('updateUserRole', () => {
    const adminUser = { ...mockUser, role: 'admin' }

    test('updates user role', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(adminUser)
      mockUserRepo.findById.mockResolvedValueOnce(mockUser)
      mockUserRepo.updateRoleAndStatus.mockResolvedValue({ ...mockUser, role: 'instructor' })
      const result = await authService.updateUserRole({ actorUserId: 1, targetUserId: 2, role: 'instructor' })
      expect(result.user.role).toBe('instructor')
    })

    test('throws for non-admin', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      await expect(
        authService.updateUserRole({ actorUserId: 1, targetUserId: 2, role: 'admin' })
      ).rejects.toThrow('Acceso denegado')
    })

    test('throws for invalid role', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(adminUser)
      mockUserRepo.findById.mockResolvedValueOnce(mockUser)
      await expect(
        authService.updateUserRole({ actorUserId: 1, targetUserId: 2, role: 'invalid' })
      ).rejects.toThrow('role invalido')
    })
  })

  describe('deleteUser', () => {
    const adminUser = { ...mockUser, role: 'admin' }

    test('deletes user successfully', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(adminUser)
      mockUserRepo.findById.mockResolvedValueOnce({ ...mockUser, id: 2 })
      mockUserRepo.deleteUserById.mockResolvedValue(true)
      const result = await authService.deleteUser({ actorUserId: 1, targetUserId: 2 })
      expect(result.message).toBe('Usuario eliminado correctamente.')
    })

    test('throws when admin tries to delete self', async () => {
      mockUserRepo.findById.mockResolvedValue(adminUser)
      await expect(
        authService.deleteUser({ actorUserId: 1, targetUserId: 1 })
      ).rejects.toThrow('No puedes eliminar tu propia cuenta.')
    })

    test('throws for non-admin', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser)
      await expect(
        authService.deleteUser({ actorUserId: 1, targetUserId: 2 })
      ).rejects.toThrow('Acceso denegado')
    })
  })
})
