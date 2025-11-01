#!/bin/bash

# Script para eliminar TODOS los recursos de SST de todos los stages

echo "🗑️  Limpieza completa de recursos SST"
echo ""

APP_NAME="cms-front"

# Detectar el stage actual
CURRENT_STAGE=$(cat .sst/stage 2>/dev/null || echo "unknown")
echo "📍 Stage actual detectado: $CURRENT_STAGE"
echo ""

# Listar todos los stages potenciales buscando en AWS
echo "🔍 Buscando todos los stages en AWS..."
STAGES=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${APP_NAME}')].FunctionName" --output text | sed 's/.*-\([^-]*\)-[^-]*Function.*/\1/' | sort -u)

if [ -z "$STAGES" ]; then
    echo "✅ No se encontraron recursos de SST en AWS"
    exit 0
fi

echo "Stages encontrados:"
for stage in $STAGES; do
    echo "  - $stage"
done
echo ""

# Preguntar confirmación
read -p "⚠️  ¿Eliminar TODOS estos stages? Esto es IRREVERSIBLE. (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# Eliminar cada stage
for stage in $STAGES; do
    echo ""
    echo "🗑️  Eliminando stage: $stage"
    echo "================================"
    sst remove --stage "$stage" || echo "⚠️  Error eliminando stage $stage (puede que ya esté eliminado)"
    echo ""
done

echo ""
echo "✅ Limpieza completada"
echo ""
echo "🔍 Verificando recursos restantes..."
bash "$(dirname "$0")/list-resources.sh"
