# Magic Forever Backend

Sistema backend desarrollado en NestJS para la gestión de cartas de Magic: The Gathering, integrado con Jumpseller para e-commerce y Scryfall para datos de cartas.

## 🚀 Características Principales

- **API REST** completa con documentación Swagger
- **Autenticación JWT** con roles y permisos
- **Integración con Scryfall** para datos de cartas Magic
- **Integración con Jumpseller** para e-commerce
- **Sistema de colas** con BullMQ para procesamiento asíncrono
- **Gestión de precios** en USD y precios base
- **Sistema de inventario** con variantes de productos
- **Envío de emails** con plantillas Handlebars
- **Logging avanzado** con Winston y Loki
- **Base de datos MongoDB** con Mongoose
- **Cache Redis** para optimización
- **Dockerización** completa para desarrollo y producción

## 📋 Requisitos

- Node.js 22+
- npm/pnpm
- MongoDB
- Redis
- Docker (opcional)

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd Magic-Forever-Backend
```

2. **Instalar dependencias**
```bash
npm install
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
APP_NAME=Magic Forever Backend

# Seguridad
JWT_SECRET=your-jwt-secret
JWT_HOURS_EXPIRE=24

# URLs
URL_APP_BACKEND=http://localhost:8000
URL_APP_FRONTEND=http://localhost:3000

# Base de datos
DB_NAME=magic-forever
DB_URI=mongodb://localhost:27017

# Cache
CACHE_URL=redis://localhost:6379
CACHE_PORT=6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_NAME=Magic Forever
MAIL_FROM_ADDRESS=your-email@gmail.com

# Jumpseller API
JUMPSELLER_LOGIN=your-jumpseller-login
JUMPSELLER_AUTHTOKEN=your-jumpseller-token
```

5. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o
pnpm run dev
```

### Con Docker

1. **Desarrollo con Docker**
```bash
npm run docker:dev
```

2. **Producción con Docker**
```bash
npm run docker:prod
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # Autenticación y autorización
├── common/                  # Utilidades compartidas
│   ├── adapters/           # Adaptadores HTTP
│   ├── dto/                # DTOs comunes
│   ├── enums/              # Enumeraciones
│   ├── interfaces/         # Interfaces comunes
│   ├── interceptor/        # Interceptores
│   ├── logger/             # Sistema de logging
│   └── services/           # Servicios comunes
├── config/                  # Configuración
├── jobs/                    # Sistema de trabajos/colas
├── modules/                 # Módulos principales
│   ├── files/              # Gestión de archivos
│   ├── jumpseller/         # Integración Jumpseller
│   ├── magic/              # Cartas Magic: The Gathering
│   │   ├── entities/       # Entidades de cartas
│   │   ├── mappers/        # Mapeadores de datos
│   │   └── submodules/     # Submódulos (Scryfall)
│   ├── mail/               # Sistema de emails
│   ├── prices/             # Gestión de precios
│   │   ├── base-prices/    # Precios base
│   │   └── usd-prices/     # Precios en USD
│   ├── process/            # Procesamiento de datos
│   │   └── queues/         # Colas de procesamiento
│   ├── products/           # Productos y variantes
│   └── users/              # Gestión de usuarios
└── main.ts                 # Punto de entrada
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev                  # Ejecutar en modo desarrollo
npm run start               # Ejecutar en modo producción
npm run build               # Compilar para producción

# Testing
npm run test                # Ejecutar tests
npm run test:watch          # Tests en modo watch
npm run test:cov            # Tests con cobertura
npm run test:e2e            # Tests end-to-end

# Linting y formato
npm run lint                # Ejecutar ESLint
npm run format              # Formatear código con Prettier

# Docker
npm run docker:dev          # Ejecutar contenedor de desarrollo
npm run docker:dev:build    # Construir imagen de desarrollo
npm run docker:dev:stop     # Detener contenedor de desarrollo
npm run docker:dev:logs     # Ver logs de desarrollo

npm run docker:prod         # Ejecutar contenedor de producción
npm run docker:prod:build   # Construir imagen de producción
npm run docker:prod:stop    # Detener contenedor de producción
npm run docker:prod:logs    # Ver logs de producción

npm run docker:stop:all     # Detener todos los contenedores
```

