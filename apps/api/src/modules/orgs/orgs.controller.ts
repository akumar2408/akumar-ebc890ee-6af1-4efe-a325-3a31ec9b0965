
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { RequirePermissions } from '../../security/permissions.decorator';

@Controller('orgs')
export class OrgsController {
  constructor(@InjectRepository(Organization) private repo: Repository<Organization>) {}

  @Get()
  @RequirePermissions('TASK_READ')
  async list() {
    return this.repo.find({ relations: ['parent'] });
  }
}
