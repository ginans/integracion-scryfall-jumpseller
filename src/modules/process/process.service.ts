import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { Injectable, Logger } from '@nestjs/common';
import { ScryfallService } from 'src/modules/magic/submodules/scryfall/scryfall.service';
import { IenumURLLang } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { MagicCard, magicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';


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

  async updateStockQueue(products){
    for(const product of products){
      await this.queuesStock.add('update-stock', product
    )}
  }
  
  async updatePricesQueue(products){
    for(const product of products){
      await this.queuesPrices.add('update-prices', product
    )}
  }


  async initCardMagic(): Promise<void> {
    //ejecutar proceso en ingles
    await this.addQuesMagic(IenumURLLang.EN);
    //ejecutar proceso en español
    //await this.addQuesMagic(IenumURLLang.ES);
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
        await this.queuesMagic.add(lg,row);
       
      }
      this.logger.warn(`procesando pagina queues-magic ${page}`);
      //detener proceso si has_more es false
      //let process = has_more;
      //comentar esto en produccion
      if(page==1){
        process = false;
      }
      page++;
    } while (process)
  }
}
