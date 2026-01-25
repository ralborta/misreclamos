# 🔧 Configurar DATABASE_URL en Vercel

## ⚠️ Problema Actual

Vercel está intentando conectarse a `postgres.railway.internal:5432`, pero esa URL es **interna** y solo funciona dentro de Railway.

Vercel necesita la **URL pública** de Railway.

---

## ✅ Solución: Usar URL Pública en Vercel

### Paso 1: Obtener URL Pública de Railway

1. Ve a **Railway** → Tu proyecto → **PostgreSQL Database**
2. Click en **"Settings"** → **"Networking"**
3. Busca la sección **"Public Networking"**
4. Deberías ver algo como:
   - `postgres-production-3c3dd.up.railway.app:5432`
   - O un proxy: `nozomi.proxy.rlwy.net:23031`

### Paso 2: Construir DATABASE_URL Pública

Usa esta estructura:

```
postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require
```

**Ejemplo con el dominio público:**
```
postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@postgres-production-3c3dd.up.railway.app:5432/railway?sslmode=require
```

**O con el proxy (si el dominio público no funciona):**
```
postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@nozomi.proxy.rlwy.net:23031/railway?sslmode=require
```

### Paso 3: Configurar en Vercel

1. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca `DATABASE_URL`
3. **Edita** o **Crea** la variable con la URL pública (no la interna)
4. Asegúrate de que esté configurada para **Production**, **Preview**, y **Development**
5. Click en **Save**

### Paso 4: Redeploy

Después de cambiar la variable:
1. Ve a **Vercel** → Tu proyecto → **Deployments**
2. Click en los **3 puntos** del último deployment
3. Click en **Redeploy**

O simplemente haz un nuevo commit y push (Vercel redeploy automáticamente).

---

## 🔍 Verificar

Después del redeploy, la aplicación debería poder conectarse a la base de datos.

Si aún hay problemas, verifica:
- ✅ La URL pública está correcta
- ✅ El password es correcto
- ✅ `?sslmode=require` está al final
- ✅ La variable está configurada para todos los ambientes (Production, Preview, Development)

---

## 📝 Nota sobre URLs

- **URL Interna** (`postgres.railway.internal`): Solo funciona dentro de Railway
- **URL Pública** (`*.railway.app` o `*.proxy.rlwy.net`): Funciona desde cualquier lugar (Vercel, tu máquina, etc.)

**Vercel necesita la URL pública.**
