import { PartialType } from '@nestjs/swagger';
import { CreateJumpsellerDto } from './create-jumpseller.dto';

export class UpdateJumpsellerDto extends PartialType(CreateJumpsellerDto) {}
