# CMS Frontend - ISR (Incremental Static Regeneration)

## Arquitectura

Este proyecto implementa un sistema híbrido de renderizado:

```
Usuario → Lambda (SSR/ISR) → Verifica si existe en S3
                           ├─ SÍ → Redirige a S3 (página cacheada)
                           └─ NO → Genera HTML → Guarda en S3 → Devuelve HTML
```

### Componentes

1. **Lambda Function (SSR/ISR)**: Genera páginas dinámicamente y las cachea en S3
2. **S3 Bucket**: Almacena páginas HTML generadas + assets (client.js)
3. **API CMS** (mock): Determina si una página es estática o dinámica

## Flujo de Renderizado

### Páginas Estáticas (`renderMode: "static"`)
1. Primera petición → Lambda genera HTML → Guarda en S3 → Devuelve HTML
2. Siguientes peticiones → Lambda redirige a S3 (cache hit)
3. TTL configurable por página

### Páginas Dinámicas (`renderMode: "dynamic"`)
1. Siempre se generan en Lambda
2. No se cachean en S3
3. `Cache-Control: no-store`

## Desarrollo

### Instalar dependencias
```bash
pnpm install
```

### Modo desarrollo local
```bash
pnpm dev
# O desde infra:
cd infra && pnpm dev
```

Esto levanta:
- Vite dev server en http://localhost:3000
- Lambda en AWS (para testing)

## Deploy

### 1. Deploy de infraestructura
```bash
pnpm sst:deploy
```

Esto crea:
- Lambda function con Function URL
- S3 bucket público
- Permisos IAM

Outputs:
```
LambdaUrl: https://xxx.lambda-url.region.on.aws/
BucketUrl: https://xxx.s3.region.amazonaws.com
BucketName: cms-front-cmsbucket-xxx
```

### 2. Subir assets al bucket
```bash
# Después del deploy, copia el BucketName y ejecuta:
pnpm upload-assets <BucketName>

# Ejemplo:
pnpm upload-assets cms-front-cmsbucket-abc123
```

Esto:
1. Hace build del proyecto
2. Sube `client.js` al bucket S3

### 3. Acceder a la aplicación

Usa **solo** la `LambdaUrl`:
```
https://xxx.lambda-url.region.on.aws/
https://xxx.lambda-url.region.on.aws/about
```

## Testing del ISR

### Probar página estática
```bash
# Primera petición (genera y cachea)
curl https://xxx.lambda-url.region.on.aws/

# Segunda petición (redirige a S3)
curl -I https://xxx.lambda-url.region.on.aws/
# Debería devolver 302 Location: https://bucket/index.html
```

### Verificar archivos en S3
```bash
aws s3 ls s3://cms-front-cmsbucket-xxx/
# Debería ver:
# - client.js
# - index.html (después de la primera petición a /)
# - about.html (después de la primera petición a /about)
```

## Configuración de la API CMS

Cuando tengas tu API real, actualiza:

**apps/renderer/server.tsx**:
```typescript
const CMS_API_URL = process.env.CMS_API_URL || "https://tu-api.com/api";

async function resolve(path: string): Promise<ResolveResponse> {
  const response = await fetch(`${CMS_API_URL}/pages${path}`);
  return await response.json();
}
```

**infra/sst.config.ts**:
```typescript
environment: {
  BUCKET_NAME: bucket.name,
  BUCKET_URL: bucket.domain,
  CMS_API_URL: "https://tu-api.com/api" // ← Añadir
}
```

### Formato de respuesta esperado de la API

```json
{
  "renderMode": "static" | "dynamic" | "revalidate",
  "ttl": 86400,
  "modules": [
    {
      "type": "Hero",
      "key": "hero-1",
      "props": { "title": "Hola" }
    }
  ],
  "seo": {
    "title": "Página - CMS",
    "description": "Descripción"
  }
}
```

## Estructura del Proyecto

```
testfront/
├── apps/
│   └── renderer/
│       ├── entry.client.tsx    # Hydration en el navegador
│       ├── server.tsx           # SSR - genera HTML
│       ├── handler.ts           # Lambda handler con ISR
│       ├── registry.ts          # Registro de componentes
│       └── modules/
│           └── Hero.tsx         # Componente ejemplo
├── packages/
│   └── runtime/
│       └── index.tsx            # Runtime de módulos
├── infra/
│   └── sst.config.ts            # Infraestructura AWS
└── scripts/
    └── upload-assets.sh         # Script de deploy de assets
```

## Troubleshooting

### Error: Module '@aws-sdk/client-s3' not found
```bash
cd apps/renderer
pnpm add @aws-sdk/client-s3
```

### Las páginas no se cachean
1. Verifica que `renderMode: "static"` en la respuesta de la API
2. Revisa los logs de Lambda en CloudWatch
3. Verifica permisos S3 en `sst.config.ts`

### client.js no carga
1. Verifica que subiste los assets: `pnpm upload-assets <bucket>`
2. Verifica CORS del bucket
3. Revisa la variable `BUCKET_URL` en Lambda

## Próximos Pasos

1. **Agregar CloudFront** para edge caching global
2. **Implementar revalidación** para páginas que cambian periódicamente
3. **Agregar invalidación de caché** cuando se actualiza contenido en el CMS
4. **Optimizar builds** con code splitting
