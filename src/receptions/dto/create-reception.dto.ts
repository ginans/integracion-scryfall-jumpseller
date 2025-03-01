import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';

class RdrSetDto {
  @IsString()
  sku: string;

  @IsString()
  description: string;

  @IsNumber()
  @Expose({ name: 'ship_price' })
  shipPrice: number;

  @IsNumber()
  @Expose({ name: 'requested_qty' })
  requestedQty: number;

  @IsNumber()
  @Expose({ name: 'received_qty' })
  receivedQty: number;
}

export class CreateReceptionDto {
  @IsString()
  owner: string;

  @IsString()
  comment: string;

  @IsString()
  @Expose({ name: 'reception_nbr' })
  receptionNbr: string; //id de la recepcion, se podria cambiar nombre a receptionId?

  @IsArray()
  @Expose({ name: 'partial_rec' })
  partialRec: number[];

  @IsArray()
  @Expose({ name: 'document_nbr' })
  documentNbr: string[];

  @IsString()
  @Expose({ name: 'doctype' })
  docType: string; //podria ser un enum? trae tipo de recepcion: NAC (Nacional), IMP (Importado), Traslados (traslados), LI (Logística Inversa)

  @IsString()
  @Expose({ name: 'provider_id' })
  providerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RdrSetDto)
  @Expose({ name: 'rdr_set' })
  rdrSet: RdrSetDto[];
}


