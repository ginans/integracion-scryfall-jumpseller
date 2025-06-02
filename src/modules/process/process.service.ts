import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { Injectable, Logger } from '@nestjs/common';
import { ScryfallService } from 'src/modules/magic/submodules/scryfall/scryfall.service';
import { IenumURLLang } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import { RecalculatePricesByUsdDto } from './dto/recalculate-prices-by-usd.dto';
import { RecalculatePricesByBaseDto } from './dto/recalculate-prices-by-base.dto';
import { StagingProductVariantService } from '../staging-product-variant/staging-product-variant.service';
import { UsdPricesService } from '../prices/usd-prices/usd-prices.service';
import { BasePricesService } from '../prices/base-prices/base-prices.service';
import { QueuesRecalculatePricesByUds } from './queues/prices/queues.recalculate-prices-by-usd';
import { QueuesRecalculatePricesByBase } from './queues/prices/queues.recalculate-prices-by-base';
import { IdsJumpseller } from './interfaces/api-prices.interface';

@Injectable()
export class ProcessService {
  /*
   1. obteber listado de apis desde la tabla apis
   2. mapear segun data obtenida
   3. guardar o actualizar en la integracion
   4. guardar en jumpseller
   */
  private readonly logger = new Logger(ProcessService.name);
  constructor(
    private readonly scryfallService: ScryfallService,
    private readonly variantService: StagingProductVariantService,
    private readonly usdPricesService: UsdPricesService,
    private readonly basePricesService: BasePricesService,
    @InjectQueue('queues-magic') private readonly queuesMagic: Queue,
    @InjectQueue('queues-stock') private readonly queuesStock: Queue,
    @InjectQueue('queues-api-prices') private readonly queuesApiPrices: Queue,
    @InjectQueue('update-prices-from-front') private readonly queuesPricesFromFront: Queue,
    @InjectQueue("queues-recalculate-prices-by-usd") private readonly QueuesRecalculatePricesByUsd: Queue,
    @InjectQueue("queues-recalculate-prices-by-base") private readonly QueuesRecalculatePricesByBase: Queue,
  ) { }

  async updateStockQueue(variants: IStockFromFront[]) {
    for(const variant of variants){
      await this.queuesStock.add('update-stock', variant
    )}
  }
  
  //actualizar precios de las variantes desde el front
  async updatePricesFromFrontQueue(variants: IPriceFromFront[]) {
    for(const variant of variants){
      await this.queuesPricesFromFront.add('update-prices-from-front', variant
    )}
  }

  //actualizar precios de las variantes desde el api
  async updateApiPricesQueue(idsJumpseller: IdsJumpseller) {
      const variant = await this.variantService.obtainVariantforPrices(idsJumpseller.variantId, idsJumpseller.productId, undefined, undefined);
      await this.queuesApiPrices.add('queues-api-prices', variant[0]);
  }

  //recalcular precios al cambiar el precio base (rareza)
  async recalculatePricesByBase(basePrices: RecalculatePricesByBaseDto ) {
    //actualizo el precio base

    //devolver un status 200 para que no quede cargando
    const newBasePrice = await this.basePricesService.updateBasePrices(basePrices.id, basePrices.subId, basePrices.price);
    
    //obtengo los variantes
    const obtainedVariants =await this.variantService.obtainVariantforPrices( undefined, undefined, newBasePrice.game, newBasePrice.details.label);

    //las proceso una a una para que se actualicen los precios
    for(const variant of obtainedVariants){
      await this.QueuesRecalculatePricesByBase.add("queues-recalculate-prices-by-base", variant);
    }
  }

  //recalcular precios al cambiar el precio del dolar
  async recalculatePricesByUsd(usdPrices: RecalculatePricesByUsdDto ) {
    //actualizo el precio del dolar
    const newUsdPrice = await this.usdPricesService.updateUsdPriceByGame(usdPrices.gameID, usdPrices.usdPrice);

    //obtengo los variantes
    const obtainedVariants =await this.variantService.obtainVariantforPrices( undefined, undefined, newUsdPrice.game, undefined );

    //las proceso una a una para que se actualicen los precios
    for(const variant of obtainedVariants){
     await this.QueuesRecalculatePricesByUsd.add("queues-recalculate-prices-by-usd", variant);
  }
  }

  async initCardMagic(): Promise<void> {
    //ejecutar proceso en ingles
    await this.addQuesMagic(IenumURLLang.EN);
    //ejecutar proceso en español
    await this.addQuesMagic(IenumURLLang.ES);
  }

  private async addQuesMagic(lg:IenumURLLang): Promise<void> {
    let page = 1;//inicio de paginacion
    let process = true; // Controla la ejecución del bucle
    do {
      // Obtener lista de getScryfallCards
      // const { data, has_more } = await this.scryfallService.getScryfallCards(lg, page, );
      const { data, has_more } = await this.scryfallService.getScryfallCards(lg, page, undefined, "plst");
      // agregar colas con data obtenidad 
      console.log(data.length);
      
      for(let row of data){
        await this.queuesMagic.add(lg, row);
      }
      
      this.logger.warn(`procesando pagina queues-magic ${page}`);
      //detener proceso si has_more es false
      // process = has_more;
      //comentar esto en produccion
      if(page==1){// para las pruebas solo consultamos la primera pagina 
        process = false;
      }
      page++;
    } while (process)
  }
}
