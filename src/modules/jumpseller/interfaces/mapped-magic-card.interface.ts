import { EnumCondition } from "src/modules/magic/enums/condition.enum";

export interface IsetMagic{
    idJumpSeller?:number;
    status?:string;
}

//info mapeada
export interface MappedMagicCard {
    idJumpSeller?:number //variable para identifcar si campos se debe actualizar con crear en jumpeller
    id?: string;
    oracleId?: string;
    name?: string;
    printedName?: string;
    oracleText?: string;
    printedText?: string;
    lang?: string;
    uri?: string;
    layout?: string;
    imageUris?: {
        large?: string;
        small?: string;
    };
    manaCost?: string;
    cmc: number;
    typeLine: string;
    printedTypeLine?: string;
    colors: string[];
    borderColor: string;
    colorIdentity: string[];
    keywords: string[];
    finishes?: string[];
    foil?: boolean;
    nonfoil?: boolean;
    cardFaces?: CardFace[];
    legalities: Record<string, string>;
    gameChanger: boolean;
    rarity: string;
    artist: string;
    fullArt: boolean;
    textless: boolean;
    power: string;
    toughness: string;
    prices?: {
        usd?: string | null;
        usdFoil?: string | null;
        usdEtched?: string | null;
    };
    collectorNumber?: string;
    setId?: string;
    set?: string;
    setType: string;
    setName: string;
    games?: string[];
    condition?: string[];
}

interface CardFace {
    object?: string;
    name?: string;
    printedName?: string;
    manaCost: string;
    typeLine: string;
    printedTypeLine: string;
    oracleText: string;
    printedText: string;
    colors: string[];
    power: string;
    toughness: string;
    artist: string;
    artistId?: string;
    illustrationId?: string;
    imageUris?: {
        small: string;
        normal?: string;
        large: string;
        png?: string;
        artCrop?: string;
        borderCrop?: string;
    };
}