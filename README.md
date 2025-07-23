# Integración scryfall-jumpseller-Backend

Sistema backend desarrollado en NestJS para la **venta de cartas sueltas de Magic: The Gathering**.

**Flujo de trabajo:**

1. **Obtención**: Sincroniza cartas desde la API de Scryfall
2. **Almacenamiento**: Guarda cartas con todos sus datos en MongoDB
3. **Procesamiento**: Cartas en inglés → Productos base en Jumpseller
4. **Variantes**: Cartas en español/otros idiomas → Variantes del producto base
5. **E-commerce**: Sistema completo de inventario, ventas y creacion de nuevas variantes automatizado

Integración completa con **Jumpseller** para e-commerce y **Scryfall** como fuente de datos oficial de cartas.

## 🚀 Características Principales

- **API REST** completa con documentación Swagger
- **Autenticación JWT** con roles y permisos (Admin/User)
- **Integración con Scryfall** para datos de cartas Magic
- **Integración con Jumpseller** para e-commerce automático
- **Sistema de colas** con BullMQ para procesamiento asíncrono
- **Gestión de precios** en USD y precios base con cálculos automáticos
- **Sistema de inventario** con variantes de productos (idioma, condición, finish)
- **Logging avanzado** con Winston y sistema de interceptores
- **Base de datos MongoDB** con Mongoose y esquemas validados
- **Cache Redis** para optimización de colas
- **Dockerización** completa para desarrollo y producción
- **Scheduler automático** para sincronización semanal

## 📋 Requisitos

- Node.js 22+
- npm/yarn/pnpm
- MongoDB 8+
- Redis 7+
- Docker & Docker Compose (opcional)

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

4. **Configurar variables requeridas en `.env`**

```env
# Base
NODE_ENV=development
PORT=8000
APP_NAME=integracion-scryfall-jumpseller-Backend

# Seguridad
JWT_SECRET=your-strong-jwt-secret-here
JWT_HOURS_EXPIRE=24

# URLs
URL_APP_BACKEND=http://localhost:8000
URL_APP_FRONTEND=http://localhost:3000

# Base de datos
DB_NAME=scryfall-jumpseller
DB_URI=mongodb://localhost:27017/scryfall-jumpseller

# Cache & Queues
CACHE_URL=redis://localhost:6379

# Jumpseller API - Requerido para e-commerce
JUMPSELLER_LOGIN=your-jumpseller-login
JUMPSELLER_AUTHTOKEN=your-jumpseller-token
```

5. **Ejecutar servicios requeridos (MongoDB y Redis)**

```bash
# Con Docker (local)
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker run -d -p 6379:6379 --name redis redis:latest

# O instalar localmente
# O usar MongoDB Atlas (en la nube)
```

6. **Ejecutar en modo desarrollo**

```bash
npm run dev
# o
yarn dev
# o
pnpm run dev
```

### Con Docker

1. **Desarrollo con Docker**

```bash
npm run docker:dev
```

2. **Ver logs de desarrollo**

```bash
npm run docker:dev:logs
```

3. **Producción con Docker**

```bash
npm run docker:prod
```

## 📁 Estructura del Proyecto

