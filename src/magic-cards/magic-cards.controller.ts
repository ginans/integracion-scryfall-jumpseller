import { Controller, Get, Post, Body, Query, Param} from '@nestjs/common';
import { MagicCardsService } from './magic-cards.service';
import { CreateMagicCardDto } from './dto/create-magic-card.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { MagicCard } from './entities/magic-card.entity';
import { JumpsellerProductRequest } from './interfaces/jumpsellerProductRequest.interface';
import { MappedMagicCard } from './interfaces/mapped-magic-card.interface';

@Controller('magic-cards')
export class MagicCardsController {
  constructor(private readonly magicCardsService: MagicCardsService) {}
  
  @Post("get-and-create")
  async create(@Body() createProductCardDto: CreateMagicCardDto) {
    return this.magicCardsService.fetchAndCreateCards(createProductCardDto);
  }
  
  @Post("create-magic-jumpseller")
  async createJumpsellerProduct(): Promise<JumpsellerProductRequest[]> {
    return this.magicCardsService.createJumpsellerProducts();
  }
  
  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<MagicCard>> {
    return this.magicCardsService.findAllCards(query); 
  }
  
  @Get('by-id/:id')
  async findOne(@Param('id') _id: string): Promise<MagicCard | null> {
    return this.magicCardsService.findOneCard(_id);
  }
    
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductCardDto: UpdateProductCardDto) {
    //   return this.magicCardsService.update(id, updateProductCardDto);
  // }
}
