
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { UserOrgRole } from '../entities/user-org-role.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrgsModule } from './orgs/orgs.module';
import { TasksModule } from './tasks/tasks.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { RbacGuard } from '../security/rbac.guard';
import { AuditInterceptor } from '../security/audit.interceptor';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => (await AppDataSource.initialize()).options,
    }),
    TypeOrmModule.forFeature([User, Organization, Task, UserOrgRole, Permission, Role]),
    AuthModule,
    UsersModule,
    OrgsModule,
    TasksModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ]
})
export class AppModule {}
