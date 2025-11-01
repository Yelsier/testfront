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

# Subir client.js al bucket con compresión gzip
echo "⬆️  Uploading client.js to S3..."
if [ -f "dist/client.js" ]; then
  # Comprimir con gzip
  echo "🗜️  Compressing with gzip..."
  gzip -9 -c dist/client.js > dist/client.js.gz
  
  # Subir versión comprimida con headers correctos
  aws s3 cp dist/client.js.gz "s3://${BUCKET_NAME}/client.js" \
    --content-type "application/javascript" \
    --content-encoding "gzip" \
    --cache-control "public, max-age=31536000, immutable"
  
  echo "✅ client.js uploaded (gzipped: $(du -h dist/client.js.gz | cut -f1))"
  
  # Limpiar temporal
  rm dist/client.js.gz
else
  echo "❌ Error: dist/client.js not found"
  echo "Available files:"
  ls -la dist/
  exit 1
fi

# Subir chunks y assets opcionales
if [ -d "dist/chunks" ]; then
  echo "⬆️  Uploading chunks..."
  # Comprimir y subir cada chunk
  for file in dist/chunks/*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      gzip -9 -c "$file" > "$file.gz"
      aws s3 cp "$file.gz" "s3://${BUCKET_NAME}/chunks/$filename" \
        --content-type "application/javascript" \
        --content-encoding "gzip" \
        --cache-control "public, max-age=31536000, immutable"
      rm "$file.gz"
    fi
  done
  echo "✅ Chunks uploaded (gzipped)"
fi

if [ -d "dist/assets" ]; then
  echo "⬆️  Uploading assets..."
  aws s3 sync dist/assets/ "s3://${BUCKET_NAME}/assets/" \
    --cache-control "public, max-age=31536000, immutable"
fi

echo "✅ Assets uploaded successfully!"
