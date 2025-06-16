import { IsEnum } from "class-validator";
import { StateOrderEnum } from "../enums/state-order.enum";

export class OrderStateDto {    
    @IsEnum(StateOrderEnum)
    state: StateOrderEnum;
}