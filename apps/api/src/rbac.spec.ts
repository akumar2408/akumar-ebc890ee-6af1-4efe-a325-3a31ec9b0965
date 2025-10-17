
import { RoleInheritance } from '../../../libs/auth/src';

describe('RBAC', () => {
  it('OWNER should have all perms', () => {
    const perms = RoleInheritance.OWNER;
    expect(perms).toContain('TASK_CREATE');
    expect(perms).toContain('TASK_READ');
    expect(perms).toContain('TASK_UPDATE');
    expect(perms).toContain('TASK_DELETE');
    expect(perms).toContain('AUDIT_VIEW');
  });

  it('VIEWER should only read', () => {
    const perms = RoleInheritance.VIEWER;
    expect(perms).toEqual(['TASK_READ']);
  });
});
