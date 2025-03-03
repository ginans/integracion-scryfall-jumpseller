import { Transform } from 'class-transformer';
import { IsNumber, IsString, IsOptional, IsEnum, Max, Min } from 'class-validator';
import { SortOrder } from 'src/common/enums/sortOrder.enum';
import { TransfersState } from 'src/transfers/enums/transfersState.enum';

export enum SortBy {
    idTransmission = 'idTransmission',
}
export class QueryTransfersDto {
    @IsOptional()
    @IsNumber({
        allowNaN: false,
        allowInfinity: false,
        maxDecimalPlaces: 0,
    }, {
        message: 'La página debe ser un número entero'
    })
    @Min(1)
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @IsOptional()
    @IsNumber({
        allowNaN: false,
        allowInfinity: false,
        maxDecimalPlaces: 0,
    }, {
        message: 'El límite debe ser un número entero'
    })
    @Max(100)
    @Min(1)
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 3;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.ASC;

    @IsString()
    @IsOptional()
    search?: string | null;

    @IsOptional()
    @IsString()
    to?: string | null;

    @IsOptional()
    @IsString()
    from?: string | null;

    @IsString()
    @IsOptional()
    state?: TransfersState | null;

}