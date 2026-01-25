# 🚀 Aplicar Migraciones AHORA - Guía Paso a Paso

## Opción 1: Railway CLI (Automático) ⚡

Si tienes Railway CLI instalado (ya lo tienes), ejecuta estos comandos:

```bash
cd /Users/ralborta/misreclamos

# 1. Linkear al proyecto (te pedirá seleccionar el proyecto)
railway link

# 2. Aplicar migraciones
railway run pnpm prisma migrate deploy
```

**Nota:** `railway link` abrirá un navegador o te pedirá seleccionar el proyecto. Selecciona el proyecto que tiene tu base de datos PostgreSQL.

---

## Opción 2: Desde Railway Dashboard (Manual) 🖱️

Si prefieres hacerlo manualmente desde la web:

### Paso 1: Obtener DATABASE_URL

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Variables"** tab
3. Copia el valor de `DATABASE_URL` (algo como: `postgresql://postgres:password@host:port/railway?sslmode=require`)

### Paso 2: Configurar localmente

Crea un archivo `.env` en el proyecto (si no existe):

```bash
cd /Users/ralborta/misreclamos
echo "DATABASE_URL=tu-database-url-aqui" > .env
```

Reemplaza `tu-database-url-aqui` con el `DATABASE_URL` que copiaste.

### Paso 3: Aplicar migraciones

```bash
cd /Users/ralborta/misreclamos
pnpm prisma migrate deploy
```

---

## Opción 3: Railway Query (Copiar/Pegar SQL) 📋

Si las opciones anteriores no funcionan:

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Query"** (o "Data" → "Query")
3. Abre el archivo `scripts/apply-migrations.sql` en tu editor
4. **Copia TODO** el contenido del archivo
5. Pégalo en Railway Query
6. Click en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

---

## ✅ Verificar que funcionó

Después de aplicar las migraciones, verifica ejecutando en Railway Query:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Deberías ver 7 tablas:
- Customer
- AgentUser
- Ticket
- TicketMessage
- TicketEvent
- Tag
- TicketTag

---

## 🆘 Si hay errores

Si ves errores como "table already exists" o "type already exists", significa que algunas migraciones ya se aplicaron. En ese caso:

- **Opción A:** Usa `pnpm prisma migrate deploy` (es idempotente, solo aplica lo que falta)
- **Opción B:** Ignora esos errores y continúa con las siguientes migraciones
