# 🤖 Automatizar Migraciones en Railway

## ✅ Configuración Aplicada

He configurado Railway para que **ejecute las migraciones automáticamente** en cada deploy:

### Cambios realizados:

1. **`railway.json`**: 
   - `startCommand` ahora ejecuta: `pnpm prisma migrate deploy && pnpm start`
   - Esto aplica migraciones antes de iniciar la app

2. **`nixpacks.toml`**:
   - `cmd` ejecuta: `pnpm prisma migrate deploy && pnpm start`
   - Migraciones se ejecutan automáticamente

---

## 🚀 Cómo Funciona Ahora

### Si tienes un servicio en Railway conectado a GitHub:

1. **Primera vez**: Railway detectará los cambios y hará deploy
2. **Durante el deploy**: Ejecutará `pnpm prisma migrate deploy`
3. **Resultado**: Las tablas se crearán automáticamente

### Si NO tienes servicio en Railway aún:

**Opción A: Crear servicio que ejecute migraciones**

1. Railway → Tu proyecto → **"+ New"**
2. Selecciona **"GitHub Repo"** → `misreclamos`
3. Railway detectará `railway.json` y `nixpacks.toml`
4. En **Settings** → Verifica que el **Start Command** sea: `pnpm prisma migrate deploy && pnpm start`
5. Agrega `DATABASE_URL` como variable de entorno (Railway la detecta automáticamente si la DB está en el mismo proyecto)
6. Railway hará deploy y ejecutará las migraciones automáticamente

**Opción B: Aplicar manualmente una vez (más rápido)**

1. Railway → Database → **Query**
2. Copia `scripts/apply-migrations.sql`
3. Ejecuta

---

## ⚠️ Importante

- `prisma migrate deploy` es **idempotente**: solo aplica migraciones que faltan
- Si las tablas ya existen, no las recrea
- Es seguro ejecutarlo múltiples veces

---

## 🔍 Verificar

Después del deploy, verifica en Railway:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Deberías ver las 7 tablas creadas.

---

## 📝 Nota

Si prefieres aplicar las migraciones **solo una vez manualmente** y luego desactivar la ejecución automática, puedes:

1. Aplicar migraciones manualmente (Railway Query)
2. Cambiar `startCommand` a solo `pnpm start` en Railway Dashboard

Pero con la configuración actual, **se ejecutarán automáticamente** en cada deploy. ✅
