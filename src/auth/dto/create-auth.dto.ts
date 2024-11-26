import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
  @ApiProperty({
    default: 'sistemas@fixlabs.cl',
  })
  @IsNotEmpty({
    message: 'email no puede estar vacío',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    default: '12345678',
  })
  @IsNotEmpty({
    message: 'password no puede estar vacío',
  })
  password: string;
}