```
src/
├── main.ts                 # Bootstrap principal, configuración global, CORS, Swagger, pipes, versión API
├── app.module.ts           # Módulo raíz, orquesta todos los módulos y configuración global
├── app.controller.ts       # Endpoint health check y controladores globales
├── app.service.ts          # Scheduler principal, ejecuta tareas periódicas (procesamiento Magic)

├── config/
│   ├── app.config.ts       # Configuración de variables de entorno y helpers
│   └── joi.validation.ts   # Validación estricta de variables con Joi

├── auth/
│   ├── auth.module.ts      # Módulo de autenticación JWT
│   ├── auth.controller.ts  # Endpoints de login, recuperación y cambio de contraseña
│   ├── auth.service.ts     # Lógica de autenticación, tokens y recuperación
│   ├── guards/             # Guards de roles y autenticación
│   ├── jwt-auth.guard.ts   # Guard principal JWT
│   ├── jwt.strategy.ts     # Estrategia JWT Passport
│   ├── decorators/         # Decoradores personalizados (roles, usuario)
│   ├── dto/                # DTOs para login, recuperación, cambio de contraseña
│   ├── entities/           # Entidad Auth para MongoDB
│   └── interface/          # Interfaces de payload y tipos

├── common/
│   ├── adapters/           # Adaptador HTTP (Axios) para requests externos
│   ├── dto/                # DTOs de paginación y utilidades
│   ├── enums/              # Enums globales (juegos, queries)
│   ├── interfaces/         # Interfaces comunes (fechas, paginación, adapters)
│   ├── guards/             # Guard para webhooks Jumpseller
│   ├── interceptors/       # Interceptor de logging de requests
│   ├── logger/             # Winston, logging avanzado, configuración y servicios
│   ├── modules/            # Módulo de paginación global
│   ├── services/           # Servicios utilitarios (paginación, filtros, rate limiter, cache Redis, exportación)
│   └── utils/              # Utilidades de traducción y helpers

├── modules/
│   ├── magic/
│   │   ├── magic-cards.module.ts     # Módulo principal de cartas Magic
│   │   ├── magic-cards.controller.ts # Endpoints CRUD, variantes, búsqueda, integración Scryfall/Jumpseller
│   │   ├── magic-cards.service.ts    # Lógica de negocio: sincronización, variantes, integración, mapeo, imágenes, precios
│   │   ├── entities/                 # Entidad MagicCard para MongoDB
│   │   ├── mappers/                  # Mapeadores Scryfall→DB y DB→Jumpseller, custom fields
│   │   ├── enums/                    # Enums de idioma, condición, status, custom fields
│   │   ├── dto/                      # DTOs para búsquedas y creación
│   │   └── submodules/
│   │       └── scryfall/             # Cliente API Scryfall, enums y interfaces
│   ├── jumpseller/
│   │   ├── jumpseller.module.ts      # Módulo de integración Jumpseller
│   │   ├── jumpseller.service.ts     # Cliente API Jumpseller, productos, variantes, imágenes, custom fields
│   │   ├── endpoints.enum.ts         # Enum de endpoints Jumpseller
│   │   └── interfaces/               # Interfaces para requests/responses Jumpseller
│   ├── variants/
│   │   ├── variants.module.ts        # Módulo de variantes de productos
│   │   ├── variants.controller.ts    # Endpoints de variantes, stock, precios
│   │   ├── variants.service.ts       # Lógica de variantes, stock, descuentos, historial
│   │   ├── entities/                 # Entidad Variant y stock/sales history
│   │   ├── enums/                    # Estados de precio/stock, status Jumpseller
│   │   └── interfaces/               # Interfaces de variantes
│   ├── prices/
│   │   ├── base-prices/              # Precios base configurables
│   │   ├── usd-prices/               # Precios USD desde APIs externas
│   ├── process/
│   │   ├── process.module.ts         # Módulo de procesamiento asíncrono
│   │   ├── process.service.ts        # Orquestador principal de colas y procesamiento
│   │   ├── queues/                   # Definición de colas BullMQ (magic, stock, precios)
│   │   └── dto/                      # DTOs para recálculo de precios y stock
│   ├── users/
│   │   ├── users.module.ts           # Módulo de usuarios
│   │   ├── users.controller.ts       # Endpoints CRUD de usuarios
│   │   ├── users.service.ts          # Lógica de usuarios, roles, activación
│   │   ├── entities/                 # Entidad User para MongoDB
│   │   ├── dto/                      # DTOs de usuario
│   │   └── enums/                    # Enum de roles
│   ├── orders/                       # Módulo de órdenes y ventas
│   └── ...                           # Otros módulos: mail, archivos, staging-product-variant, etc.

├── test/                             # Tests E2E y unitarios
│   ├── app.e2e-spec.ts               # Test principal E2E
│   └── jest-e2e.json                 # Configuración Jest E2E
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev                  # Ejecutar en modo desarrollo con watch
yarn dev                    # Con yarn
npm run start               # Ejecutar compilado
npm run start:debug         # Ejecutar con debug
npm run build               # Compilar TypeScript

# Testing
npm run test                # Tests unitarios con Jest
npm run test:watch          # Tests en modo watch
npm run test:cov            # Tests con reporte de cobertura
npm run test:e2e            # Tests end-to-end

# Linting y formato
npm run lint                # ESLint con corrección automática
npm run format              # Prettier para formateo

# Docker - Desarrollo
npm run docker:dev          # Levantar stack completo desarrollo
npm run docker:dev:build    # Rebuildar imagen desarrollo
npm run docker:dev:stop     # Detener stack desarrollo
npm run docker:dev:logs     # Ver logs en tiempo real

# Docker - Producción
npm run docker:prod         # Levantar stack producción
npm run docker:prod:build   # Rebuildar imagen producción
npm run docker:prod:stop    # Detener stack producción
npm run docker:prod:logs    # Ver logs producción

# Utilidades Docker
npm run docker:stop:all     # Detener todos los stacks
```

## 📚 Documentación API

Una vez ejecutado el proyecto, accede a la documentación interactiva:

- **Desarrollo**: http://localhost:8000/backend/docs
- **Producción**: https://your-domain.com/backend/docs

