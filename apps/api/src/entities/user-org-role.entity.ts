
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity()
@Unique(['user', 'org'])
export class UserOrgRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.memberships, { eager: true })
  user!: User;

  @ManyToOne(() => Organization, { eager: true })
  org!: Organization;

  @Column({ type: 'varchar' })
  role!: 'OWNER' | 'ADMIN' | 'VIEWER';
}
