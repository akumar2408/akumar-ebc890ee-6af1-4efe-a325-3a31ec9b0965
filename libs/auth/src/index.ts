
export const Permissions = {
  TASK_CREATE: 'TASK_CREATE',
  TASK_READ: 'TASK_READ',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  AUDIT_VIEW: 'AUDIT_VIEW',
} as const;
export type Permission = typeof Permissions[keyof typeof Permissions];

export const RoleInheritance: Record<'OWNER' | 'ADMIN' | 'VIEWER', Permission[]> = {
  OWNER: [
    'TASK_CREATE','TASK_READ','TASK_UPDATE','TASK_DELETE','AUDIT_VIEW'
  ],
  ADMIN: [
    'TASK_CREATE','TASK_READ','TASK_UPDATE','TASK_DELETE','AUDIT_VIEW'
  ],
  VIEWER: [
    'TASK_READ'
  ]
};

export function roleHas(permission: Permission, role: 'OWNER' | 'ADMIN' | 'VIEWER') {
  return RoleInheritance[role].includes(permission);
}
