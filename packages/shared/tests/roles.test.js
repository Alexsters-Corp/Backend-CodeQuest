const {
  ROLE_USER,
  ROLE_INSTRUCTOR,
  ROLE_ADMIN,
  normalizeRole,
  getPermissionsForRole,
  hasPermission,
  isAllowedRole,
} = require('../src/security/roles')

describe('role constants', () => {
  test('ROLE_USER is user', () => {
    expect(ROLE_USER).toBe('user')
  })

  test('ROLE_INSTRUCTOR is instructor', () => {
    expect(ROLE_INSTRUCTOR).toBe('instructor')
  })

  test('ROLE_ADMIN is admin', () => {
    expect(ROLE_ADMIN).toBe('admin')
  })
})

describe('normalizeRole', () => {
  test('normalizes student to user', () => {
    expect(normalizeRole('student')).toBe('user')
  })

  test('normalizes user to user', () => {
    expect(normalizeRole('user')).toBe('user')
  })

  test('normalizes instructor to instructor', () => {
    expect(normalizeRole('instructor')).toBe('instructor')
  })

  test('normalizes admin to admin', () => {
    expect(normalizeRole('admin')).toBe('admin')
  })

  test('handles uppercase', () => {
    expect(normalizeRole('ADMIN')).toBe('admin')
    expect(normalizeRole('Student')).toBe('user')
  })

  test('handles whitespace', () => {
    expect(normalizeRole('  admin  ')).toBe('admin')
  })

  test('defaults to user for unknown roles', () => {
    expect(normalizeRole('unknown')).toBe('user')
    expect(normalizeRole('')).toBe('user')
  })

  test('handles null', () => {
    expect(normalizeRole(null)).toBe('user')
  })

  test('handles undefined', () => {
    expect(normalizeRole(undefined)).toBe('user')
  })

  test('handles numeric input', () => {
    expect(normalizeRole(123)).toBe('user')
  })
})

describe('getPermissionsForRole', () => {
  test('returns permissions for user', () => {
    const perms = getPermissionsForRole('user')
    expect(perms).toContain('learning:read_assigned')
    expect(perms).toContain('lesson:complete')
    expect(perms).toContain('code:execute')
    expect(perms).toContain('profile:manage_self')
    expect(perms).toContain('progress:read_self')
  })

  test('returns permissions for instructor', () => {
    const perms = getPermissionsForRole('instructor')
    expect(perms).toContain('class:create')
    expect(perms).toContain('class:list_own')
    expect(perms).toContain('class:invite_students')
    expect(perms).toContain('learning:read_assigned')
  })

  test('returns permissions for admin', () => {
    const perms = getPermissionsForRole('admin')
    expect(perms).toContain('learning_path:crud')
    expect(perms).toContain('catalog:manage')
    expect(perms).toContain('user:moderate')
    expect(perms).toContain('analytics:read_global')
    expect(perms).toContain('feature_flags:manage')
    expect(perms).toContain('admin:manage_admins')
  })

  test('instructor has all user permissions', () => {
    const userPerms = getPermissionsForRole('user')
    const instructorPerms = getPermissionsForRole('instructor')
    userPerms.forEach((p) => {
      expect(instructorPerms).toContain(p)
    })
  })

  test('admin has all instructor permissions', () => {
    const instructorPerms = getPermissionsForRole('instructor')
    const adminPerms = getPermissionsForRole('admin')
    instructorPerms.forEach((p) => {
      expect(adminPerms).toContain(p)
    })
  })

  test('returns copy of array', () => {
    const perms1 = getPermissionsForRole('user')
    const perms2 = getPermissionsForRole('user')
    expect(perms1).not.toBe(perms2)
  })

  test('normalizes role before lookup', () => {
    const perms = getPermissionsForRole('ADMIN')
    expect(perms).toContain('learning_path:crud')
  })

  test('unknown role returns user permissions', () => {
    const perms = getPermissionsForRole('unknown')
    expect(perms).toContain('learning:read_assigned')
  })
})

describe('hasPermission', () => {
  test('user has learning:read_assigned', () => {
    expect(hasPermission('user', 'learning:read_assigned')).toBe(true)
  })

  test('user does not have class:create', () => {
    expect(hasPermission('user', 'class:create')).toBe(false)
  })

  test('instructor has class:create', () => {
    expect(hasPermission('instructor', 'class:create')).toBe(true)
  })

  test('instructor does not have learning_path:crud', () => {
    expect(hasPermission('instructor', 'learning_path:crud')).toBe(false)
  })

  test('admin has learning_path:crud', () => {
    expect(hasPermission('admin', 'learning_path:crud')).toBe(true)
  })

  test('admin has user:moderate', () => {
    expect(hasPermission('admin', 'user:moderate')).toBe(true)
  })

  test('normalizes role', () => {
    expect(hasPermission('ADMIN', 'user:moderate')).toBe(true)
  })

  test('student alias works', () => {
    expect(hasPermission('student', 'learning:read_assigned')).toBe(true)
    expect(hasPermission('student', 'class:create')).toBe(false)
  })
})

describe('isAllowedRole', () => {
  test('user is allowed for user', () => {
    expect(isAllowedRole('user', ['user'])).toBe(true)
  })

  test('admin is allowed for admin', () => {
    expect(isAllowedRole('admin', ['admin'])).toBe(true)
  })

  test('user is not allowed for admin', () => {
    expect(isAllowedRole('user', ['admin'])).toBe(false)
  })

  test('admin is allowed for user or admin', () => {
    expect(isAllowedRole('admin', ['user', 'admin'])).toBe(true)
  })

  test('normalizes roles', () => {
    expect(isAllowedRole('ADMIN', ['admin'])).toBe(true)
    expect(isAllowedRole('admin', ['ADMIN'])).toBe(true)
  })

  test('student alias works', () => {
    expect(isAllowedRole('student', ['user'])).toBe(true)
  })

  test('multiple allowed roles', () => {
    expect(isAllowedRole('instructor', ['user', 'instructor', 'admin'])).toBe(true)
  })

  test('empty allowed roles', () => {
    expect(isAllowedRole('user', [])).toBe(false)
  })
})
