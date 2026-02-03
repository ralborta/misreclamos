# Aplicar migración botPausedAt (arregla error en Vercel)

Si la app en Vercel muestra **"Application error: a server-side exception has occurred"**, suele ser porque en producción falta la columna `botPausedAt` en la tabla `Customer`.

## Opción A: Prisma desde tu máquina

1. En tu proyecto, configura `DATABASE_URL` con la URL de producción (la misma de Vercel/Railway).
2. En la terminal:

```bash
cd /Users/ralborta/misreclamos
pnpm prisma migrate deploy
```

Si usás Railway:

```bash
railway link
railway run pnpm prisma migrate deploy
```

## Opción B: Ejecutar el SQL a mano (Railway / Vercel Postgres)

1. Entrá a tu base de datos (Railway → PostgreSQL → Query, o Vercel Data → Query).
2. Ejecutá este SQL:

```sql
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "botPausedAt" TIMESTAMP(3);
```

3. Guardá y volvé a cargar la app en Vercel.

---

Después de aplicar la migración, hacé un redeploy en Vercel si hace falta (o esperá a que se recargue solo).
