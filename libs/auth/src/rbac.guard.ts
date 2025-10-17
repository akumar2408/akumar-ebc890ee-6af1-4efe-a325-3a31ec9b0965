import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  
  // path from libs/auth/src → apps/api/src/entities
  import { UserOrgRole } from '../../../apps/api/src/entities/user-org-role.entity';
  
  export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';
  export type Permission =
    | 'TASK_VIEW'
    | 'TASK_CREATE'
    | 'TASK_UPDATE'
    | 'TASK_DELETE'
    | 'AUDIT_VIEW';
  
  export const RequirePerm = (perm: Permission) =>
    SetMetadata('requiredPermission', perm);
  
  const ROLE_PERMS: Record<Role, Permission[]> = {
    OWNER: ['TASK_VIEW', 'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'AUDIT_VIEW'],
    ADMIN: ['TASK_VIEW', 'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'AUDIT_VIEW'],
    VIEWER: ['TASK_VIEW'],
  };
  
  function getOrgIdFrom(req: any): number {
    const q = (req.query?.orgId ?? '') as string;
    const h = req.headers?.['x-org-id'] as string | undefined;
    const v = Number(q || h || NaN);
    if (!Number.isFinite(v) || v <= 0) {
      throw new BadRequestException('Missing org scope (orgId or X-Org-Id)');
    }
    return v;
  }
  
  function getUserIdFrom(req: any): number {
    const u = req.user;
    const raw = u?.userId ?? u?.sub ?? u?.id;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) throw new ForbiddenException('Unauthorized');
    return v;
  }
  
  @Injectable()
  export class RbacGuard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
      @InjectRepository(UserOrgRole)
      private readonly uorRepo: Repository<UserOrgRole>,
    ) {}
  
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
      const req = ctx.switchToHttp().getRequest();
      const perm = this.reflector.get<Permission>('requiredPermission', ctx.getHandler());
      if (!perm) throw new ForbiddenException('Missing permission metadata');
  
      const userId = getUserIdFrom(req);
      const orgId = getOrgIdFrom(req);
  
      // ✅ Query by relation ids only (no userId/orgId scalar props)
      const membership = await this.uorRepo
        .createQueryBuilder('m')
        .leftJoin('m.user', 'u')
        .leftJoin('m.org', 'o')
        .where('u.id = :userId', { userId })
        .andWhere('o.id = :orgId', { orgId })
        .getOne();
  
      if (!membership) throw new ForbiddenException('No membership in this org');
  
      const role = (membership as any).role as Role;
      const allowed = ROLE_PERMS[role] ?? [];
      if (!allowed.includes(perm)) {
        throw new ForbiddenException('Insufficient permissions');
      }
  
      (req as any).__role = role; // optional: stash for logging
      return true;
    }
  }
  