# 🚀 Aplicar Migraciones - Ejecuta estos comandos

## Opción 1: Script Automático (Más fácil)

Ejecuta estos comandos en tu terminal:

```bash
cd /Users/ralborta/misreclamos

# 1. Login en Railway (abrirá el navegador)
railway login

# 2. Linkear al proyecto (selecciona tu proyecto)
railway link

# 3. Aplicar migraciones
bash scripts/aplicar-migraciones.sh
```

---

## Opción 2: Comandos Manuales

Si prefieres ejecutar paso a paso:

```bash
cd /Users/ralborta/misreclamos

# 1. Login
railway login

# 2. Linkear
railway link

# 3. Aplicar migraciones
railway run pnpm prisma migrate deploy
```

---

## Opción 3: Desde Railway Dashboard (Sin terminal)

Si prefieres no usar terminal:

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Query"**
3. Abre en GitHub: `scripts/apply-migrations.sql`
4. **Copia TODO** el contenido (174 líneas)
5. Pégalo en Railway Query
6. Click en **"Run"**

---

## ✅ Verificar que funcionó

Después de aplicar, ejecuta en Railway Query:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Deberías ver 7 tablas.
