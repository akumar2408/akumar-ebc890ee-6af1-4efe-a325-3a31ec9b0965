
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserOrgRole } from './user-org-role.entity';
import { Task } from './task.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @OneToMany(() => UserOrgRole, (uor) => uor.user)
  memberships!: UserOrgRole[];

  @OneToMany(() => Task, (task) => task.ownerUser)
  tasks!: Task[];
}
