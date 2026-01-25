# ✅ Verificar Base de Datos en Railway

## Paso 1: Verificar que las tablas existen

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Query"** (o "Data" → "Query")
3. Ejecuta esta query:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Deberías ver estas 7 tablas:**
- `Customer`
- `AgentUser`
- `Ticket`
- `TicketMessage`
- `TicketEvent`
- `Tag`
- `TicketTag`

Si **NO** ves estas tablas, necesitas aplicar las migraciones (ver Paso 2).

---

## Paso 2: Verificar campos legales

Ejecuta esta query para verificar que los campos legales existen:

```sql
-- Verificar campos en Customer
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Customer' 
AND column_name IN ('dni', 'email', 'address', 'dateOfBirth', 'notes', 'updatedAt');

-- Verificar campos en Ticket
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Ticket' 
AND column_name IN ('expedienteNumber', 'court', 'legalType', 'amount', 'importantDates', 'caseNotes');

-- Verificar campos en AgentUser
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'AgentUser' 
AND column_name IN ('matricula', 'especializacion', 'updatedAt');
```

**Deberías ver:**
- Customer: 6 columnas (dni, email, address, dateOfBirth, notes, updatedAt)
- Ticket: 6 columnas (expedienteNumber, court, legalType, amount, importantDates, caseNotes)
- AgentUser: 3 columnas (matricula, especializacion, updatedAt)

---

## Paso 3: Verificar categorías legales

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketCategory')
ORDER BY enumsortorder;
```

**Deberías ver:**
- LABORAL
- CIVIL
- COMERCIAL
- PENAL
- FAMILIA
- ADMINISTRATIVO
- TRIBUTARIO
- PREVISIONAL
- OTRO

---

## ❌ Si falta algo: Aplicar Migraciones

### Opción A: Todo de una vez (Recomendado)

1. Ve a Railway → Database → **Query**
2. Abre el archivo `scripts/apply-migrations.sql` en tu editor
3. Copia **TODO** el contenido
4. Pégalo en Railway Query
5. Ejecuta

Esto aplicará todas las migraciones en orden.

### Opción B: Una por una

Si prefieres aplicar migraciones individuales, ejecuta en este orden:

1. `prisma/migrations/20251226145518_init/migration.sql`
2. `prisma/migrations/20251229115247_add_ai_summary_fields/migration.sql`
3. `prisma/migrations/20251229191953_add_phone_to_agent_user/migration.sql`
4. `prisma/migrations/20251229193218_add_contact_name_to_ticket/migration.sql`
5. `prisma/migrations/20251229201441_add_attachments_to_ticket_message/migration.sql`
6. `prisma/migrations/20250130000000_add_legal_fields/migration.sql`

---

## ✅ Verificación rápida

Ejecuta esta query para ver un resumen:

```sql
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Customer' AND column_name IN ('dni', 'email', 'address')) as customer_legal_fields,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name IN ('expedienteNumber', 'court', 'legalType')) as ticket_legal_fields;
```

**Resultado esperado:**
- `total_tables`: 7
- `customer_legal_fields`: 3 (o más)
- `ticket_legal_fields`: 3 (o más)

---

## 🔗 Copiar DATABASE_URL

Una vez que todo esté verificado:

1. En Railway → Database → **Variables**
2. Copia el `DATABASE_URL`
3. Pégalo en Vercel → Environment Variables → `DATABASE_URL`

¡Listo! 🎉
