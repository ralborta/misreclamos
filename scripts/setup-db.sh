#!/bin/bash
# Script para aplicar migraciones automáticamente
# Railway puede ejecutar esto en el deploy

echo "🔍 Verificando conexión a la base de datos..."

# Verificar que DATABASE_URL esté configurado
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL no está configurado"
  exit 1
fi

echo "✅ DATABASE_URL configurado"
echo "📦 Aplicando migraciones de Prisma..."

# Aplicar migraciones
pnpm prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migraciones aplicadas correctamente"
else
  echo "❌ Error al aplicar migraciones"
  exit 1
fi

echo "🎉 Base de datos configurada correctamente"
