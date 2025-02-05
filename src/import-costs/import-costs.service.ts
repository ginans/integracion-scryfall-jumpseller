import { Injectable } from '@nestjs/common';
import { CreateImportCostDto } from './dto/create-import-cost.dto';
import { UpdateImportCostDto } from './dto/update-import-cost.dto';

@Injectable()
export class ImportCostsService {
  create(createImportCostDto: CreateImportCostDto) {
    return 'This action adds a new importCost';
  }

  findAll() {
    return `This action returns all importCosts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} importCost`;
  }

  update(id: number, updateImportCostDto: UpdateImportCostDto) {
    return `This action updates a #${id} importCost`;
  }

  remove(id: number) {
    return `This action removes a #${id} importCost`;
  }
}
