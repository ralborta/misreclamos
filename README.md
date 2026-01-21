# MisReclamos

Sistema de gestión de reclamos y casos legales con integración de WhatsApp.

## Stack Técnico

- **Frontend/Backend**: Next.js 16.1.1 (App Router, TypeScript, Tailwind)
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma 6.19.1
- **Auth**: iron-session
- **WhatsApp**: BuilderBot.cloud
- **Storage**: Vercel Blob (para adjuntos)
- **IA**: OpenAI (para resúmenes automáticos)

## Configuración

### Variables de Entorno

Copia `env.example` a `.env` y configura las siguientes variables:

- `DATABASE_URL`: Connection string de PostgreSQL
- `APP_PASSWORD`: Password para login de la aplicación
- `SESSION_PASSWORD`: Secret para iron-session (mínimo 32 caracteres)
- `BUILDERBOT_BOT_ID`: ID del bot en BuilderBot.cloud
- `BUILDERBOT_API_KEY`: API key de BuilderBot
- `BUILDERBOT_BASE_URL`: URL base de BuilderBot (default: https://app.builderbot.cloud)
- `BLOB_READ_WRITE_TOKEN`: Token de Vercel Blob para adjuntos
- `OPENAI_API_KEY`: API key de OpenAI para resúmenes automáticos

### Instalación

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
```

### Desarrollo

```bash
pnpm dev
```

## Integración de WhatsApp

El sistema está integrado con BuilderBot.cloud para recibir y enviar mensajes de WhatsApp.

### Webhook

Configura el webhook en BuilderBot.cloud apuntando a:
```
https://tu-dominio.vercel.app/api/whatsapp/inbound
```

El webhook procesa:
- `message.incoming`: Mensajes entrantes del cliente
- `message.outgoing`: Mensajes salientes del agente

### Características

- ✅ Idempotencia por `externalMessageId`
- ✅ Procesamiento de adjuntos (imágenes, videos, documentos, PDFs)
- ✅ Subida automática a Vercel Blob Storage
- ✅ Creación automática de reclamos
- ✅ Respuestas automáticas
- ✅ Escalación automática según keywords

## Estructura del Proyecto

- `src/app/api/whatsapp/inbound/route.ts`: Webhook principal de WhatsApp
- `src/lib/builderbot.ts`: Servicio para enviar mensajes
- `src/lib/blob.ts`: Manejo de adjuntos
- `src/lib/tickets.ts`: Utilidades para reclamos
- `prisma/schema.prisma`: Schema de base de datos

## Licencia

Privado
