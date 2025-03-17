import { PartialType } from '@nestjs/swagger';
import { CreateScryfallDto } from './create-scryfall.dto';

export class UpdateScryfallDto extends PartialType(CreateScryfallDto) {}
