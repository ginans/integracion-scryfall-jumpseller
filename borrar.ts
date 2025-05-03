// [   //un documento por cada variante
//     {
//     "jumpsellerId": 0,//no unico, indexar --- guardar al CREAR el producto
//     "variantId": 0, //unico, indexar--- guardar al CREAR la variante
//     "sku": null, //unico, indexar? --- guardar al CREAR la variante
//     "stagedPrice": null, //si el precio viene desde scryfall se guarda aqui despues de la conversion
//     //si viene en null el precio queda en 0
//     //crear los productos todos en 0??? al final luego de crear las variantes actualizar precios de forma masiva
//     //crear el controller para esa funcion de carga masiva de precios
//     "isUpdateable": false
//      },
//      //si la variante existe crea un documento nuevo, sino no lo crea
//     {
//     "jumpsellerId": 0,
//     "variantId": 0,
//     "sku": null,
//     "stagedPrice": null,
//     "isUpdateable": false
//     },
//     {
//     "jumpsellerId": 0,
//     "variantId": 0,
//     "sku": null,
//     "stagedPrice": null,
//     "isUpdateable": false
//     }
    
// ]



// [
// {
//     "card_name": "Pumpkin Bombs",
//     "another_lang_name": "",
//     "sku": "M-SPE0026-EN-NF",
//     "product_id": 29674443,
//     "variant_id": 109023583,
//     "location_id": 46801,
//     "stock_unlimited": false,
//     "stock": 0,
// }
// ]

// /*
// que necesito para crear precios por variante?

// 1. una variante existente
// 2. saber si es foil, no foil o etched (sin importar el lenguaje de momento, preguntar al cliente si las cartas en idiomas raros tienen precios diferentes)
// 3.


// que me pide el endpoint de actualizacion?
// 1. el id de la variante
// 2. el id de jumpseller


// Otras tareas:
// 1. en la funcion para crear todos los precios, agregar el endpoint de actualizacion de variantes
// 2. en la funcion para crear/cambiar precios por variante, agregar el endpoint de actualizacion de variantes
// 3. agregar funcion para marcar como no actualizable (automatico) si se cambia el precio de manera manual, manualmente siempre son actualizables?
// 4. 

// */
