# 🔧 Troubleshooting: Vercel no se conecta a Railway DB

## ✅ Verificaciones

### 1. Verificar que el Redeploy se completó

1. Ve a **Vercel** → Tu proyecto → **Deployments**
2. Verifica que el último deployment tenga estado **"Ready"** (verde)
3. Si está en "Building" o "Error", espera a que termine

### 2. Verificar Variables de Entorno

1. **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Click en `DATABASE_URL` para ver su valor
3. **DEBE tener** la URL pública:
   ```
   postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@nozomi.proxy.rlwy.net:23031/railway?sslmode=require
   ```
4. **NO debe tener** `postgres.railway.internal`

### 3. Verificar que esté en todos los ambientes

Asegúrate de que `DATABASE_URL` esté configurada para:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

---

## 🔄 Si el proxy no funciona, probar URL directa

Si `nozomi.proxy.rlwy.net:23031` no funciona, prueba con el dominio directo:

```
postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@postgres-production-3c3dd.up.railway.app:5432/railway?sslmode=require
```

**Pasos:**
1. Vercel → Settings → Environment Variables
2. Edita `DATABASE_URL`
3. Cambia a la URL del dominio directo (arriba)
4. Guarda
5. Redeploy manual

---

## 🆘 Si aún no funciona

### Opción A: Eliminar y recrear la variable

1. **Elimina** `DATABASE_URL` en Vercel
2. Espera 30 segundos
3. **Crea** la variable nuevamente con la URL pública
4. **Redeploy** manual

### Opción B: Verificar logs de Vercel

1. Vercel → Tu proyecto → **Deployments**
2. Click en el último deployment
3. Click en **"Functions"** tab
4. Busca errores relacionados con `DATABASE_URL` o conexión a la DB

### Opción C: Verificar que Railway permite conexiones externas

1. Railway → PostgreSQL Database → **Settings** → **Networking**
2. Verifica que **"Public Networking"** esté habilitado
3. Deberías ver el dominio público o proxy activo

---

## 📝 URLs a probar (en orden)

1. **Proxy (actual):**
   ```
   postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@nozomi.proxy.rlwy.net:23031/railway?sslmode=require
   ```

2. **Dominio directo:**
   ```
   postgresql://postgres:KBrfFaHTUsrtQDHNgTFyeXqOwYvHQdXB@postgres-production-3c3dd.up.railway.app:5432/railway?sslmode=require
   ```

---

## ⚠️ Importante

Después de cambiar `DATABASE_URL` en Vercel, **SIEMPRE** necesitas:
1. Guardar la variable
2. Hacer un **redeploy manual** (no automático)
3. Esperar a que el deploy termine completamente

Vercel NO aplica cambios en variables de entorno en deploys en curso, solo en nuevos deploys.
