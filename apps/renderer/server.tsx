import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { ModuleRenderer } from "../../packages/runtime";
import "./registry"; // registra módulos

type ResolveResponse = {
  renderMode: "static" | "dynamic" | "revalidate";
  ttl?: number;
  modules: { type: string; key: string; props: any }[];
  seo?: { title?: string; description?: string };
};

// 🔧 Función para consultar tu API CMS
// Cambia esta URL cuando tengas la API real
const CMS_API_URL = process.env.CMS_API_URL || "http://localhost:4000/api";

async function resolve(path: string): Promise<ResolveResponse> {
  // TODO: Cuando tengas la API real, descomentar esto:
  /*
  try {
    const response = await fetch(`${CMS_API_URL}/pages${path}`, {
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("CMS API error:", error);
    // Fallback a página 404 o error
    return {
      renderMode: "dynamic",
      modules: [{ type: "Hero", key: "error-1", props: { title: "Página no encontrada" } }]
    };
  }
  */

  // 🧪 MOCK temporal - eliminar cuando tengas la API
  if (path === "/" || path === "/home") {
    return {
      renderMode: "static",
      ttl: 86400,
      modules: [{ type: "Hero", key: "hero-1", props: { title: "Hola CMS (Estática)" } }],
      seo: { title: "Home - CMS", description: "Página principal" }
    };
  }

  if (path === "/about") {
    return {
      renderMode: "static",
      ttl: 3600,
      modules: [{ type: "Hero", key: "hero-about", props: { title: "Sobre Nosotros (Estática)" } }],
      seo: { title: "About - CMS" }
    };
  }

  // Páginas dinámicas (ejemplo: /blog/post-123)
  return {
    renderMode: "dynamic",
    modules: [{ type: "Hero", key: "hero-2", props: { title: `Ruta dinámica: ${path}` } }],
    seo: { title: `${path} - CMS` }
  };
}

export async function handle(event: { rawPath: string; headers: Record<string, string> }) {
  const data = await resolve(event.rawPath || "/");

  // URL del bucket para assets
  const bucketUrl = process.env.BUCKET_URL || "";
  const clientJsUrl = bucketUrl ? `https://${bucketUrl}/client.js` : "/client.js";

  const bodyStream = await renderToReadableStream(
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>{data.seo?.title ?? "CMS"}</title>
        {data.seo?.description && (
          <meta name="description" content={data.seo.description} />
        )}
      </head>
      <body>
        <div id="root">
          <ModuleRenderer modules={data.modules} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `window.__DATA__=${JSON.stringify(data)};` }} />
        <script type="module" src={clientJsUrl}></script>
      </body>
    </html>
  );

  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8"
  };
  if (data.renderMode === "static") {
    headers["Cache-Control"] = `public, s-maxage=${data.ttl ?? 86400}`;
  } else if (data.renderMode === "revalidate") {
    headers["Cache-Control"] = `public, s-maxage=${data.ttl ?? 300}`;
  } else {
    headers["Cache-Control"] = "no-store";
  }

  return new Response(bodyStream as any, { status: 200, headers });
}
