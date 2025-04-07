import { Injectable, Logger } from '@nestjs/common';
import { MagicCardsService } from 'src/magic/magic-cards.service';
import { IenumURLLang } from 'src/magic/scryfall/enums/lang.enum';


interface Ilist{
  name:string
  active:boolean
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
      private readonly magicCardsService: MagicCardsService,
    ) { }

  
  async initMAGIN(): Promise<void> {
    console.log('This action adds a new jumpseller');
    const listaEndpoiunt:Ilist[] =[{
      "name":"magic",
      "active":true
    }];

    for(let row of listaEndpoiunt){
        if(row.active){
          //procesar cartas magic
          if(row.name=="magic"){
           await this.magicCardsService.procesarCardMagic(IenumURLLang.EN);
          //  await this.magicCardsService.procesarCardMagic(IenumURLLang.ES);
          }
        }
    }
  }

}
