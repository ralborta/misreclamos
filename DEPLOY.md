# Guía de Deploy - MisReclamos

## 🚂 Railway (Base de Datos PostgreSQL)

### Opción 1: Desde la Web (Recomendado)

1. Ve a https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta de GitHub y selecciona el repo `misreclamos`
5. Railway creará un proyecto vacío

### Agregar Base de Datos PostgreSQL

1. En tu proyecto Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente una base de datos PostgreSQL
4. Click en la base de datos → **"Variables"** tab
5. Copia el `DATABASE_URL` (lo necesitarás para Vercel)

### Aplicar Migraciones

**Opción A: Desde Railway Dashboard (Recomendado)**
1. Ve a tu base de datos en Railway
2. Click en **"Query"** tab
3. Copia y pega TODO el contenido del archivo `scripts/apply-migrations.sql`
4. Ejecuta la query (esto aplicará todas las migraciones de una vez)
5. Verifica que no haya errores

**Opción B: Migraciones Individuales**
Si prefieres aplicar una por una, ejecuta en orden:
1. `prisma/migrations/20251226145518_init/migration.sql`
2. `prisma/migrations/20251229115247_add_ai_summary_fields/migration.sql`
3. `prisma/migrations/20251229191953_add_phone_to_agent_user/migration.sql`
4. `prisma/migrations/20251229193218_add_contact_name_to_ticket/migration.sql`
5. `prisma/migrations/20251229201441_add_attachments_to_ticket_message/migration.sql`
6. `prisma/migrations/20250130000000_add_legal_fields/migration.sql`

**Opción C: Desde Railway CLI**
```bash
# Instalar Railway CLI (si no lo tienes)
npm i -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Aplicar migraciones
railway run pnpm prisma migrate deploy
```

**Verificar que la DB está creada:**
```bash
# Localmente (con DATABASE_URL configurado)
npx tsx scripts/check-db.ts
```

### Módulos en Railway

Sí, Railway tiene **módulos/plugins** para bases de datos:

- **PostgreSQL**: Base de datos estándar
- **PostgreSQL 18 HA Cluster**: Con replicación y alta disponibilidad
- **TimescaleDB + PostGIS**: Para datos temporales y geográficos
- **Redis**: Cache y sesiones
- **MySQL**: Base de datos alternativa

Para este proyecto, **PostgreSQL estándar** es suficiente.

---

## ☁️ Vercel (Deployment de la App)

### Opción 1: Desde la Web (Recomendado)

1. Ve a https://vercel.com
2. Click en **"Add New Project"**
3. **Import Git Repository** → Selecciona `misreclamos`
4. Framework Preset: **Next.js** (debería detectarlo automáticamente)
5. Build Command: `pnpm install --frozen-lockfile && pnpm build`
6. Output Directory: `.next` (default)

### Variables de Entorno en Vercel

En **"Environment Variables"**, agrega todas estas:

```env
# Base de datos (de Railway)
DATABASE_URL=postgresql://postgres:password@host:port/railway?sslmode=require

# Autenticación (opcional por ahora, pero recomendado)
APP_PASSWORD=tu-password-seguro-aqui
SESSION_PASSWORD=tu-session-secret-key-minimo-32-caracteres-para-seguridad

# BuilderBot / WhatsApp
BUILDERBOT_BOT_ID=tu-bot-id-de-builderbot
BUILDERBOT_API_KEY=tu-api-key-de-builderbot
BUILDERBOT_BASE_URL=https://app.builderbot.cloud
BUILDERBOT_API_URL=https://app.builderbot.cloud

# Vercel Blob Storage (para adjuntos)
BLOB_READ_WRITE_TOKEN=tu-token-de-vercel-blob

# OpenAI (para resúmenes automáticos)
OPENAI_API_KEY=sk-proj-tu-api-key-de-openai
```

**Nota**: Por ahora puedes dejar `APP_PASSWORD` vacío para hacer login sin password.

7. Click en **"Deploy"**

### Opción 2: Desde Vercel CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Agregar variables de entorno
vercel env add DATABASE_URL
vercel env add APP_PASSWORD
# ... etc
```

---

## 🔗 Configurar Webhook en BuilderBot

Una vez que Vercel te dé la URL (ej: `https://misreclamos.vercel.app`):

1. Ve a BuilderBot.cloud → Tu proyecto
2. **Desarrollador** → **Webhooks**
3. Agrega webhook para `message.incoming`:
   - **URL**: `https://misreclamos.vercel.app/api/whatsapp/inbound`
   - **Método**: POST
   - **Content-Type**: application/json
4. Agrega webhook para `message.outgoing` (misma URL)

---

## ✅ Verificar que todo funciona

1. **Login**: Ve a `https://tu-app.vercel.app/login` (debería funcionar sin password si no configuraste APP_PASSWORD)
2. **Base de datos**: Deberías poder ver tickets/reclamos en el dashboard
3. **WhatsApp**: Envía un mensaje de prueba a tu bot de BuilderBot

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL not found"
- Verifica que agregaste la variable en Vercel
- Asegúrate de copiar el `DATABASE_URL` completo de Railway

### Error: "Migration failed"
- Verifica que aplicaste todas las migraciones en Railway
- Revisa los logs en Railway → Database → Logs

### Error: "APP_PASSWORD no configurada"
- Esto es normal, el login funcionará sin password
- Si quieres activarlo, agrega `APP_PASSWORD` en Vercel
