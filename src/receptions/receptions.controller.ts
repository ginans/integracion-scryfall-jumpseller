import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ReceptionsService } from './receptions.service';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { UpdateReceptionDto } from './dto/update-reception.dto';
import { QueryReceptionDto } from './dto/query-reception.dto';

@Controller('receptions')
export class ReceptionsController {
  constructor(
    private readonly receptionsService: ReceptionsService) {}

  @Post()
  create(@Body() createReceptionDto: CreateReceptionDto) {
    return this.receptionsService.createReceptions(createReceptionDto); 
  }

  @Get()
  findAll(@Query() query: QueryReceptionDto) {
    return this.receptionsService.getAllReceptions(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receptionsService.getReceptionById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReceptionDto: UpdateReceptionDto) {
    return this.receptionsService.updateReception(id, updateReceptionDto);
  }

}
