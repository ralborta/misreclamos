# 🚀 Aplicar Migraciones en Railway - Guía Rápida

## ⚠️ IMPORTANTE: Railway NO crea las tablas automáticamente

Railway solo crea la **instancia de PostgreSQL vacía**. Las tablas hay que crearlas **manualmente** aplicando las migraciones.

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Ir a Railway Query

1. Ve a **Railway** → Tu proyecto
2. Click en tu **PostgreSQL Database**
3. Click en **"Query"** (o "Data" → "Query")

### Paso 2: Aplicar Todas las Migraciones

1. Abre el archivo `scripts/apply-migrations.sql` en tu editor
2. **Copia TODO** el contenido (todo el archivo completo)
3. Pégalo en Railway Query
4. Click en **"Run"** o presiona `Ctrl+Enter`

### Paso 3: Verificar

Ejecuta esta query para verificar:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Deberías ver 7 tablas:**
- Customer
- AgentUser  
- Ticket
- TicketMessage
- TicketEvent
- Tag
- TicketTag

---

## 🔄 Alternativa: Railway CLI

Si prefieres usar la línea de comandos:

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link al proyecto
cd /Users/ralborta/misreclamos
railway link

# 4. Aplicar migraciones
railway run pnpm prisma migrate deploy
```

---

## ❓ ¿Por qué no se crean automáticamente?

Railway crea la **instancia de PostgreSQL** pero no ejecuta migraciones automáticamente porque:

1. **Seguridad**: No quiere ejecutar código SQL sin tu aprobación
2. **Flexibilidad**: Puedes tener múltiples ambientes (dev, staging, prod)
3. **Control**: Tú decides cuándo y cómo aplicar cambios

Por eso hay que aplicarlas **manualmente la primera vez**.

---

## ✅ Una vez aplicadas, ya está

Las migraciones solo se aplican **una vez**. Después, la base de datos queda configurada y lista para usar.

---

## 🆘 Si hay errores

Si ves errores como "table already exists" o "type already exists", significa que algunas migraciones ya se aplicaron. En ese caso:

1. Ejecuta solo las migraciones que faltan
2. O usa `prisma migrate deploy` que es idempotente (solo aplica lo que falta)
