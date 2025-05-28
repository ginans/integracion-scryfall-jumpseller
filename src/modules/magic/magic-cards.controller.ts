import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { MagicCardsService } from './magic-cards.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { MagicCard } from './entities/magic-card.entity';
import { ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MappedMagicCard } from '../jumpseller/interfaces/mapped-magic-card.interface';
import { findByCollectorNumberAndLangDto } from './dto/find-by-collector-number-and-lang.dto';
import { EnumCondition } from './enums/condition.enum';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';
import { GetAllCustomFieldResponse, JumpsellerCustomField } from '../jumpseller/interfaces/jumpselllerCustomFields/getAllCustomFields.interface';

@Controller('magic-cards')
export class MagicCardsController {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly customFieldsService: CustomFieldsMapperService
  ) {}

  @Post("create")
  async create(@Body() cards: ScryfallCardResponse): Promise<MappedMagicCard>  {
    return this.magicCardsService.createMagicCards(cards); 
  }
  
  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<MagicCard>> {
    return this.magicCardsService.findAllCards(query); 
  }
  
  @Get('findAllCardsWithoutFilters')
  async findAllCardsWithoutFilters(): Promise<MagicCard[]> {
    return this.magicCardsService.findAllCardsWithoutFilters();
  }
  
  @Post("findToCreate/:_id")
  async findByCollectorNumberAndLang(
    @Param('_id') _id: string,
    @Body() form: findByCollectorNumberAndLangDto
  ): Promise< ScryfallCardResponse[] | { oracleId: string; message: string }> {
    try {
      return this.magicCardsService.findByCollectorNumberAndLang(form, _id);
    } catch (error) {
      throw error;
    }
  }
  
  @Get('by-id/:id')
  async findOne(@Param('id') _id: string): Promise<MagicCard | null> {
    return this.magicCardsService.findOneCard(_id);
  }
  
  @Get('by-oracle-id/:id')
  async findCardByOracleId(@Param('id') oracleId: string) {
    return this.magicCardsService.findCardByOracleId(oracleId);
  }
  
  @Post("createNewCardAndVariant")
  async createNewCardAndVariant(
    @Body() body: { card: ScryfallCardResponse; condition: EnumCondition }
  ): Promise<MappedMagicCard>  {
    const { card, condition } = body;
    return this.magicCardsService.createNewMagicCardAndVariantToJumpseller(card, condition); 
  }

  @Get('test/getAllCustomFields')
  async getAllCustomFields() : Promise<JumpsellerCustomField[]> {
    return this.customFieldsService.getAllCustomFields();
  }
  
  
  // @Get('test-precio/:oracleId')
  // async testPrecio(@Param('oracleId') oracleId: string) {
  //   return this.magicCardsService.addDollarValueToCard(oracleId);
  // }

  // @Get('calcular-precio/:oracleId')
  // async calcularPrecio(@Param('oracleId') oracleId: string) {
  //   return this.magicCardsService.addDollarValueToCard(oracleId);
  // }
    
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductCardDto: UpdateProductCardDto) {
  //   return this.magicCardsService.update(id, updateProductCardDto);
  // }
}
