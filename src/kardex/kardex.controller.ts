import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { KardexService } from './kardex.service';
import { CreateKardexDto } from './dto/create-kardex.dto';
import { UpdateKardexDto } from './dto/update-kardex.dto';

@Controller('kardex')
export class KardexController {
  constructor(
    private readonly kardexService: KardexService) {} 

  @Post()
  create(@Body() createKardexDto: CreateKardexDto) {
    return this.kardexService.createKardex(createKardexDto);
  }

  @Get()
  findAll() {
    return this.kardexService.getAllKardex();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  return this.kardexService.getKardexById(id); 
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKardexDto: UpdateKardexDto) {
  return this.kardexService.updateKardex(id, updateKardexDto);
}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kardexService.deleteKardex(id);
  }
}
