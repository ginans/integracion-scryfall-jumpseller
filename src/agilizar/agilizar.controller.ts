import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AgilizarService } from './agilizar.service';
import { CreateAgilizarDto } from './dto/create-agilizar.dto';
import { UpdateAgilizarDto } from './dto/update-agilizar.dto';

@Controller('agilizar')
export class AgilizarController {
  constructor(private readonly agilizarService: AgilizarService) {}

  @Post()
  create(@Body() createAgilizarDto: CreateAgilizarDto) {
    return this.agilizarService.create(createAgilizarDto);
  }

  @Get()
  findAll() {
    return this.agilizarService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agilizarService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgilizarDto: UpdateAgilizarDto) {
    return this.agilizarService.update(+id, updateAgilizarDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agilizarService.remove(+id);
  }
}
