export const spanishRarities = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'Común';
    case 'uncommon':
      return 'Poco Común';
    case 'rare':
      return 'Rara';
    case 'mythic':
      return 'Mítica';
    default:
      return rarity;
  }
};

export const translateColors = (color: string) => {
    switch (color) {
      case 'W':
        return 'Blanco';
      case 'U':
        return 'Azul';
      case 'B':
        return 'Negro';
      case 'R':
        return 'Rojo';
      case 'G':
        return 'Verde';
      case 'black':
        return 'Negro';
      case 'white':
        return 'Blanco';
      case 'borderless':
        return 'Sin Borde';
      case 'yellow':
        return 'Amarillo';
      case 'silver':
        return 'Plateado';
      case 'gold':
        return 'Dorado';
      default:
        return color;
    }
};
