import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { Injectable, Logger } from '@nestjs/common';
import { ScryfallService } from 'src/modules/magic/submodules/scryfall/scryfall.service';
import { IenumURLLang } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../products/staging-product-variant/interfaces/stagingProductVariant.interface';


interface Ilist {
  name: string
  active: boolean
}
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
    @InjectQueue('queues-magic') private readonly queuesMagic: Queue,
    @InjectQueue('queues-stock') private readonly queuesStock: Queue,
    @InjectQueue('queues-prices') private readonly queuesPrices: Queue,
  ) { }

  async updateStockQueue(variants: IStockFromFront[]) {
    for(const variant of variants){
      await this.queuesStock.add('update-stock', variant
    )}
  }
  
  async updatePricesQueue(variants: IPriceFromFront[]) {
    for(const variant of variants){
      await this.queuesPrices.add('update-prices', variant
    )}
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
      const { data, has_more } = await this.scryfallService.getScryfallCards(lg, page);
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
