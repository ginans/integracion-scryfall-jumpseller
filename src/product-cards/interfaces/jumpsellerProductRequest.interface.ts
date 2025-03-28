//Solicitud a Jumpseller
export interface JumpsellerProductRequest {
  name: string; 
  description?: string; 
  page_title?: string;
  meta_description?: string;
  type?: string //Tipo del producto (físico, digital o gift_card)
  days_to_expire?: number //Número de días después de la fecha de compra en que la gift card será válida
  price: number; 
  weight?: number; 
  stock?: number; 
  stock_unlimited?: boolean;
  stock_threshold?: number //Cantidad mínima de stock para considerar como bajo stock
  stock_notification?: boolean; //True si el producto tiene habilitada la notificación de bajo stock
  cost_per_item?: number; //Costo por unidad del producto (solo visible para ti)
  compare_at_price?: number; //Usado para mostrar un precio de oferta. El valor debe ser mayor que el precio.
  minimum_quantity?: number; //Cantidad mínima de unidades requeridas para proceder con la compra. Si está presente, debe ser mayor a 0.
  maximum_quantity?: number; //Cantidad máxima de unidades que se pueden comprar por pedido. Si está presente, debe ser mayor o igual a minimum_quantity.
  sku?: string; 
  barcode?: string; 
  google_product_category?: string; //Categoría del producto basada en la taxonomía de productos de Google
  featured?: boolean //Por defecto: false, True si el producto es destacado
  shipping_required?: boolean //Por defecto: true, False si el producto es digital
  status?: jumpsellerStatus; //Por defecto: available
  package_format?: jumpsellerPackage //Por defecto: "box". Formato del paquete del producto
  length?: number //Longitud del producto
  width?: number; //Ancho del producto
  height?: number; //Altura del producto
  diameter?: number; //Diámetro del producto
  categories?: JumpSellerCategories[];
  variants?: JumpsellerVariants[];
}

enum jumpsellerStatus {
  AVALIABLE = "available", //Disponible
  NOTAVALIABLE = "not-available", //No disponible
  DISABLED = "disabled" //Deshabilitado
}

enum jumpsellerPackage {
  BOX = "box", //Caja
  CYLINDER= "cylinder" //Cilindro
}

export interface JumpSellerCategories {
  id?: number;
  name?: string;
  parent_id?: number //id de la categoría padre
  permalink?: string //Ruta única de URL de la categoría
}

export interface JumpsellerVariants {
  price?: number;
  sku?: string;
  barcode?: string; //Por defecto: 123456
  stock?: number //Por defecto: 100
  stock_unlimited?: boolean
  stock_threshold?: number //Por defecto: 0
  stock_notification?: boolean
  cost_per_item?: number 
  compare_at_price?: number
  image_id?: number 
  options?: JumpsellerOptions[]
}

export interface JumpsellerOptions {
  name?: string;
  option_type?: JumpsellerOptionType //Tipo de opción del producto que genera variantes
  value?: string //Valor de la opción del producto
  custom?: string //Valor hexadecimal del color. Solo disponible para el tipo de opción de producto 'Color'
  product_option_position?: number //Posición de la opción del producto
  product_value_position?: number; //Posición del valor de la opción del producto
}

enum JumpsellerOptionType {
  OPTION = "option", 
  COLOR = "color"
}
