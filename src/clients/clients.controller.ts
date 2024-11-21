import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
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
