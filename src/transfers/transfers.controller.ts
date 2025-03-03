import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransfersDto } from './dto/create-transfers.dto';
import { UpdateTransfersDto } from './dto/update-transfers.dto';
import { QueryTransfersDto } from './dto/query-transfers.dto';

@Controller('transfers')
export class TransfersController {
  constructor(
    private readonly transfersService: TransfersService) {} 

  @Post()
  create(@Body() createTransfersDto: CreateTransfersDto) {
    return this.transfersService.createTransfers(createTransfersDto); 
  }

  @Get()
  findAll(@Query() query: QueryTransfersDto) {
    return this.transfersService.getAllTransfers(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  return this.transfersService.getTransfersById(id); 
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransfersDto: UpdateTransfersDto) {
  return this.transfersService.updateTransfers(id, updateTransfersDto);
}

}
