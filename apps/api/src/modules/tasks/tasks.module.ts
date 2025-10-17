import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController } from './tasks.controller';

import { Task } from '../../entities/task.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { UserOrgRole } from '../../entities/user-org-role.entity';
import { RbacGuard } from '../../../../../libs/auth/src/rbac.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrgRole, Task, Organization, User])],
  controllers: [TasksController],
  providers: [RbacGuard],
  exports: [RbacGuard],
})
export class TasksModule {}
