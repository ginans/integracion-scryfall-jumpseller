import {IsEmail, IsNotEmpty, IsNumber, IsString, ValidateNested} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from "class-transformer";

interface IClient {
  IdCliente: number;
  Nombre: string
  Apellido: string
  Direccion: string
  Email: string,
  Giro: string
}
interface IProduct {
  SKU: string;
  BarCode: string;
  cantidad: number;
  total: number;
}
interface IOrder {
  CondicionPago: string;
  Vendedor: string;
  IdVenta: number;
  numdoc: number;
}
interface ITotal {
  IVA: number;
  TasaIVA: number;
  MntTotal: number;
}

class Client implements IClient {
  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'IdCliente tiene que ser de Tipo Number',
  })
  IdCliente: number;

  @ApiProperty()
  @IsString({
    message: 'Nombre tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'Nombre no puede estar vacío.',
  })
  Nombre: string;

  @ApiProperty()
  @IsString({
    message: 'Apellido tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'Apellido no puede estar vacío.',
  })
  Apellido: string;

  @ApiProperty()
  @IsString({
    message: 'Direccion tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'Direccion no puede estar vacío.',
  })
  Direccion: string;

  @ApiProperty()
  @IsEmail({},{
    message: 'Email tiene que ser de Tipo Email',
  })
  Email: string;

  @ApiProperty()
  @IsString({
    message: 'Giro tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'Giro no puede estar vacío.',
  })
  Giro: string;
}
class Product implements IProduct {
  @ApiProperty()
  @IsString({
    message: 'SKU tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'SKU no puede estar vacío.',
  })
  SKU: string;

  @ApiProperty()
  @IsString({
    message: 'BarCode tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'BarCode no puede estar vacío.',
  })
  BarCode: string;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'cantidad tiene que ser de Tipo Number',
  })
  cantidad: number;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'total tiene que ser de Tipo Number',
  })
  total: number;
}
class Order implements IOrder {
  @ApiProperty()
  @IsString({
    message: 'CondicionPago tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'CondicionPago no puede estar vacío.',
  })
  CondicionPago: string;

  @ApiProperty()
  @IsString({
    message: 'Vendedor tiene que ser de Tipo String',
  })
  @IsNotEmpty({
    message: 'Vendedor no puede estar vacío.',
  })
  Vendedor: string;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'IdVenta tiene que ser de Tipo Number',
  })
  IdVenta: number;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'numdoc tiene que ser de Tipo Number',
  })
  numdoc: number;
}
class Total implements ITotal {
  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'IVA tiene que ser de Tipo Number',
  })
  IVA: number;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'TasaIVA tiene que ser de Tipo Number',
  })
  TasaIVA: number;

  @ApiProperty()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 0,
  },{
    message: 'MntTotal tiene que ser de Tipo Number',
  })
  MntTotal: number;
}
export class CreateBillDto {
  @ValidateNested()
  @Type(() => Client)
  Cliente: Client;
  @ValidateNested()
  @Type(() => Product)
  Productos: Product[];
  @ValidateNested()
  @Type(() => Order)
  Orden: Order;
  @ValidateNested()
  @Type(() => Total)
  Totales: Total;
}

