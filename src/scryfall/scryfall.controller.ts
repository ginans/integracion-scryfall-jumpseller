import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ScryfallService } from './scryfall.service';
import { CreateScryfallDto } from './dto/create-scryfall.dto';
import { UpdateScryfallDto } from './dto/update-scryfall.dto';

@Controller('scryfall')
export class ScryfallController {
  constructor(private readonly scryfallService: ScryfallService) {}

  @Post()
  create(@Body() createScryfallDto: CreateScryfallDto) {
    return this.scryfallService.create(createScryfallDto);
  }

  @Get()
  findAll() {
    return this.scryfallService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scryfallService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScryfallDto: UpdateScryfallDto) {
    return this.scryfallService.update(+id, updateScryfallDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scryfallService.remove(+id);
  }
}
