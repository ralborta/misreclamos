# 🚀 Setup Automático desde GitHub

## ✅ Lo que SÍ está en GitHub

- ✅ Todas las migraciones SQL (`prisma/migrations/`)
- ✅ Schema de Prisma (`prisma/schema.prisma`)
- ✅ Scripts de migración (`scripts/apply-migrations.sql`)
- ✅ Configuración de Railway (`railway.json`, `nixpacks.toml`)

## ⚠️ Lo que Railway NO hace automáticamente

Railway **NO ejecuta migraciones automáticamente** por seguridad. Tienes 2 opciones:

---

## Opción 1: Aplicar Migraciones Manualmente (Recomendado - 2 minutos)

### Desde Railway Dashboard:

1. Railway → Tu proyecto → **PostgreSQL Database**
2. Click en **"Query"**
3. Abre `scripts/apply-migrations.sql` en tu editor
4. **Copia TODO** el contenido
5. Pégalo en Railway Query y ejecuta

✅ **Ventaja**: Tienes control total, ves los errores inmediatamente

---

## Opción 2: Automatizar con Railway Service

Puedes crear un servicio en Railway que ejecute las migraciones automáticamente:

### Configurar servicio de migraciones:

1. En Railway → Tu proyecto → **"+ New"**
2. Selecciona **"GitHub Repo"** → `misreclamos`
3. En **Settings** → **Build Command**: `pnpm install && pnpm prisma generate`
4. En **Settings** → **Start Command**: `pnpm prisma migrate deploy && pnpm start`
5. Agrega la variable `DATABASE_URL` (Railway la detecta automáticamente si está en el mismo proyecto)

✅ **Ventaja**: Se ejecuta automáticamente en cada deploy

⚠️ **Desventaja**: Si falla, el deploy falla (por eso es mejor hacerlo manual la primera vez)

---

## 🎯 Recomendación

**Para la primera vez**: Usa **Opción 1** (manual) para tener control.

**Para deploys futuros**: Si agregas nuevas migraciones, puedes:
- Aplicarlas manualmente en Railway Query
- O configurar un servicio separado que solo ejecute migraciones

---

## 📋 Checklist de Setup

- [ ] Railway: Base de datos PostgreSQL creada
- [ ] Railway: Migraciones aplicadas (ver `APLICAR-MIGRACIONES.md`)
- [ ] Railway: `DATABASE_URL` copiado
- [ ] Vercel: `DATABASE_URL` configurado en Environment Variables
- [ ] Vercel: Otras variables de entorno configuradas
- [ ] Vercel: Deploy exitoso
- [ ] BuilderBot: Webhook configurado

---

## 🔍 Verificar que todo funciona

```bash
# Localmente (con DATABASE_URL configurado)
npx tsx scripts/check-db.ts
```

O ejecuta en Railway Query:

```sql
SELECT COUNT(*) as total_tables 
FROM pg_tables 
WHERE schemaname = 'public';
```

Debería retornar: `7`
