# 💡 Deuda Técnica - Refactor flujo cartas a Jumpseller

## 🧠 Contexto

Actualmente, el flujo de carga de cartas Magic hacia Jumpseller está funcional, pero presenta complejidades al momento de manejar precios, stock e imágenes de forma eficiente. Este nuevo flujo propuesto busca optimizar ese proceso, facilitando la gestión de productos y permitiendo reutilizarlo para futuros lotes de Pokémon y One Piece.

---

## 🚀 Nuevo flujo propuesto (pendiente de implementación)

### 1. Carga de cartas
- [ ] Traer cartas desde Scryfall, **revisando bien el idioma** para evitar duplicados/confusiones al momento de la automatizacion de la creacion/actualizacion de productos en jumpseller.
- [x] Guardar las cartas en la base de datos `magic`.

### 2. Generación de productos preparados
- [ ] Crear **nueva colección** donde:
  - Cada documento representa un **producto armado listo para enviar a Jumpseller**.
  - Incluye todos los datos necesarios: nombre, descripción, variantes, stock, precio, imágenes, etc.
  - Se usará tanto para la creación como para la actualización de productos.

### 3. Datos personalizados
- [ ] Crear campos personalizados por separado, no existe forma de crearlos en un mismo proceso como con los otros campos

### 4. Envío inicial a Jumpseller
- [ ] Crear los productos con:
  - `stock = null`
  - `price = 0`
- [ ] Guardar la **respuesta de creación** para enlazar el ID de Jumpseller con el producto local.

### 5. Carga de precios y stock
- [ ] Usar **endpoint de actualización de producto** de Jumpseller para:
  - Cargar precios reales
  - Actualizar stock
  - Subir imágenes en la misma petición (menos llamadas a la API = felicidad 😌)

### 6. Estructura interna de control
- [ ] Crear una **colección para edición de productos** (donde se hagan cambios activos).
- [ ] Crear una **colección visual** (solo para ver productos cargados sin modificar).
- [ ] Determinar si la carga de precios se hace **desde el módulo de edición** o por flujo aparte.

---

## ✅ Ventajas del nuevo flujo

- ✨ **Menos llamadas a la API**: Aprovecha el endpoint de actualización de producto para hacer varias acciones a la vez.
- 📦 **Estructura más clara**: Productos pre-armados en una colección, más fácil de testear, revisar y versionar.
- 🧩 **Mantenibilidad**: Más simple de replicar para Pokémon y One Piece.
- 💸 **Carga de precios y stock mucho más directa** sin depender de múltiples colecciones cruzadas.

---

## 🕒 ¿Cuándo hacerlo?

Cuando llegue el próximo batch de cartas (Pokémon y One Piece), implementar este flujo desde el inicio permitirá aplicarlo también retroactivamente a Magic, sin interrumpir entregas actuales 🕵️‍♂️✨

---

## 😅 ¿Por qué no ahora?

- Hay entregas pendientes y tareas que priorizar.
- Implementarlo ahora implicaría rehacer gran parte del flujo y podría tomar demasiado tiempo.
- Se decide **dejar como deuda técnica** hasta que se libere más tiempo o lleguen las nuevas cartas.

---

## 📝 Notas extra

- Requiere definir bien los triggers o condiciones para detectar cartas nuevas que deben generar productos.
- Posible uso de `cron jobs` o `change streams` de Mongo si se automatiza.
- Muy probable que esto **ahorre horas** de trabajo repetitivo en el futuro.

---

Con cariño,  
Gina del pasado que ya estaba en modo bolita pero igual pensó en el futuro 💖🧶