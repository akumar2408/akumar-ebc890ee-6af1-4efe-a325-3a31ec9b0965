
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: 'Work' | 'Personal';

  @Column({ default: 'todo' })
  status!: 'todo' | 'in_progress' | 'done';

  @ManyToOne(() => Organization, { eager: true })
  org!: Organization;

  @ManyToOne(() => User, (user) => user.tasks, { eager: true })
  ownerUser!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
