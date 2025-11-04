#!/bin/bash

# Script para subir assets al bucket S3
# Uso: ./upload-assets.sh <bucket-name>

BUCKET_NAME=$1

if [ -z "$BUCKET_NAME" ]; then
  echo "Error: Debes proporcionar el nombre del bucket"
  echo "Uso: ./upload-assets.sh <bucket-name>"
  exit 1
fi

# Build del proyecto
echo "📦 Building assets..."
cd "$(dirname "$0")/../apps/renderer"
pnpm build

# Verificar que existe el directorio dist
if [ ! -d "dist" ]; then
  echo "❌ Error: dist/ directory not found"
  exit 1
fi

echo "📂 Contents of dist/:"
ls -lah dist/

# Comprimir todos los archivos .js y .mjs con gzip
echo "🗜️  Compressing JavaScript files..."
find dist -type f \( -name "*.js" -o -name "*.mjs" \) | while read -r file; do
  gzip -9 -c "$file" > "$file.gz"
  echo "  Compressed: $file"
done

# Subir todo el directorio dist/ al bucket con las configuraciones apropiadas
echo "⬆️  Uploading all files from dist/ to S3..."

# Subir archivos JS/MJS comprimidos con content-encoding gzip
find dist -type f -name "*.gz" | while read -r gzfile; do
  # Obtener ruta relativa sin el .gz
  originalfile="${gzfile%.gz}"
  relativepath="${originalfile#dist/}"
  
  # Determinar content-type
  if [[ "$originalfile" == *.css ]]; then
    contenttype="text/css"
  elif [[ "$originalfile" == *.js ]] || [[ "$originalfile" == *.mjs ]]; then
    contenttype="application/javascript"
  elif [[ "$originalfile" == *.json ]]; then
    contenttype="application/json"
  else
    contenttype="application/octet-stream"
  fi
  
  aws s3 cp "$gzfile" "s3://${BUCKET_NAME}/${relativepath}" \
    --content-type "$contenttype" \
    --content-encoding "gzip" \
    --cache-control "public, max-age=31536000, immutable"
  
  echo "  ✅ Uploaded: ${relativepath} (gzipped)"
  rm "$gzfile"
done

# Subir archivos restantes (imágenes, fuentes, etc.) sin compresión
echo "⬆️  Uploading remaining files..."
aws s3 sync dist/ "s3://${BUCKET_NAME}/" \
  --exclude "*.js" \
  --exclude "*.mjs" \
  --exclude "*.gz" \
  --cache-control "public, max-age=31536000, immutable"

echo "✅ All assets uploaded successfully!"
echo "📊 Bucket contents:"
aws s3 ls "s3://${BUCKET_NAME}/" --recursive --human-readable