## 📚 Documentación API

Una vez ejecutado el proyecto, la documentación Swagger estará disponible en:
- **Desarrollo**: http://localhost:8000/backend/docs
- **Producción**: https://your-domain.com/backend/docs

## 🔐 Autenticación

El sistema utiliza JWT con los siguientes roles:
- `Admin`: Acceso completo al sistema
- `User`: Acceso limitado a funcionalidades básicas

### Endpoints principales:
- `POST /backend/auth/login` - Iniciar sesión
- `POST /backend/auth/recover_pass` - Recuperar contraseña
- `POST /backend/auth/new-password` - Cambiar contraseña

## 🧩 Módulos Principales

### Magic Cards
Gestión completa de cartas Magic: The Gathering con integración a Scryfall.

```bash
GET    /backend/magic-cards           # Listar cartas con paginación
GET    /backend/magic-cards/:id       # Obtener carta por ID
POST   /backend/magic-cards/create    # Crear nueva carta
```

### Jumpseller Integration
Integración completa con la plataforma de e-commerce Jumpseller.

```bash
GET    /backend/jumpseller/products   # Sincronizar productos
POST   /backend/jumpseller/webhook    # Webhook de ventas
```

### Process & Queues
Sistema de procesamiento asíncrono con colas.

```bash
POST   /backend/process/magic         # Procesar cartas Magic
POST   /backend/process/stock         # Actualizar inventario
POST   /backend/process/prices        # Actualizar precios
```

### Products & Variants
Gestión de productos y sus variantes.

```bash
GET    /backend/staging-product-variant     # Gestionar variantes
```

## 🔄 Sistema de Colas

El proyecto utiliza BullMQ para procesamiento asíncrono:

- **queues-magic**: Procesamiento de cartas Magic
- **queues-stock**: Actualización de inventario
- **queues-api-prices**: Actualización de precios
- **queues-recalculate-prices**: Recálculo de precios

Dashboard disponible en: `/admin/queues`

## 📧 Sistema de Emails

Configurado con Nodemailer y plantillas Handlebars para:
- Recuperación de contraseñas
- Notificaciones del sistema
- Confirmaciones de acciones

## 🗃️ Base de Datos

### Colecciones principales:
- `users`: Usuarios del sistema
- `magicCards`: Cartas Magic: The Gathering
- `products`: Productos de la tienda
- `stagingProductVariants`: Variantes de productos
- `usdPrices`: Precios en USD
- `basePrices`: Precios base

## 🚀 Despliegue

### Producción con Docker

1. **Configurar variables de producción**
```bash
cp docker/prod/.env.example docker/prod/.env
```

2. **Ejecutar en producción**
```bash
npm run docker:prod
```

### Producción manual

1. **Compilar el proyecto**
```bash
npm run build
```

2. **Ejecutar con PM2**
```bash
pm2 start ecosystem.config.js --env production
```

## 🔍 Monitoring y Logs

- **Logs**: Almacenados en `/app/logs` (en Docker)
- **Health Check**: `GET /backend/health`
- **Queue Dashboard**: `/admin/queues`
- **API Docs**: `/backend/docs`

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests end-to-end
npm run test:e2e
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Notas de Desarrollo

### Comandos útiles:

```bash
# Generar nuevo módulo
nest g module modules/nombre-modulo

# Generar controlador
nest g controller modules/nombre-modulo

# Generar servicio
nest g service modules/nombre-modulo

# Limpiar cache de Docker
docker system prune -a
```

### Variables de entorno importantes:
- Todas las variables son requeridas excepto las marcadas como opcionales
- Los secretos JWT deben ser únicos por ambiente
- Las credenciales de Jumpseller son necesarias para la integración completa

## 📄 Licencia

Este proyecto es privado y propietario de Fixlabs.

## 🆘 Soporte

Para soporte técnico, contactar al equipo de desarrollo o crear un issue en el repositorio.
