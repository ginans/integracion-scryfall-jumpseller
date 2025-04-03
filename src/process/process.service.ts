import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessService {  
    /*
     1. obteber listado de apis desde la tabla apis
     2. mapear segun data obtenida
     3. guardar o actualizar en la integracion
     4. guardar en jumpseller
     */
  async init(): Promise<void> {
    console.log('This action adds a new jumpseller');
  }

}
