import { Injectable } from "@nestjs/common";
import { Product, ProductDocument } from "./entities/product.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "winston";
import { MagicCard } from "src/magic/entities/magic-card.entity";
import { MappedMagicCard } from "src/jumpseller/interfaces/mapped-magic-card.interface";
import { Game } from "./enums/games.enum";
import { IsetProduct } from "./interface/product.interface";

@Injectable()
export class ProductsPriceService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    // private readonly jumpsellerService: JumpsellerService,
  ) {
    // this.logger = new Logger(ProductsPriceService.name);
  }

//   private readonly logger: Logger;

  //funcion para guardar en base d datos
  async upsertPriceProduct(game: Game, USDprice: IsetProduct) {
        // buscare productos
        await this.findProducto()
        // update stock
        await this.updateStock()
  }
  private findProducto(){
  }
  private updateStock(){
  }
//agregar historial de actualizaciones de precio

  //agregar funcion para agregar valor del dolar desde el front
//   async addDollarValueToCard(oracleId: string, value: string, isFoil?: boolean): Promise<MappedMagicCard> {
//     try {
//       //verificar que la carta existe en bd
//       const card = await this.model.findOne({ oracleId });
//       if (!card) throw new NotFoundException('Card no encontrada');

//       //cargar valor del dolar en la carta
//       const dollarValue = parseFloat(value);//pasar a formato dolar numero
//       if (isNaN(dollarValue)) throw new BadRequestException('Valor del dolar inválido');

//       //actualizar el valor del dolar en la carta
//       card.prices.valorDolarSeleccionado = dollarValue.toString();//pasar a string

//       //carcular el valor en peso chileno para foil y no foil pero solo si existe foil
//       if (card.foil === isFoil){
//         const usdFoilPrice = card.prices.usdFoil ? parseFloat(card.prices.usdFoil) : 0;// deberia ser 1 para que tome otro valor?
//         const valorFoilCalculado=  card.prices.valorPesoChilenoCalculadoFoil = (usdFoilPrice * dollarValue).toFixed(0);
//         const foilCalculadoToString = valorFoilCalculado.toString();
//         //guardar el valor en la carta
//       }
//       if (card.nonfoil !== isFoil){
//         const usdPrice = card.prices.usd ? parseFloat(card.prices.usd) : 0;
//         const valorCalculado=  card.prices.valorPesoChilenoCalculado = (usdPrice * dollarValue).toFixed(0);
//         const calculadoToString = valorCalculado.toString();
//         //guardar el valor en la carta
//       }
      


//       return await card.save(); // Guardar los cambios en la base de datos
      
//     } catch (error) {
//       this.logger.error(`Error al agregar valor del dolar: ${error.message}`);
//       throw new InternalServerErrorException(`Error al agregar valor del dolar: ${error.message}`);
//     }
// }

//Dentro del modulo productos agregar tabla de nombre ProductConfig con los campos tipo de juego (magic , pokmone ) y valor en peso chileno
// eentregar un endpoint que permita agregar o actualizar dichos campos
// una ves actualizados o creados se debe gatillar funcion que calcula el precio de la carta con el valor ingresar en la tabla productConfig

}