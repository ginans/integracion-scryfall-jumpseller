import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { IStockFromFront } from "../../interfaces/stagingProductVariant.interface";

export class CreateStockDto implements IStockFromFront {
   
  @IsOptional()  
  @IsNumber()
  variantStock: number;

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

  @IsNotEmpty({
    message: 'locationId no puede estar vacío.',
  })
  @IsNumber()
  locationId: number;

  @IsOptional()
  @IsBoolean()
  stockUnlimited: boolean;

}
