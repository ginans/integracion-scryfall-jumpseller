import { Injectable } from '@nestjs/common';
import { JumpsellerProductResponse } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductResponse.interface';


@Injectable()
export class ProductsService {
    async createProducts(product: JumpsellerProductResponse ) {
        // Mapeo de los datos por pagina
      // const mappedCardData: MappedMagicCard[] = product.map(this.mapCardData);
      // Verificar duplicados por ID y actualizar o insertar
      // for (const x in mappedCardData) {
        // const existingCard = await this.model.findOne({ id: mappedCardData[x].id });
        // if (existingCard) {
        //   await this.model.updateOne({ id: mappedCardData[x].id }, mappedCardData[x]);
        // } else {
        //   await this.model.create(mappedCardData[x]); // Insertar si no existe
        // }
      // }
      // return  mappedCardData;
    }

    //todo mapear respuesta de jumpseller products y crear interface

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: string) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
