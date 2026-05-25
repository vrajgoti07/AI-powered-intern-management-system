/**
 * Permissions Matrix Configuration
 * Maps roles (both database and client-side representations) to allowed action strings.
 */
export const PERMISSIONS: Record<string, string[]> = {
  // Uppercase Database Roles (Prisma Enum UserRole)
  SUPER_ADMIN: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  HR: [
    'assign:intern',
    'view:reports',
    'view:intern',
    'manage:departments',
    'view:audit-logs'
  ],
  DEPARTMENT_HEAD: [
    'update:task',
    'view:intern',
    'assign:head'
  ],
  MENTOR: [
    'update:task',
    'view:intern'
  ],
  INTERN: [
    'view:own-profile',
    'submit:task',
    'request:leave'
  ],

  // Client-side and Title Case mappings as requested
  Admin: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  admin: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  super_admin: [
    'assign:intern',
    'view:reports',
    'update:task',
    'view:intern',
    'manage:departments',
    'view:audit-logs',
    'manage:users'
  ],
  Hr: [
    'assign:intern',
    'view:reports',
    'view:intern',
    'manage:departments',
    'view:audit-logs'
  ],
  hr: [
    'assign:intern',
    'view:reports',
    'view:intern',
    'manage:departments',
    'view:audit-logs'
  ],
  Mentor: [
    'update:task',
    'view:intern'
  ],
  mentor: [
    'update:task',
    'view:intern'
  ],
  Intern: [
    'view:own-profile',
    'submit:task',
    'request:leave'
  ],
  intern: [
    'view:own-profile',
    'submit:task',
    'request:leave'
  ]
};
