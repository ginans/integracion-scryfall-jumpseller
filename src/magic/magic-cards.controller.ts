import { Controller, Get,Query, Param, Post, Body} from '@nestjs/common';
import { MagicCardsService } from './magic-cards.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { MagicCard } from './entities/magic-card.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { CreateMagicCardDto } from './dto/create-magic-card.dto';

@Controller('magic-cards')
export class MagicCardsController {
  constructor(private readonly magicCardsService: MagicCardsService,
  ) {}

  @Post("create")
  async create(@Body() createMagicCardDto: CreateMagicCardDto) {
    return this.magicCardsService.addCard(createMagicCardDto); 
  }
  
  
  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<MagicCard>> {
    return this.magicCardsService.findAllCards(query); 
  }
  
  @Get('findAllCardsWithoutFilters')
  async findAllCardsWithoutFilters(): Promise<MagicCard[]> {
    return this.magicCardsService.findAllCardsWithoutFilters();
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
