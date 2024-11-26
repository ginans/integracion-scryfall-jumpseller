import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}
  @Get()
  findAll() {
    return this.clientsService.findAll();
  }
  @Get(':id')
  createClient(@Param('id') id: string) {
    return this.clientsService.registerClient(+id);
  }
}
