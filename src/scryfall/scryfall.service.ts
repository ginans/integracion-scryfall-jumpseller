import { Injectable } from '@nestjs/common';
import { CreateScryfallDto } from './dto/create-scryfall.dto';
import { UpdateScryfallDto } from './dto/update-scryfall.dto';

@Injectable()
export class ScryfallService {
  create(createScryfallDto: CreateScryfallDto) {
    return 'This action adds a new scryfall';
  }

  findAll() {
    return `This action returns all scryfall`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scryfall`;
  }

  update(id: number, updateScryfallDto: UpdateScryfallDto) {
    return `This action updates a #${id} scryfall`;
  }

  remove(id: number) {
    return `This action removes a #${id} scryfall`;
  }
}
