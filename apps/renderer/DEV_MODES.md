# Modos de Desarrollo

## 🚀 Modo Recomendado: Dev con SSR

```bash
pnpm dev
```

Este modo:
- ✅ Ejecuta `dev-server.ts` (Express + SSR)
- ✅ Usa `server.tsx` (mismo código que producción)
- ✅ Lee datos de `mocks/data.ts`
- ✅ Simula el comportamiento de Lambda
- ✅ Hot reload con `tsx watch`

**Ventajas**:
- Desarrollo idéntico a producción
- Los desarrolladores no dependen del backend
- Fácil modificar mocks en `mocks/data.ts`

## 🎨 Modo Alternativo: Vite Puro (SPA)

```bash
pnpm dev:vite
```

Este modo:
- ⚠️ Solo para diseño visual rápido
- ❌ NO usa SSR
- ❌ NO pasa por `server.tsx`
- ❌ Tirará error si intentas navegar (no hay `window.__DATA__`)

**Úsalo solo para**:
- Desarrollo rápido de componentes visuales
- Testing de estilos

## 📝 Sistema de Mocks

### Editar mocks

Modifica `apps/renderer/mocks/data.ts`:

\`\`\`typescript
export const mockPages: Record<string, ResolveResponse> = {
  "/": {
    renderMode: "static",
    ttl: 86400,
    modules: [
      { 
        type: "Hero", 
        key: "hero-home", 
        props: { 
          title: "Tu título aquí" 
        } 
      }
    ],
    seo: { 
      title: "Home - CMS" 
    }
  },
  
  // Añade más páginas...
  "/nueva-pagina": {
    renderMode: "static",
    ttl: 3600,
    modules: [
      { type: "Hero", key: "hero-nueva", props: { title: "Nueva Página" } }
    ]
  }
};
\`\`\`

### Rutas dinámicas

Las rutas que coincidan con patrones se generan automáticamente:

\`\`\`typescript
// /blog/cualquier-cosa → genera página dinámica
if (path.startsWith("/blog/")) {
  const slug = path.replace("/blog/", "");
  return {
    renderMode: "dynamic",
    modules: [{ type: "Hero", key: \`hero-\${slug}\`, props: { title: slug } }]
  };
}
\`\`\`

## 🔌 Conectar API Real

### Paso 1: Configurar .env

Crea `apps/renderer/.env`:

\`\`\`bash
CMS_API_URL=https://api.tu-cms.com
USE_MOCK=false
\`\`\`

### Paso 2: Reinicia el servidor

\`\`\`bash
pnpm dev
\`\`\`

Ahora el `server.tsx` llamará a tu API real en lugar de mocks.

### Paso 3: Fallback automático

Si la API falla, automáticamente vuelve a mocks:

\`\`\`typescript
catch (error) {
  console.error("CMS API error:", error);
  console.warn("Falling back to mock data");
  return getMockPage(path);
}
\`\`\`

## 🏗️ Flujo Completo

\`\`\`
Desarrollo:
  Browser → dev-server.ts → server.tsx → mocks/data.ts → HTML con window.__DATA__
                                      ↓
                               entry.client.tsx hidrata

Producción:
  Browser → CloudFront → Lambda (handler.ts) → server.tsx → API Real → HTML
                                                          ↓
                                                   S3 cache (ISR)
\`\`\`

## 📦 Build y Deploy

\`\`\`bash
# 1. Build del cliente
pnpm build

# 2. Deploy a AWS
pnpm sst:deploy

# 3. Subir assets
pnpm upload-assets <bucket-name>
\`\`\`

## 💡 Tips

1. **Agregar nuevo componente**: Regístralo en `registry.ts`
2. **Nueva página mock**: Añádela a `mocks/data.ts`
3. **Testing SSR**: Usa `pnpm dev` (no `pnpm dev:vite`)
4. **Ver logs SSR**: Revisa la terminal donde corre `dev-server.ts`
