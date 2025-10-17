
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Repository } from 'typeorm';
import { UserOrgRole } from '../entities/user-org-role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleInheritance } from '../../../../libs/auth/src';

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(getRepositoryToken(UserOrgRole)) private uorRepo: Repository<UserOrgRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: number, email: string };
    const orgId = Number(request.headers['x-org-id'] || request.query.orgId || request.body?.orgId);
    if (!user) throw new ForbiddenException('Not authenticated');
    if (!orgId) throw new ForbiddenException('Missing org scope');

    const membership = await this.uorRepo.findOne({ where: { user: { id: user.id }, org: { id: orgId } } });
    if (!membership) throw new ForbiddenException('No membership in this org');

    const rolePerms = RoleInheritance[membership.role];
    const ok = required.every((p) => rolePerms.includes(p as any));
    if (!ok) {
      this.logger.warn(`RBAC denied: user=${user.email} role=${membership.role} needs=${required.join(',')}`);
      throw new ForbiddenException('Insufficient permissions');
    }
    request.orgId = orgId;
    request.role = membership.role;
    return true;
  }
}
