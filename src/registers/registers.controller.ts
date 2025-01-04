import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, Query,
} from '@nestjs/common';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';

@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}
  //
  // @Post()
  // create(@Body() createRegisterDto: CreateRegisterDto) {
  //   return this.registersService.create(createRegisterDto);
  // }

  @Get()
  findAll(@Query() query: string) {
    return this.registersService.findAll(query);
  }
  @Get('algo')
  findAll() {
    return this.registersService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registersService.findOne(+id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateRegisterDto: UpdateRegisterDto,
  // ) {
  //   return this.registersService.update(+id, updateRegisterDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.registersService.remove(+id);
  // }
}
