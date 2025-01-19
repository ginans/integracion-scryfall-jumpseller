import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    default: 'sistemas',
  })
  @IsNotEmpty({
    message: 'name no puede estar vacío.',
  })
  @IsString({
    message: 'name tiene que ser de Tipo String',
  })
  name: string;
  @ApiProperty({
    default: 'test@test.cl',
  })
  @IsNotEmpty({
    message: 'email no puede estar vacío.',
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    default: 'password',
  })
  @IsNotEmpty({
    message: 'password no puede estar vacío.',
  })
  password: string;
  @ApiProperty({
    default: 'Admin',
  })
  @IsNotEmpty({
    message: 'role no puede estar vacío.',
  })
  @IsEnum(UserRole, {
    message: 'role tiene que ser Admin o User',
  })
  role: UserRole;
}
