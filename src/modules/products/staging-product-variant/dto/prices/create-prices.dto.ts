import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { IPriceFromFront } from "../../interfaces/stagingProductVariant.interface";

export class CreatePricesDto implements IPriceFromFront {
   
  @IsOptional()  
  @IsNumber()
  variantPrice: number;

  @IsNotEmpty({
    message: 'variantId no puede estar vacío.',
  })
  @IsNumber()
  variantId: number;

  @IsNotEmpty({
    message: 'productId no puede estar vacío.',
  })
  @IsNumber()
  productId: number;
}
