import { Injectable } from '@nestjs/common';
import { CreateJumpsellerDto } from './dto/create-jumpseller.dto';
import { UpdateJumpsellerDto } from './dto/update-jumpseller.dto';

@Injectable()
export class JumpsellerService {  
  create(createJumpsellerDto: CreateJumpsellerDto) {
    return 'This action adds a new jumpseller';
  }

  findAll() {
    return `This action returns all jumpseller`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jumpseller`;
  }

  update(id: number, updateJumpsellerDto: UpdateJumpsellerDto) {
    return `This action updates a #${id} jumpseller`;
  }

  remove(id: number) {
    return `This action removes a #${id} jumpseller`;
  }
}
