import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private readonly providerService: ProvidersService) {}
  @Get()
  findAll() {
    return this.providerService.findAll();
  }
}
