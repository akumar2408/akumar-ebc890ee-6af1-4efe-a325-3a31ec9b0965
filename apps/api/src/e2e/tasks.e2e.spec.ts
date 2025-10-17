// apps/api/src/e2e/tasks.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

// --- Adjust these entity imports if paths differ in your repo ---
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { UserOrgRole } from '../entities/user-org-role.entity';

// --- These Module paths reflect your structure (tweak if needed) ---
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { OrgsModule } from '../modules/orgs/orgs.module';
import { TasksModule } from '../modules/tasks/tasks.module';
import { AuditModule } from '../modules/audit/audit.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('RBAC e2e (SQLite :memory:)', () => {
  let app: INestApplication;
  let users: Repository<User>;
  let orgs: Repository<Organization>;
  let roles: Repository<UserOrgRole>;
  let tasks: Repository<Task>;

  let ROOT_ORG: number;
  let CHILD_ORG: number;

  let ownerJWT: string;
  let adminJWT: string;
  let viewerJWT: string;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      imports: [
        // In-memory sqlite just for tests
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, Organization, Task, UserOrgRole],
          logging: false,
        }),
        TypeOrmModule.forFeature([User, Organization, Task, UserOrgRole]),
        UsersModule,
        OrgsModule,
        TasksModule,
        AuditModule,
        AuthModule,
      ],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    users = app.get(getRepositoryToken(User));
    orgs = app.get(getRepositoryToken(Organization));
    roles = app.get(getRepositoryToken(UserOrgRole));
    tasks = app.get(getRepositoryToken(Task));

    // Seed orgs (root -> child)
    const root = await orgs.save(orgs.create({ name: 'TurboVets' }));
    const child = await orgs.save(orgs.create({ name: 'TurboVets West', parent: root }));
    ROOT_ORG = root.id!;
    CHILD_ORG = child.id!;

    // Seed users
    const owner = await users.save(users.create({
      email: 'owner@demo.com',
      passwordHash: await bcrypt.hash('password', 10),
    }));
    const admin = await users.save(users.create({
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('password', 10),
    }));
    const viewer = await users.save(users.create({
      email: 'viewer@demo.com',
      passwordHash: await bcrypt.hash('password', 10),
    }));

    // Seed memberships
    await roles.save(roles.create({ user: owner, org: root, role: 'OWNER' }));
    await roles.save(roles.create({ user: admin, org: child, role: 'ADMIN' }));
    await roles.save(roles.create({ user: viewer, org: child, role: 'VIEWER' }));

    // Login to obtain JWTs
    const mkLogin = (email: string) =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password' })
        .expect(201)
        .then(r => r.body.accessToken as string);

    ownerJWT = await mkLogin('owner@demo.com');
    adminJWT = await mkLogin('admin@demo.com');
    viewerJWT = await mkLogin('viewer@demo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 unauthenticated GET /tasks', async () => {
    await request(app.getHttpServer())
      .get(`/tasks?orgId=${ROOT_ORG}`)
      .expect(401);
  });

  it('Owner/Admin can create in-scope; Viewer cannot', async () => {
    // Owner create in root => 201
    await request(app.getHttpServer())
      .post(`/tasks?orgId=${ROOT_ORG}`)
      .set('Authorization', `Bearer ${ownerJWT}`)
      .send({ title: 'Owner task A', category: 'work' })
      .expect(201);

    // Admin create in child => 201
    await request(app.getHttpServer())
      .post(`/tasks?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${adminJWT}`)
      .send({ title: 'Admin task B', category: 'personal' })
      .expect(201);

    // Viewer create => 403
    await request(app.getHttpServer())
      .post(`/tasks?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${viewerJWT}`)
      .send({ title: 'should-fail' })
      .expect(403);
  });

  it('Owner cross-org update is 403 (out of scope); Admin in-scope update is 200', async () => {
    // Create a child-org task owned by admin
    const created = await request(app.getHttpServer())
      .post(`/tasks?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${adminJWT}`)
      .send({ title: 'to-update', category: 'work' })
      .expect(201)
      .then(r => r.body);

    // Admin updates in-scope => 200
    await request(app.getHttpServer())
      .put(`/tasks/${created.id}?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${adminJWT}`)
      .send({ status: 'in_progress' })
      .expect(200);

    // Owner tries to update in child from root scope => 403
    await request(app.getHttpServer())
      .put(`/tasks/${created.id}?orgId=${ROOT_ORG}`)
      .set('Authorization', `Bearer ${ownerJWT}`)
      .send({ status: 'done' })
      .expect(403);
  });

  it('Viewer cannot delete; Owner/Admin can delete in-scope', async () => {
    const created = await request(app.getHttpServer())
      .post(`/tasks?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${adminJWT}`)
      .send({ title: 'to-delete', category: 'work' })
      .expect(201)
      .then(r => r.body);

    // Viewer delete => 403
    await request(app.getHttpServer())
      .delete(`/tasks/${created.id}?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${viewerJWT}`)
      .expect(403);

    // Admin delete => 200
    await request(app.getHttpServer())
      .delete(`/tasks/${created.id}?orgId=${CHILD_ORG}`)
      .set('Authorization', `Bearer ${adminJWT}`)
      .expect(200);
  });

  it('Audit log: owner/admin 200 with X-Org-Id, viewer 403', async () => {
    await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${ownerJWT}`)
      .set('X-Org-Id', String(ROOT_ORG))
      .expect(200);

    await request(app.getHttpServer())
      .get('/audit-log')
      .set('Authorization', `Bearer ${viewerJWT}`)
      .set('X-Org-Id', String(CHILD_ORG))
      .expect(403);
  });
});
