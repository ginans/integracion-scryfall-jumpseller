import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'name no puede estar vacío.',
  })
  @IsString({
    message: 'name tiene que ser de Tipo String',
  })
  name: string;

  @IsNotEmpty({
    message: 'email no puede estar vacío.',
  })
  @IsEmail()
  email: string;
}
