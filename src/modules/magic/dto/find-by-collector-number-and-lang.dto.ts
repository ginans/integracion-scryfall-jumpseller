import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class findByCollectorNumberAndLangDto {
    @IsOptional()
    @IsString({
        message: 'collectorNumber tiene que ser de tipo String',
    })
    collectorNumber: string;
    
    @IsNotEmpty({
        message: 'lenguaje no puede estar vacio',
    })
    @IsString({
        message: 'lenguaje tiene que ser de Tipo String',
    })
    lenguaje: string;
}