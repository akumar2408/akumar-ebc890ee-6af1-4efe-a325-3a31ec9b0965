import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RbacGuard, RequirePerm } from '../../../../../libs/auth/src/rbac.guard';

@Controller('audit-log')
@UseGuards(AuthGuard('jwt'), RbacGuard)
export class AuditController {
  @Get()
  @RequirePerm('AUDIT_VIEW')
  list() {
    // Guard already enforces org scope via ?orgId= / X-Org-Id
    return { message: 'Audit logs are emitted to server console.' };
  }
}
