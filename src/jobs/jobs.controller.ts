import { Body, Controller, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async addJob(@Body() data: any) {
    await this.jobsService.addJob(data);
    return { message: 'Job added successfully' };
  }
}
