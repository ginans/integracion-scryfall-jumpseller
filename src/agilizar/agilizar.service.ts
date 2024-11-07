import { Injectable } from '@nestjs/common';
import { CreateAgilizarDto } from './dto/create-agilizar.dto';
import { UpdateAgilizarDto } from './dto/update-agilizar.dto';

@Injectable()
export class AgilizarService {
  create(createAgilizarDto: CreateAgilizarDto) {
    return 'This action adds a new agilizar';
  }

  findAll() {
    return `This action returns all agilizar`;
  }

  findOne(id: number) {
    return `This action returns a #${id} agilizar`;
  }

  update(id: number, updateAgilizarDto: UpdateAgilizarDto) {
    return `This action updates a #${id} agilizar`;
  }

  remove(id: number) {
    return `This action removes a #${id} agilizar`;
  }

}
