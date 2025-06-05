import { IsOptional, IsString } from "class-validator";

export class findByCardByLangDto {    
    @IsOptional()
    @IsString({
        message: 'lenguaje tiene que ser de Tipo String',
    })
    lenguaje: string;
}