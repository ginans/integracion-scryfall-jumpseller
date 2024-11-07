import { IsNotEmpty } from 'class-validator';

export class ReplacePassDto {
  @IsNotEmpty({
    message: 'password no puede estar vacío',
  })
  password: string;
  @IsNotEmpty({
    message: 'token no puede estar vacío',
  })
  token: string;
}