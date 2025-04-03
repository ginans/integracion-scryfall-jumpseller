//scryfall
const scryfallCard = {
    "_id": {
      "$oid": "67e41574a3f0f68ee6c123f2"
    },
    "id": "d83ee1b4-0e8f-4207-8550-c08bee504d81",
    "oracleId": "0a81591a-411d-4710-b280-29117c84eb2d",
    "name": "Bloom Tender // Bloom Tender",
    "printedName": "",//solo viene contenido cuando estan en español
    "lang": "en",
    "uri": "https://api.scryfall.com/cards/d83ee1b4-0e8f-4207-8550-c08bee504d81",
    "layout": "art_series",
    "imageUris": { //tal cual, a veces no vienen las imagenes aqui, sino, en cardFaces, pasar como imagenes principales
      "small": "",
      "large": ""
    },
    "manaCost": "",
    "cmc": 0,
    "typeLine": "Card // Card",
    "printedTypeLine": "",
    "colors": [],
    "colorIdentity": [],
    "keywords": [],
    "cardFaces": [
      {
        "name": "Bloom Tender",
        "printedName": "",
        "manaCost": "",
        "typeLine": "Card",
        "printedTypeLine": "",
        "oracleText": "",
        "printedText": "",
        "colors": [],
        "artist": "",
        "imageUris": {//pasar siempre todas las imagenes en large
          "small": "https://cards.scryfall.io/small/front/d/8/d83ee1b4-0e8f-4207-8550-c08bee504d81.jpg?1730504193",
          "large": "https://cards.scryfall.io/large/front/d/8/d83ee1b4-0e8f-4207-8550-c08bee504d81.jpg?1730504193"
        }
      },
      {
        "name": "Bloom Tender",
        "printedName": "",
        "manaCost": "",
        "typeLine": "Card",
        "printedTypeLine": "",
        "oracleText": "",//no hace falta pasar
        "printedText": "",
        "colors": [],
        "artist": "",
        "imageUris": {//same
          "small": "https://cards.scryfall.io/small/back/d/8/d83ee1b4-0e8f-4207-8550-c08bee504d81.jpg?1730504193",
          "large": "https://cards.scryfall.io/large/back/d/8/d83ee1b4-0e8f-4207-8550-c08bee504d81.jpg?1730504193"
        }
      }
    ],
    "legalities": { //hacer condicion para que solo se pasen las legales 
      "standard": "not_legal",
      "future": "not_legal",
      "historic": "not_legal",
      "timeless": "not_legal",
      "gladiator": "not_legal",
      "pioneer": "not_legal",
      "explorer": "not_legal",
      "modern": "not_legal",
      "legacy": "not_legal",
      "pauper": "not_legal",
      "vintage": "not_legal",
      "penny": "not_legal",
      "commander": "not_legal",
      "brawl": "not_legal",
      "standardbrawl": "not_legal",
      "alchemy": "not_legal",
      "paupercommander": "not_legal",
      "duel": "not_legal",
      "oldschool": "not_legal",
      "premodern": "not_legal",
      "predh": "not_legal",
      "oathbreaker": "not_legal"
    },
    "prices": {
      "usd": null,
      "usdFoil": null,
      "usdEtched": null
    },
    "gameChanger": false,
    "rarity": "common",
    "artist": "",
    "collectorNumber": "54",
    "setId": "dae4bf74-97f7-40a6-ac46-54b6b0d8a58d",
    "set": "afdn",
    "setName": "Foundations Art Series",
    "status": "pending",
    "__v": 0,
    "createdAt": {
      "$date": "2025-03-26T14:55:48.297Z"
    },
    "updatedAt": {
      "$date": "2025-03-26T14:55:48.297Z"
    }
  };
  

    //reglas
    //categorias:setName
    //agregar:
    //sku, crear nuevo producto con sku diferente por ser diferente 
    //brand: "gameName": "Magic: The Gathering",
    //"weight": 2,
    //variantes: finishes, lang, diferencia de precio/imagen, estados de la carta
    //"height": 3.5,
    //"width": 2.5,



    //Solicitud a Jumpseller
// {
//   "name": "string",
//   "description": "string",
//   "page_title": "string",
//   "meta_description": "string",
//   "type": "string",
//   "days_to_expire": 0,
//   "price": 0,
//   "weight": 0,
//   "stock": 0,
//   "stock_unlimited": false,
//   "stock_threshold": 0,
//   "stock_notification": false,
//   "cost_per_item": 0,
//   "compare_at_price": 0,
//   "minimum_quantity": 0,
//   "maximum_quantity": 0,
//   "sku": "string",
//   "barcode": "string",
//   "google_product_category": "string",
//   "featured": false,
//   "shipping_required": true,
//   "status": "available",
//   "package_format": "box",
//   "length": 0,
//   "width": 0,
//   "height": 0,
//   "diameter": 0,
//   "categories": [
//     {
//       "id": 0,
//       "name": "string",
//       "parent_id": 0,
//       "permalink": "string"
//     }
//   ],
//   "variants": [
//     {
//       "price": 0,
//       "sku": "string",
//       "barcode": "string",
//       "stock": 0,
//       "stock_unlimited": false,
//       "stock_threshold": 0,
//       "stock_notification": false,
//       "cost_per_item": 0,
//       "compare_at_price": 0,
//       "image_id": 0,
//       "options": [
//         {
//           "name": "string",
//           "option_type": "option",
//           "value": "string",
//           "custom": "string",
//           "product_option_position": 0,
//           "product_value_position": 0
//         }
//       ]
//     }
//   ]
// }
