import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, IsEnum, Max, Min } from 'class-validator';
import { ReceptionsState } from '../enums/receptionsState.enum';
import { SortOrder } from 'src/common/enums/sortOrder.enum';

export enum SortBy {
    receptionNbr = 'receptionNbr',
}

export class QueryReceptionDto {
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

    @IsOptional()
    @IsString()
    search?: string | null;

    @IsOptional()
    @IsString()
    to?: string | null;

    @IsOptional()
    @IsString()
    from?: string | null;

    @IsOptional()
    @IsString()
    state?: ReceptionsState | null;

}