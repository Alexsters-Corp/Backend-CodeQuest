const ROLE_USER = 'user'
const ROLE_INSTRUCTOR = 'instructor'
const ROLE_ADMIN = 'admin'

const ROLE_ALIASES = Object.freeze({
  student: ROLE_USER,
  user: ROLE_USER,
  instructor: ROLE_INSTRUCTOR,
  admin: ROLE_ADMIN,
})

const ROLE_PERMISSIONS = Object.freeze({
  [ROLE_USER]: [
    'learning:read_assigned',
    'lesson:complete',
    'code:execute',
    'profile:manage_self',
    'progress:read_self',
  ],
  [ROLE_INSTRUCTOR]: [
    'learning:read_assigned',
    'lesson:complete',
    'code:execute',
    'profile:manage_self',
    'progress:read_self',
    'class:create',
    'class:list_own',
    'class:invite_students',
    'class:assign_path',
    'class:analytics_own',
    'class:mark_required_optional',
  ],
  [ROLE_ADMIN]: [
    'learning:read_assigned',
    'lesson:complete',
    'code:execute',
    'profile:manage_self',
    'progress:read_self',
    'class:create',
    'class:list_own',
    'class:invite_students',
    'class:assign_path',
    'class:analytics_own',
    'class:mark_required_optional',
    'learning_path:crud',
    'catalog:manage',
    'user:moderate',
    'analytics:read_global',
    'feature_flags:manage',
    'admin:manage_admins',
  ],
})

function normalizeRole(value) {
  const raw = String(value || '').trim().toLowerCase()
  return ROLE_ALIASES[raw] || ROLE_USER
}

function getPermissionsForRole(role) {
  const normalized = normalizeRole(role)
  return ROLE_PERMISSIONS[normalized] ? [...ROLE_PERMISSIONS[normalized]] : [...ROLE_PERMISSIONS[ROLE_USER]]
}

function hasPermission(role, permission) {
  return getPermissionsForRole(role).includes(permission)
}

function isAllowedRole(role, allowedRoles) {
  const normalized = normalizeRole(role)
  return allowedRoles.map(normalizeRole).includes(normalized)
}

module.exports = {
  ROLE_USER,
  ROLE_INSTRUCTOR,
  ROLE_ADMIN,
  normalizeRole,
  getPermissionsForRole,
  hasPermission,
  isAllowedRole,
}
