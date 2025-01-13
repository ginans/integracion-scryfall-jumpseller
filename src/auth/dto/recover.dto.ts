import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoverPassDto {
  @ApiProperty({ default: 'test@test.cl' })
  @IsNotEmpty({
    message: 'email no puede estar vacío',
  })
  @IsEmail()
  email: string;
}
