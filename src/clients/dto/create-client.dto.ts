import { Prop } from '@nestjs/mongoose';

export class CreateClientDto {
  lastname: string;
  uuid: number;
  contact: string;
  web: string;
  email: string;
  status: boolean;
  checkInDate: string;
  phoneNumber: string;
  houseNumber: string;
  giro: number;
  name: string;
  obs: string;
  rut: string;
  clientType: number;
}
