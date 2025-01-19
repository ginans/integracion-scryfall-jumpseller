import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImportCostsService } from './import-costs.service';
import { CreateImportCostDto } from './dto/create-import-cost.dto';
import { UpdateImportCostDto } from './dto/update-import-cost.dto';

@Controller('import-costs')
export class ImportCostsController {
  constructor(private readonly importCostsService: ImportCostsService) {}

  @Post()
  create(@Body() createImportCostDto: CreateImportCostDto) {
    return this.importCostsService.create(createImportCostDto);
  }

  @Get()
  findAll() {
    return this.importCostsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importCostsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImportCostDto: UpdateImportCostDto) {
    return this.importCostsService.update(+id, updateImportCostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importCostsService.remove(+id);
  }
}
