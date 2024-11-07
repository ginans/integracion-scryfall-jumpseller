import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecoverPassDto {
  @IsNotEmpty({
    message: 'email no puede estar vacío',
  })
  @IsEmail()
  email: string;
}
