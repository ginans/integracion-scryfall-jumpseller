import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({
    message: 'email no puede estar vacío',
  })
  @IsEmail()
  email: string;
  @IsNotEmpty({
    message: 'password no puede estar vacío',
  })
  password: string;
}
