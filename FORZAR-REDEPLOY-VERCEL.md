# 🔄 Forzar Redeploy en Vercel

## ⚠️ Problema

Después de cambiar `DATABASE_URL` en Vercel, el deploy no se actualiza automáticamente.

---

## ✅ Solución: Redeploy Manual

### Opción 1: Desde Vercel Dashboard (Más fácil)

1. Ve a **Vercel** → Tu proyecto → **Deployments**
2. Busca el **último deployment** (el más reciente)
3. Click en los **3 puntos** (⋮) a la derecha
4. Click en **"Redeploy"**
5. **IMPORTANTE**: Marca la casilla **"Use existing Build Cache"** como **DESMARCADA** (para forzar rebuild)
6. Click en **"Redeploy"**

Esto forzará a Vercel a usar las nuevas variables de entorno.

---

### Opción 2: Hacer un commit vacío (Forzar redeploy)

Si el redeploy manual no funciona, puedes hacer un commit vacío:

```bash
cd /Users/ralborta/misreclamos
git commit --allow-empty -m "chore: Force redeploy to apply DATABASE_URL changes"
git push
```

Esto forzará a Vercel a hacer un nuevo deploy con las variables actualizadas.

---

## 🔍 Verificar que DATABASE_URL está correcta

Antes de redeploy, verifica en Vercel:

1. **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca `DATABASE_URL`
3. Verifica que tenga la URL **pública** (no `postgres.railway.internal`)
4. Debe ser algo como:
   ```
   postgresql://postgres:PASSWORD@nozomi.proxy.rlwy.net:23031/railway?sslmode=require
   ```
5. Verifica que esté configurada para:
   - ✅ **Production**
   - ✅ **Preview** 
   - ✅ **Development**

---

## ⚠️ Si aún no funciona

Si después del redeploy sigue intentando usar `postgres.railway.internal`:

1. **Elimina** la variable `DATABASE_URL` en Vercel
2. **Espera** 30 segundos
3. **Crea** la variable nuevamente con la URL pública
4. **Redeploy** manualmente

A veces Vercel cachea las variables y necesita eliminarlas y recrearlas.

---

## 📝 URL Correcta para Vercel

Asegúrate de usar esta URL (pública, no interna):

```
postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@nozomi.proxy.rlwy.net:23031/railway?sslmode=require
```

**NO uses:**
```
postgresql://postgres:...@postgres.railway.internal:5432/railway
```