### Health Check

- **Endpoint**: `GET /backend/health`
- **Respuesta**: `"ok"`

## 🔐 Sistema de Autenticación

### Roles disponibles:

```typescript
enum UserRole {
  Admin = 'admin', // Acceso completo al sistema
  User = 'user', // Acceso limitado a consultas
}
```

### Endpoints de autenticación:

```bash
POST /backend/v1/auth/login          # Iniciar sesión
POST /backend/v1/auth/recover_pass   # Solicitar recuperación
POST /backend/v1/auth/new-password   # Cambiar contraseña con token
```

### Ejemplo de login:

```json
{
  "email": "admin@scryfall-jumpseller.com",
  "password": "your-password"
}
```

## 🧩 Módulos Principales

### 🃏 Magic Cards

Gestión completa de cartas con integración automática a Scryfall y Jumpseller.

```bash
# Endpoints principales
GET    /backend/v1/magic-cards                    # Listar con filtros
GET    /backend/v1/magic-cards/:id                # Obtener por ID
POST   /backend/v1/magic-cards/:id/variant        # Crear nueva variante
GET    /backend/v1/magic-cards/:id/search-lang    # Buscar por idioma

# Filtros disponibles: search, status, lang, from, to
```

**Características especiales:**

- Procesamiento automático de cartas de doble cara
- Mapeo inteligente de SKUs con formato `M-{SET}{NUMBER}-{LANG}-{CONDITION}`
- Creación automática de variantes por idioma y condición
- Integración de imágenes automática a Jumpseller

### 🛒 Jumpseller Integration

Cliente completo para la API de Jumpseller con manejo de errores robusto.

```bash
GET    /backend/v1/jumpseller/products     # Sincronizar productos
POST   /backend/v1/jumpseller/webhook      # Webhook ventas (implementar)
```

**Funcionalidades:**

- Creación automática de productos base (en inglés)
- Generación de variantes por idioma/condición/finish
- Subida automática de imágenes (principal + caras)
- Sincronización de custom fields
- Actualización de stock en tiempo real

### ⚙️ Process & Queues

Motor de procesamiento asíncrono con BullMQ.

```bash
POST   /backend/v1/process/magic-cards     # Procesar cartas pendientes
POST   /backend/v1/process/stock           # Actualizar inventario
POST   /backend/v1/process/prices          # Recalcular precios
```

**Colas disponibles:**

- `queues-magic`: Procesamiento cartas Magic (delay: 0ms, LIFO)
- `queues-stock`: Actualización stock (delay: 3s, LIFO)
- `queues-api-prices`: Obtención precios APIs (delay: 3s, LIFO)
- `queues-recalculate-prices`: Recálculo precios (delay: 3s, LIFO)

**Dashboard**: `/admin/queues`

### 📦 Staging Product Variants

Sistema avanzado de inventario con estados de precio y stock.

```bash
GET    /backend/v1/staging-product-variant           # Listar variantes
PUT    /backend/v1/staging-product-variant/:id       # Actualizar variante
POST   /backend/v1/staging-product-variant/stock     # Actualizar stock masivo
```

**Estados disponibles:**

```typescript
enum EnumPriceAndStockState {
  PENDING = 'pending',
  COMPLETED = 'completed',
  ERROR = 'error',
}
```

### 👥 Users Management

Gestión de usuarios con roles y autenticación.

```bash
GET    /backend/v1/users                # Listar usuarios (Admin/User)
GET    /backend/v1/users/:id            # Obtener usuario (Admin/User)
POST   /backend/v1/users               # Crear usuario (Admin only)
PUT    /backend/v1/users/:id           # Actualizar usuario (Admin only)
PATCH  /backend/v1/users/:id/isActive  # Toggle activo (Admin only)
DELETE /backend/v1/users/:id           # Eliminar usuario (Admin only)
```

## 📊 Sistema de Precios

### Dual pricing system:

1. **USD Prices**: Precios obtenidos de APIs externas
2. **Base Prices**: Precios base configurables internamente

### Cálculo automático:

```typescript
// Ejemplo de cálculo de precio final
const finalPrice = usdPrice * exchangeRate + basePrice + margin;
```

## 🔄 Scheduler Automático

El sistema incluye un scheduler que ejecuta tareas automáticamente:

```typescript
@Cron(CronExpression.EVERY_WEEK)
async syncRefreshTokenApp() {
  // Ejecuta procesamiento semanal de cartas Magic
  await this.processService.initCardMagic();
}
```

## ️ Base de Datos

### Opciones de MongoDB:

#### 1. MongoDB Local (Docker)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

```env
DB_URI=mongodb://localhost:27017/scryfall-jumpseller
```

