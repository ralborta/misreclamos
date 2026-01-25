#!/bin/bash
# Script para aplicar migraciones en Railway
# Uso: bash scripts/aplicar-migraciones.sh

set -e

echo "🚀 Aplicando migraciones en Railway..."
echo ""

# Verificar que Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "   Instala con: npm i -g @railway/cli"
    exit 1
fi

# Verificar login
echo "🔐 Verificando autenticación..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  No estás logueado en Railway"
    echo "   Ejecuta: railway login"
    exit 1
fi

# Verificar que el proyecto está linkeado
echo "🔗 Verificando proyecto linkeado..."
if ! railway status &> /dev/null; then
    echo "⚠️  Proyecto no linkeado"
    echo "   Ejecuta: railway link"
    exit 1
fi

# Aplicar migraciones
echo "📦 Aplicando migraciones..."
railway run pnpm prisma migrate deploy

echo ""
echo "✅ Migraciones aplicadas exitosamente!"
echo ""
echo "🔍 Verificando tablas..."
railway run pnpm prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
