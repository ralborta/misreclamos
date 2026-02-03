# Importar datos legado (Excel → tabla Legado)

## ¿Por qué esta tabla?

- **Misma DB (Railway):** ~1500 registros no son problema. La tabla `Legado` vive en tu base actual.
- **Sin tocar datos nuevos:** Los tickets/clientes actuales siguen igual; el legado queda en una tabla aparte para consulta o migración futura.

## Pasos

### 1. Aplicar la migración

En tu entorno (local o donde tengas `DATABASE_URL` apuntando a Railway):

```bash
pnpm exec prisma migrate deploy
```

Si prefieres aplicar solo esta migración a mano en Railway (pestaña Query o CLI), ejecuta el SQL en:

`prisma/migrations/20260203120000_add_legado_table/migration.sql`

### 2. Instalar dependencias del script (si falta algo)

```bash
pnpm install
```

### 3. Cargar el Excel

Pon tu archivo en una ruta accesible (ej. `./reclamos-legado.xlsx`) y ejecuta:

```bash
pnpm run import-legado ./reclamos-legado.xlsx
```

O con variable de entorno:

```bash
LEGADO_EXCEL=./reclamos-legado.xlsx pnpm run import-legado
```

Opcional: guardar un nombre de origen para saber de qué archivo vino cada carga:

```bash
LEGADO_SOURCE="reclamos-2024.xlsx" pnpm run import-legado ./reclamos-legado.xlsx
```

### 4. Qué hace el script

- Lee la **primera hoja** del Excel.
- Cada **fila** se guarda como un registro en `Legado`:
  - **data:** objeto JSON con todas las columnas de esa fila (nombres de columna = claves).
  - **source:** nombre del archivo (o el que pongas en `LEGADO_SOURCE`).
- No necesitas definir columnas fijas: todo el contenido del Excel se conserva en `data`.

## Consultar los datos

Desde Prisma o SQL:

```sql
SELECT id, "source", "createdAt", data FROM "Legado" LIMIT 10;
```

O en la app puedes exponer una API/ruta que lea de `prisma.legado.findMany()` cuando quieras listar o buscar en el legado.
