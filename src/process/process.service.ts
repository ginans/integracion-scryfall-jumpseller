import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

import { Injectable, Logger } from '@nestjs/common';
import { ScryfallService } from 'src/magic/scryfall/scryfall.service';
import { IenumURLLang } from 'src/magic/scryfall/enums/lang.enum';


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
  ) { }


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
      const { data, has_more } = 
        await this
        .scryfallService
        .getScryfallCards(lg, page);
      // agregar colas con data obtenidad 
      for(let row of data){
        await this
        .queuesMagic
        .add(lg,row);
      }
      //detener proceso si has_more es false
      //process = has_more; //descomentar en produccion
      this.logger.warn(`procesando pagina queues-magic ${page}`);
      if(page>1){
        process = false;
      }
      page++;
    } while (process)
  }
}
