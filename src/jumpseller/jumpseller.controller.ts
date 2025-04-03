import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JumpsellerService } from './jumpseller.service';
import { CreateJumpsellerDto } from './dto/create-jumpseller.dto';
import { UpdateJumpsellerDto } from './dto/update-jumpseller.dto';

@Controller('jumpseller')
export class JumpsellerController {
  constructor(private readonly jumpsellerService: JumpsellerService) {}

  @Post()
  create(@Body() createJumpsellerDto: CreateJumpsellerDto) {
    return this.jumpsellerService.create(createJumpsellerDto);
  }

  @Get()
  findAll() {
    return this.jumpsellerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jumpsellerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJumpsellerDto: UpdateJumpsellerDto) {
    return this.jumpsellerService.update(+id, updateJumpsellerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jumpsellerService.remove(+id);
  }
}
