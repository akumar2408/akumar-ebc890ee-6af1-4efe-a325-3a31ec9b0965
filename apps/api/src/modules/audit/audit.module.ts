import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { UserOrgRole } from '../../entities/user-org-role.entity';

// five dot-dots from apps/api/src/modules/audit → libs/auth/src
import { RbacGuard } from '../../../../../libs/auth/src/rbac.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrgRole])],
  controllers: [AuditController],
  providers: [RbacGuard],
})
export class AuditModule {}
