import { PartialType } from '@nestjs/swagger';
import { CreateTransfersDto } from './create-transfers.dto';

export class UpdateTransfersDto extends PartialType(CreateTransfersDto) {}