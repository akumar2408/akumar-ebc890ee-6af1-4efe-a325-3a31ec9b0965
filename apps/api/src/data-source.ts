
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { UserOrgRole } from './entities/user-org-role.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';

const useSqlite = !process.env.TYPEORM_URL;

export const AppDataSource = new DataSource({
  type: useSqlite ? 'sqlite' : 'postgres',
  database: useSqlite ? (process.env.DB_PATH || './data.db') : undefined,
  url: useSqlite ? undefined : process.env.TYPEORM_URL,
  synchronize: true,
  logging: false,
  entities: [User, Organization, Task, UserOrgRole, Permission, Role],
  migrations: [],
  subscribers: [],
});
