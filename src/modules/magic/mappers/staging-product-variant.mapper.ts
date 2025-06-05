import { EnumGame, EnumGamePrefix } from "src/common/enums/game.enum";
import { JumpsellerCreateVariantResponse } from "src/modules/jumpseller/interfaces/jumpsellerVariants/jumpsellerCreateVariantResponse.interface";
import { MagicCard } from '../entities/magic-card.entity';

// Exportamos la función para que pueda ser usada en otros archivos si es necesario
export const getGameFromSku = (sku: string) => {
  if (!sku) return null;
  const prefix = sku.split('-')[0];
  switch (prefix) {
    case EnumGamePrefix.MAGIC: return EnumGame.MAGIC;
    case EnumGamePrefix.POKEMON: return EnumGame.POKEMON;
    case EnumGamePrefix.ONEPIECE: return EnumGame.ONEPIECE;
    default: return null;
  }
};

export const mappedStaggingProductVariant = (card: MagicCard, variant: JumpsellerCreateVariantResponse, condition, finish ) => {
    return {
      productId: card.idJumpSeller,
      variantId: variant.variant.id,
      name: card.name || "",
      anotherLangName: card.printedName || "",//TODO: problema, en carta en inglés no hay printedName, pero en español sí
      sku: variant.variant.sku,
      finish: finish || "",
      rarity: card.rarity || "",
      condition: condition || "",
      game: getGameFromSku(variant.variant.sku) || null,
      imageUrl: {
        large: card.imageUris?.large || null,
        cardFacelarge1: card.cardFaces?.[0]?.imageUris?.large || null,
        cardFacelarge2: card.cardFaces?.[1]?.imageUris?.large || null,
        small: card.imageUris?.small || null,
        cardFaceSmall1: card.cardFaces?.[0]?.imageUris?.small || null,
        cardFaceSmall2: card.cardFaces?.[1]?.imageUris?.small || null,
      },
      fatherProduct: {
        oracleId: card.oracleId,
        description: card.oracleText || "",
        setName: card.setName || "",
        setId: card.setId || "",
        set: card.set || "",
      },
    };
  };