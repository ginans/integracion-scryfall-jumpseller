import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString, IsDate } from 'class-validator';

export class CreateKardexDto {
  @Expose({ name: 'id_transmission' })
  @IsNumber()
  readonly idTransmission: number; // Identificador único del movimiento

  @Expose({ name: 'initial_erp_reference' })
  @IsString()
  readonly initialErpReference: string; // Referencia/id de la bodega en su ERP (inicial)

  @Expose({ name: 'final_erp_reference' })
  @IsString()
  readonly finalErpReference: string; // Referencia/id de la bodega en su ERP (final)

  @IsString()
  readonly facility: string; // Bodega: aun no esta creada pero deberia llamarse UMABABY


  @Expose({ name: 'initial_zone' })
  @IsString()
  readonly initialZone: string; // Zona de la bodega del movimiento (inicial)

  @Expose({ name: 'final_zone' })
  @IsString()
  readonly finalZone: string; // Zona de la bodega del movimiento (final)

  @IsString()
  readonly sku: string; // SKU

  @Expose({ name: 'qty_action' })
  @IsNumber()
  readonly qtyAction: number; // Cantidad del ajuste

  @Expose({ name: 'created_at' })
  @Type(() => Date)
  @IsDate()
  readonly createdAtData: Date; // Timestamp del movimiento

  // readonly transmissionType: string; 
}