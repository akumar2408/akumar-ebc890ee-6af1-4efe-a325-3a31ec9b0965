
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/user.entity';
import { Organization } from '../src/entities/organization.entity';
import { UserOrgRole } from '../src/entities/user-org-role.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  const ds = await AppDataSource.initialize();
  const userRepo = ds.getRepository(User);
  const orgRepo = ds.getRepository(Organization);
  const uorRepo = ds.getRepository(UserOrgRole);

  const root = orgRepo.create({ name: 'TurboVets' });
  await orgRepo.save(root);
  const child = orgRepo.create({ name: 'TurboVets West', parent: root });
  await orgRepo.save(child);

  const owner = userRepo.create({ email: 'owner@demo.com', passwordHash: await bcrypt.hash('password', 10) });
  const admin = userRepo.create({ email: 'admin@demo.com', passwordHash: await bcrypt.hash('password', 10) });
  const viewer = userRepo.create({ email: 'viewer@demo.com', passwordHash: await bcrypt.hash('password', 10) });
  await userRepo.save([owner, admin, viewer]);

  const m1 = uorRepo.create({ user: owner, org: root, role: 'OWNER' });
  const m2 = uorRepo.create({ user: admin, org: child, role: 'ADMIN' });
  const m3 = uorRepo.create({ user: viewer, org: child, role: 'VIEWER' });
  await uorRepo.save([m1, m2, m3]);

  console.log('Seeded orgs and users. Log in with owner@demo.com / password (orgId=root.id=1)');
  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
