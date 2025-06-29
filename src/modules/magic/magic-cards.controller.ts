import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { MagicCardsService } from './magic-cards.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { MagicCard } from './entities/magic-card.entity';
import { ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MappedMagicCard } from '../jumpseller/interfaces/mapped-magic-card.interface';
import { findByCardByLangDto } from './dto/find-by-collector-number-and-lang.dto';
import { EnumCondition } from './enums/condition.enum';
import { MapCFCollection } from '../jumpseller/interfaces/map-CF-collection.interface';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';

@Controller('magic-cards')
export class MagicCardsController {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
  ) {}

  @Post('create')
  async create(@Body() cards: ScryfallCardResponse): Promise<MagicCard> {
    return this.magicCardsService.createMagicCards(cards);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<MagicCard>> {
    return this.magicCardsService.findAllCards(query);
  }

  @Get('findAllCardsWithoutFilters')
  async findAllCardsWithoutFilters(): Promise<MagicCard[]> {
    return this.magicCardsService.findAllCardsWithoutFilters();
  }

  @Post('findToCreate/:_id')
  async findByCollectorNumberAndLang(
    @Param('_id') _id: string,
    @Body() form: findByCardByLangDto,
  ): Promise<ScryfallCardResponse[] | { oracleId: string; message: string }> {
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
  @Get('sets')
  async getAllSets(): Promise<{
    sets: { setName: string; setPrefix: string }[];
  }> {
    return this.magicCardsService.getAllSets();
  }
  @Get('test')
  async getAllCFValues() {
    //obtener values
    const values = await this.magicCardsService.getAllCFValues();
    //mapear los valores y labels
    const CF: MapCFCollection =
      await this.customFieldsMapperService.mappedCFLabelAndValues(values);
    const {
      setNames,
      colors,
      gameChangers,
      rarities,
      setTypes,
      artists,
      borderColors,
      fullArt,
      textless,
      typeLines,
      subTypeLines,
      cmcs,
      colorIdentities,
      manaCosts,
      powers,
      toughness,
      keywords,
      legalities,
    } = CF;
    //retornar el resultado mapeado para jumpseller
    return this.customFieldsMapperService.mapCreateCustomFieldsRequest([
      setNames,
      colors,
      gameChangers,
      rarities,
      setTypes,
      artists,
      borderColors,
      fullArt,
      textless,
      typeLines,
      subTypeLines,
      cmcs,
      colorIdentities,
      manaCosts,
      powers,
      toughness,
      keywords,
      legalities,
    ]);
  }

  @Post('createNewCardAndVariant')
  async createNewCardAndVariant(
    @Body() body: { card: ScryfallCardResponse; condition: EnumCondition },
  ): Promise<MagicCard> {
    const { card, condition } = body;
    return this.magicCardsService.createNewMagicCardAndVariantToJumpseller(
      card,
      condition,
    );
  }
}
