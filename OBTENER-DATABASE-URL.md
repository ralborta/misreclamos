# 🔗 Obtener DATABASE_URL Externa de Railway

La URL que me diste (`postgres.railway.internal`) es **interna** y solo funciona dentro de Railway.

Necesitamos la **URL externa** para aplicarla desde tu máquina local.

## Cómo obtenerla:

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Variables"** tab
3. Busca `DATABASE_URL` o `POSTGRES_URL` o `PGDATABASE`
4. Debería ser algo como:
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```
   O:
   ```
   postgresql://postgres:password@host.railway.app:5432/railway?sslmode=require
   ```

**Nota:** La URL externa tiene un dominio como `containers-us-west-xxx.railway.app` o `host.railway.app`, NO `postgres.railway.internal`.

---

## Alternativa: Usar Railway Query (Más fácil)

Si no encuentras la URL externa, puedes aplicar las migraciones directamente desde Railway Query:

1. Railway → PostgreSQL Database → **Query**
2. Abre en GitHub: `scripts/apply-migrations.sql`
3. Copia TODO el contenido
4. Pégalo en Railway Query
5. Ejecuta

Esto es más fácil y no requiere DATABASE_URL externa.
