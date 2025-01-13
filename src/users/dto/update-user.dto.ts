import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({
    default: 'sistemas',
  })
  @IsOptional()
  @IsString({
    message: 'name tiene que ser de Tipo String',
  })
  name?: string;

  @ApiProperty({
    default: 'test@test.cl',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    default: 'password',
  })
  @IsOptional()
  password?: string;

  @ApiProperty({
    default: 'Admin',
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'rol tiene que ser Admin o User',
  })
  role?: UserRole;
}
