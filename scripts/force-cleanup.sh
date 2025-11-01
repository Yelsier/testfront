#!/bin/bash

# Script para eliminar recursos huérfanos de AWS que SST no pudo limpiar

set -e

APP_NAME="cms-front"

echo "🗑️  Limpieza de recursos huérfanos de AWS"
echo "📦 App: $APP_NAME"
echo ""

# Función para vaciar y eliminar buckets S3
cleanup_s3_buckets() {
    echo "🪣 Buscando buckets S3..."
    BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${APP_NAME}')].Name" --output text)
    
    if [ -z "$BUCKETS" ]; then
        echo "   ✅ No hay buckets para eliminar"
        return
    fi
    
    for bucket in $BUCKETS; do
        echo "   🗑️  Eliminando bucket: $bucket"
        
        # Vaciar el bucket primero
        echo "      Vaciando contenido..."
        aws s3 rm "s3://${bucket}" --recursive 2>/dev/null || true
        
        # Eliminar versiones si las hay
        aws s3api delete-bucket --bucket "$bucket" 2>/dev/null || {
            echo "      ⚠️  No se pudo eliminar (puede tener versiones o políticas)"
            # Intentar eliminar todas las versiones
            aws s3api list-object-versions --bucket "$bucket" --output json | \
            jq -r '.Versions[]?, .DeleteMarkers[]? | "\(.Key) \(.VersionId)"' | \
            while read key version; do
                aws s3api delete-object --bucket "$bucket" --key "$key" --version-id "$version" 2>/dev/null || true
            done
            aws s3api delete-bucket --bucket "$bucket" 2>/dev/null || echo "      ❌ Error eliminando bucket"
        }
        
        echo "      ✅ Bucket eliminado"
    done
}

# Función para eliminar roles IAM
cleanup_iam_roles() {
    echo ""
    echo "🔐 Buscando roles IAM..."
    ROLES=$(aws iam list-roles --query "Roles[?starts_with(RoleName, '${APP_NAME}')].RoleName" --output text)
    
    if [ -z "$ROLES" ]; then
        echo "   ✅ No hay roles para eliminar"
        return
    fi
    
    for role in $ROLES; do
        echo "   🗑️  Eliminando role: $role"
        
        # Desadjuntar políticas managed
        MANAGED_POLICIES=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || true)
        for policy in $MANAGED_POLICIES; do
            echo "      Desadjuntando política: $policy"
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" 2>/dev/null || true
        done
        
        # Eliminar políticas inline
        INLINE_POLICIES=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[]' --output text 2>/dev/null || true)
        for policy in $INLINE_POLICIES; do
            echo "      Eliminando política inline: $policy"
            aws iam delete-role-policy --role-name "$role" --policy-name "$policy" 2>/dev/null || true
        done
        
        # Eliminar el role
        aws iam delete-role --role-name "$role" 2>/dev/null && echo "      ✅ Role eliminado" || echo "      ❌ Error eliminando role"
    done
}

# Función para eliminar Lambda functions
cleanup_lambda_functions() {
    echo ""
    echo "⚡ Buscando Lambda functions..."
    FUNCTIONS=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${APP_NAME}')].FunctionName" --output text)
    
    if [ -z "$FUNCTIONS" ]; then
        echo "   ✅ No hay funciones para eliminar"
        return
    fi
    
    for func in $FUNCTIONS; do
        echo "   🗑️  Eliminando función: $func"
        aws lambda delete-function --function-name "$func" 2>/dev/null && echo "      ✅ Función eliminada" || echo "      ❌ Error eliminando función"
    done
}

# Función para eliminar CloudFront distributions
cleanup_cloudfront() {
    echo ""
    echo "🌐 Buscando CloudFront distributions..."
    DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment && contains(Comment, '${APP_NAME}')].{Id:Id,ETag:ETag}" --output text 2>/dev/null || true)
    
    if [ -z "$DISTRIBUTIONS" ]; then
        echo "   ✅ No hay distributions para eliminar"
        return
    fi
    
    echo "$DISTRIBUTIONS" | while read id etag; do
        echo "   🗑️  Deshabilitando distribution: $id"
        
        # Obtener la configuración actual
        CONFIG=$(aws cloudfront get-distribution-config --id "$id" 2>/dev/null || true)
        if [ -z "$CONFIG" ]; then
            echo "      ⚠️  No se pudo obtener configuración"
            continue
        fi
        
        # Deshabilitar la distribution (esto toma tiempo)
        echo "      ⏳ Esto puede tardar varios minutos..."
        # aws cloudfront update-distribution --id "$id" --if-match "$etag" --distribution-config ... 
        echo "      ⚠️  Las CloudFront distributions deben deshabilitarse manualmente en la consola"
        echo "      URL: https://console.aws.amazon.com/cloudfront/home#distributions:id=$id"
    done
}

echo ""
read -p "⚠️  ¿Continuar con la eliminación? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "================================"
echo ""

cleanup_lambda_functions
cleanup_s3_buckets
cleanup_iam_roles
cleanup_cloudfront

echo ""
echo "================================"
echo ""
echo "✅ Limpieza completada"
echo ""
echo "🔍 Verificando recursos restantes..."
bash "$(dirname "$0")/list-resources.sh"
