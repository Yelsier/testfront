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

# Subir client.js al bucket (ahora con nombre fijo)
echo "⬆️  Uploading client.js to S3..."
if [ -f "dist/client.js" ]; then
  aws s3 cp dist/client.js "s3://${BUCKET_NAME}/client.js" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000, immutable"
  echo "✅ client.js uploaded!"
else
  echo "❌ Error: dist/client.js not found"
  echo "Available files:"
  ls -la dist/
  exit 1
fi

# Subir chunks y assets opcionales
if [ -d "dist/chunks" ]; then
  echo "⬆️  Uploading chunks..."
  aws s3 sync dist/chunks/ "s3://${BUCKET_NAME}/chunks/" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000, immutable"
fi

if [ -d "dist/assets" ]; then
  echo "⬆️  Uploading assets..."
  aws s3 sync dist/assets/ "s3://${BUCKET_NAME}/assets/" \
    --cache-control "public, max-age=31536000, immutable"
fi

echo "✅ Assets uploaded successfully!"
