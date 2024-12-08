import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

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
  @IsNotEmpty({
    message: 'password no puede estar vacío.',
  })
  password: string;
  @IsNotEmpty({
    message: 'rol no puede estar vacío.',
  })
  @IsEnum(UserRole, {
    message: 'rol tiene que ser Admin o User',
  })
  role: UserRole;
}
