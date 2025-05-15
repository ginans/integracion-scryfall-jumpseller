[   //un documento por cada variante
    {
    "jumpsellerId": 0,//no unico, indexar --- guardar al CREAR el producto
    "variantId": 0, //unico, indexar--- guardar al CREAR la variante
    "sku": null, //unico, indexar? --- guardar al CREAR la variante
    "stagedPrice": null, //si el precio viene desde scryfall se guarda aqui despues de la conversion
    //si viene en null el precio queda en 0
    //crear los productos todos en 0??? al final luego de crear las variantes actualizar precios de forma masiva
    //crear el controller para esa funcion de carga masiva de precios
    "isUpdateable": false
     },
     //si la variante existe crea un documento nuevo, sino no lo crea
    {
    "jumpsellerId": 0,
    "variantId": 0,
    "sku": null,
    "stagedPrice": null,
    "isUpdateable": false
    },
    {
    "jumpsellerId": 0,
    "variantId": 0,
    "sku": null,
    "stagedPrice": null,
    "isUpdateable": false
    }
    
]

[{
    "card_name": "Pumpkin Bombs",
    "another_lang_name": "",
    "sku": "M-SPE0026-EN-NF",
    "product_id": 29674443,
    "variant_id": 109023583,
    "location_id": 46801,
    "stock_unlimited": false,
    "stock": 0,
}]

que me pide el endpoint de actualizacion?
1. el id de la variante
2. el id de jumpseller
3. mejor usar el endpoint para actualizacion de producto? hay que mapear bien eso, si logramos eso podemos cambiar tambien la forma en la que se crean productos-variantes pero hay que revisar bien como se estan trayendo las cartas en otros idiomas de scryfall
- por el momento primero se crean todos los productos con las cartas en ingles uno por uno y despues se traen las cartas en español y se van creando las variantes una por una por producto, se asocian porque tienen el mismo oracleId 

#Los productos deben CREARSE sin precio ni stock
- el stock y el precio deben cargarse despues de que se crearon las variantes


Otras tareas:
2. en la funcion para crear/cambiar precios por variante, agregar el endpoint de actualizacion de variantes---> condiderar actualizacion de productos
3. agregar funcion para marcar como no actualizable (de manera automatica) si se cambia el precio de manera manual, manualmente siempre son actualizables? considerar un checkbox?
4. 