#### 2. MongoDB Atlas (Recomendado para producción)

```env
# Ejemplo de URI para MongoDB Atlas
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/scryfall-jumpseller?retryWrites=true&w=majority
```

#### 3. MongoDB local instalado

```bash
# Instalar MongoDB Community Edition localmente
# Configurar servicio y puerto 27017
```

```env
DB_URI=mongodb://localhost:27017/scryfall-jumpseller
```

### Herramientas de gestión:

#### MongoDB Compass (Recomendado)

- **Descarga**: https://www.mongodb.com/products/compass
- **Funcionalidades**:
  - Interfaz visual para explorar datos
  - Editor de consultas con autocompletado
  - Análisis de rendimiento e índices
  - Gestión de esquemas y validaciones

#### MongoDB Atlas Dashboard

- **Acceso**: https://cloud.mongodb.com
- **Funcionalidades**:
  - Monitoring en tiempo real
  - Backups automáticos
  - Alertas personalizadas
  - Escalado automático

### Colecciones MongoDB:

```typescript
// Colecciones principales con sus esquemas
users; // Usuarios del sistema
magicCards; // Cartas Magic con datos Scryfall
stagingProductVariants; // Variantes de productos e inventario
usdPrices; // Precios en USD
basePrices; // Precios base
auth; // Registros de autenticación
```

### Índices recomendados:

```javascript
// En MongoDB Compass o Atlas
db.magicCards.createIndex({ oracleId: 1 });
db.magicCards.createIndex({ set: 1, collectorNumber: 1, lang: 1 });
db.stagingProductVariants.createIndex({ variantId: 1, productId: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

### Configuración para Atlas:

```env
# Variables adicionales para MongoDB Atlas
DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scryfall-jumpseller
DB_NAME=scryfall-jumpseller

# Opcional: Configuración de SSL/TLS
DB_SSL=true
DB_AUTH_SOURCE=admin
```

## 🚀 Despliegue

### Producción con Docker

1. **Configurar variables**

```bash
cp docker/prod/.env.example docker/prod/.env
# Editar docker/prod/.env con valores de producción
```

2. **Desplegar**

```bash
npm run docker:prod
```

### Producción manual con PM2

1. **Compilar**

```bash
npm run build
```

2. **Configurar PM2**

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🔍 Monitoring y Observabilidad

### Logs estructurados:

- **Winston**: Logs locales con rotación diaria
- **Console**: Logs de desarrollo con colores

### Ubicaciones:

```bash
logs/
├── error-YYYY-MM-DD.log      # Solo errores
├── combined-YYYY-MM-DD.log   # Todos los logs
├── exceptions-YYYY-MM-DD.log # Excepciones no capturadas
└── rejections-YYYY-MM-DD.log # Promise rejections
```

### Métricas disponibles:

- Health check endpoint
- Queue metrics en dashboard
- Request logging con interceptor
- Error tracking automático

## 🤝 Contribución

1. **Fork** del repositorio
2. **Crear rama** feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. **Push** (`git push origin feature/nueva-funcionalidad`)
5. **Pull Request** con descripción detallada

### Convenciones:
- **Código**: ESLint + Prettier configurados

## 📝 Notas Técnicas

### Comandos útiles NestJS:

```bash
# Generar recursos completos
nest g resource modules/nuevo-modulo

# Generar componentes individuales
nest g module modules/nuevo-modulo
nest g controller modules/nuevo-modulo
nest g service modules/nuevo-modulo
```

### Variables críticas:

- `JWT_SECRET`: Debe ser único y seguro por ambiente
- `JUMPSELLER_*`: Requeridas para integración e-commerce
- `DB_URI`: MongoDB local, Atlas o replicaSet para transacciones
- `CACHE_URL`: Redis para colas BullMQ

### Limpieza Docker:

```bash
# Limpiar todo
docker system prune -a

# Limpiar solo volúmenes
docker volume prune
```

## ⚠️ Consideraciones Importantes

1. **Rate Limiting**: Scryfall tiene límites de 50-100 req/s
2. **Delays**: Configurados delays de 300ms entre llamadas API
3. **Error Handling**: Manejo robusto de errores de APIs externas
4. **Memory**: Límite PM2 de 1GB para evitar memory leaks
5. **Security**: Validación estricta con Joi y class-validator

## 🆘 Soporte

- **Issues**: Crear en el repositorio GitLab/GitHub
- **Documentación**: README actualizado
- **Team**: Contactar equipo de desarrollo
- **Logs**: Consultar `/admin/queues` y archivos de log

---

**Versión**: 0.0.1  
**Node.js**: 22+  
**NestJS**: 10.4+
