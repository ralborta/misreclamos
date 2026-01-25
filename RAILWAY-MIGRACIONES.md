# ⚠️ Restricciones y Mejores Prácticas: Migraciones en Railway

## 🔍 Análisis de Restricciones

### ❌ Problema con `startCommand`

Si usas `startCommand: "pnpm prisma migrate deploy && pnpm start"`:

**Problemas:**
- ⚠️ Se ejecuta en **cada restart** del contenedor (no solo en deploys)
- ⚠️ Si el servicio se reinicia por error, ejecuta migraciones innecesariamente
- ⚠️ Puede causar problemas si hay múltiples instancias ejecutando migraciones simultáneamente
- ⚠️ Aumenta el tiempo de inicio en cada restart

**Cuándo se ejecuta:**
- ✅ En cada deploy (correcto)
- ❌ En cada restart del contenedor (innecesario)
- ❌ Cuando Railway escala el servicio (innecesario)

---

## ✅ Solución: `preDeployCommand` (Mejor Práctica)

Railway tiene una opción específica para esto: **`preDeployCommand`**

### Ventajas:

1. ✅ Se ejecuta **SOLO durante deploys**, no en restarts
2. ✅ Se ejecuta en un contenedor separado antes del deploy
3. ✅ Si falla, el deploy no continúa (evita problemas de schema)
4. ✅ No afecta el tiempo de inicio en restarts normales
5. ✅ Evita race conditions con múltiples instancias

### Configuración Aplicada:

**`railway.json`:**
```json
{
  "deploy": {
    "startCommand": "pnpm start",
    "preDeployCommand": "pnpm prisma migrate deploy"
  }
}
```

**`railway.toml`:**
```toml
[deploy]
startCommand = "pnpm start"

[deploy.preDeployCommand]
command = "pnpm prisma migrate deploy"
```

---

## 🎯 Cómo Funciona Ahora

### Flujo de Deploy:

1. **Railway detecta cambios** en GitHub
2. **Ejecuta `preDeployCommand`**: `pnpm prisma migrate deploy`
   - Aplica migraciones pendientes
   - Si falla, el deploy se detiene
3. **Si migraciones OK**: Continúa con el deploy
4. **Ejecuta `startCommand`**: `pnpm start`
   - Inicia la aplicación

### Flujo de Restart:

1. **Servicio se reinicia** (por error, scaling, etc.)
2. **Solo ejecuta `startCommand`**: `pnpm start`
3. **NO ejecuta migraciones** (ya están aplicadas)

---

## 🔒 Seguridad y Restricciones

### Railway NO tiene restricciones sobre:
- ✅ Ejecutar migraciones en `preDeployCommand`
- ✅ Ejecutar migraciones en `startCommand` (aunque no es recomendado)
- ✅ Usar Railway CLI para ejecutar migraciones

### Railway SÍ tiene:
- ✅ **PreDeployCommand**: Ejecuta en contenedor separado solo durante deploys
- ✅ **Startup Order**: Puedes configurar orden de inicio de servicios
- ✅ **Private Networking**: Servicios en el mismo proyecto se comunican por red privada

---

## 📊 Comparación de Enfoques

| Enfoque | Cuándo se ejecuta | Ventajas | Desventajas |
|---------|-------------------|----------|-------------|
| `startCommand` | Cada restart + deploy | Simple | Ejecuta innecesariamente |
| `preDeployCommand` | Solo en deploys | ✅ Mejor práctica | Requiere configuración |
| Servicio separado | Antes del deploy | Máxima separación | Más complejo |
| Manual (Railway Query) | Cuando quieras | Control total | No automático |

---

## ✅ Recomendación Final

**Usar `preDeployCommand`** (ya configurado):
- ✅ Se ejecuta solo cuando es necesario (en deploys)
- ✅ No afecta restarts
- ✅ Es la mejor práctica recomendada por Railway
- ✅ Evita problemas de concurrencia

---

## 🔍 Verificar Configuración

En Railway Dashboard:
1. Ve a tu servicio → **Settings**
2. Verifica que **Pre-Deploy Command** sea: `pnpm prisma migrate deploy`
3. Verifica que **Start Command** sea: `pnpm start`

Si no ves la opción "Pre-Deploy Command" en el dashboard, Railway la leerá automáticamente de `railway.json` o `railway.toml`.

---

## 🆘 Si hay problemas

Si las migraciones no se ejecutan automáticamente:

1. **Verifica** que `railway.json` o `railway.toml` esté en el repo
2. **Verifica** que Railway esté conectado a GitHub
3. **Aplica manualmente** una vez: Railway Query → `scripts/apply-migrations.sql`
4. **Luego** las futuras migraciones se aplicarán automáticamente en cada deploy
