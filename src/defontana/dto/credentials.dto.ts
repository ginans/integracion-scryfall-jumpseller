import { IsString } from 'class-validator';

export class CredentialsDto {
  @IsString({ message: 'client debe ser un string' })
  client: string;

  @IsString({
    message: 'company debe ser un string',
  })
  company: string;

  @IsString({
    message: 'user debe ser un string',
  })
  user: string;

  @IsString({
    message: 'password debe ser un string',
  })
  password: string;

  @IsString({
    message: 'urlApi debe ser un string',
  })
  urlApi: string;

}