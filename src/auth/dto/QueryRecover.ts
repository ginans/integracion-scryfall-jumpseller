import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryRecover {
    @ApiProperty({ default: null })
    @IsNotEmpty({
        message: 'se debe enviar rememberToken',
    })
    @IsString()
    rt: string; // rememberToken
}