import { EnumGame } from "src/common/enums/game.enum";

export interface IUsdPrice {
  game: EnumGame;
  usdPrice: number;
}