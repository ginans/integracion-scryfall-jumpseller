import { PartialType } from '@nestjs/swagger';
import { CreateReceptionDto } from './create-reception.dto';

export class UpdateReceptionDto extends PartialType(CreateReceptionDto) {}
