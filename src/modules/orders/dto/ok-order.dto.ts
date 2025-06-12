import { IsBoolean, IsNotEmpty } from "class-validator";

export class okOrderDto {    
    @IsNotEmpty({
        message: 'isOrderOk no puede estar vacio',
    })
    @IsBoolean({
        message: 'isOrderOk tiene que ser de Tipo Boolean',
    })
    isOrderOk: boolean
}