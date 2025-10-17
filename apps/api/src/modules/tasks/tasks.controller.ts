import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from '../../entities/task.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';

import { AuthGuard } from '@nestjs/passport';
import {
  RbacGuard,
  RequirePerm,
} from '../../../../../libs/auth/src/rbac.guard';

type Status = 'todo' | 'in_progress' | 'done';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RbacGuard)
export class TasksController {
  constructor(
    @InjectRepository(Task) private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /** Get org scope (prefer ?orgId=, fallback to X-Org-Id). */
  private getOrgId(req: Request): number {
    const q = (req.query?.orgId ?? '') as string;
    const h = req.headers['x-org-id'] as string | undefined;
    const v = Number(q || h || NaN);
    if (!Number.isFinite(v) || v <= 0) throw new BadRequestException('orgId is required');
    return v;
  }

  /** Extract the caller id from JWT (supports userId/sub/id). */
  private getUserId(req: Request): number {
    const u = (req as any).user;
    const raw = u?.userId ?? u?.sub ?? u?.id;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) throw new ForbiddenException('Unauthorized');
    return v;
  }

  private normalizeCategory(input: any): 'Work' | 'Personal' | null {
    if (input == null || input === '') return null;
    const s = String(input).toLowerCase();
    if (s === 'work') return 'Work';
    if (s === 'personal') return 'Personal';
    return null;
  }

  private ensureTaskInScope(task: Task, orgId: number) {
    if (!task?.org?.id || task.org.id !== orgId) throw new ForbiddenException('Out of scope');
  }

  // ------------ Endpoints ------------

  @Get()
  @RequirePerm('TASK_VIEW')
  async list(@Req() req: Request) {
    const orgId = this.getOrgId(req);
    const tasks = await this.tasksRepo.find({
      where: { org: { id: orgId } },
      relations: ['org', 'ownerUser'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      category: (t as any).category ?? null,
      status: t.status as Status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      org: { id: t.org.id, name: t.org.name },
      ownerUser: { id: t.ownerUser.id, email: (t.ownerUser as any).email },
    }));
  }

  @Post()
  @RequirePerm('TASK_CREATE')
  async create(
    @Req() req: Request,
    @Body() body: { title: string; description?: string | null; category?: string | null },
  ) {
    const orgId = this.getOrgId(req);
    const userId = this.getUserId(req);

    const title = (body?.title ?? '').trim();
    if (!title) throw new BadRequestException('Title is required');

    const org = await this.orgRepo.findOneBy({ id: orgId });
    if (!org) throw new BadRequestException('Unknown org');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('Unknown user');

    const task = this.tasksRepo.create({
      title,
      description: body?.description ?? null,
      category: this.normalizeCategory(body?.category),
      status: 'todo',
      org,
      ownerUser: user,
    } as any);

    return await this.tasksRepo.save(task);
  }

  @Put(':id')
  @RequirePerm('TASK_UPDATE')
  async update(
    @Req() req: Request,
    @Param('id') idParam: string,
    @Body()
    body: { title?: string; description?: string | null; category?: string | null; status?: Status },
  ) {
    const orgId = this.getOrgId(req);

    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException('Invalid id');

    const task = await this.tasksRepo.findOne({ where: { id }, relations: ['org', 'ownerUser'] });
    if (!task) throw new BadRequestException('Task not found');

    this.ensureTaskInScope(task, orgId);

    if (typeof body.title === 'string') task.title = body.title.trim() || task.title;
    if ('description' in body) task.description = body.description ?? null;
    if ('category' in body) task.category = this.normalizeCategory(body.category) as any;
    if (body.status) task.status = body.status;

    return await this.tasksRepo.save(task);
  }

  @Delete(':id')
  @RequirePerm('TASK_DELETE')
  async remove(@Req() req: Request, @Param('id') idParam: string) {
    const orgId = this.getOrgId(req);

    const id = Number(idParam);
    if (!Number.isFinite(id)) throw new BadRequestException('Invalid id');

    const task = await this.tasksRepo.findOne({ where: { id }, relations: ['org'] });
    if (!task) return { affected: 0 };

    this.ensureTaskInScope(task, orgId);

    const res = await this.tasksRepo.delete({ id });
    return { affected: res.affected ?? 0 };
  }
}
