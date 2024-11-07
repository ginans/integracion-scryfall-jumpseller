import { PartialType } from '@nestjs/mapped-types';
import { CreateAgilizarDto } from './create-agilizar.dto';

export class UpdateAgilizarDto extends PartialType(CreateAgilizarDto) {}
