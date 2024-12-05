import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplacePassDto {
  @ApiProperty({
    description: 'Nueva contraseña',
    example: '12345678',
    minimum: 8,
  })
  @IsNotEmpty({
    message: 'password no puede estar vacío',
  })
  password: string;
}
