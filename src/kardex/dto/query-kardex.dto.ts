import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsString, IsDate, isNumber, IsOptional, IsEnum, Max, Min } from 'class-validator';
import { from } from 'rxjs';
import { EnumState } from 'src/common/enums/state.enum';

export enum SortBy {
    idTransmission = 'idTransmission',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class QueryDto {
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

    @IsDate()
    @IsOptional()
    to?: string | null;

    @IsOptional()
    @IsDate()
    from?: string | null;

    @IsEnum({
        enum: EnumState,
        message: `El estado debe ser uno de los siguientes valores ${Object.values(EnumState).join(', ')}`
    })
    @IsOptional()
    state?: EnumState | null;

}