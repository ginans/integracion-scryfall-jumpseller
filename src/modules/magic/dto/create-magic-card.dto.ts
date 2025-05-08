import { IsNotEmpty, IsString } from "class-validator";

//dto para crear una carta de magic
//lo utilizamos para falidar el formulario de creacion de cartas
//en el front end
export class CreateMagicCardDto {
    @IsNotEmpty({
        message: 'oracle_id no puede estar vacío.',
    })
    @IsString({
        message: 'oracle_id tiene que ser de Tipo String',
    })
    oracle_id: string;
    
    @IsNotEmpty({
        message: 'lenguaje no puede estar vacío.',
    })
    @IsString({
        message: 'lenguaje tiene que ser de Tipo String',
    })
    lenguaje: string;
}