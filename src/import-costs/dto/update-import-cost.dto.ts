import { PartialType } from '@nestjs/swagger';
import { CreateImportCostDto } from './create-import-cost.dto';

export class UpdateImportCostDto extends PartialType(CreateImportCostDto) {}
