import { renderToString } from "react-dom/server";
import { ModuleRenderer } from "../../packages/runtime";
import "./registry"; // registra módulos
import type { ResolveResponse } from "./mocks/types";
import { getMockPage } from "./mocks/data";

// 🔧 Configuración del CMS API
const CMS_API_URL = process.env.CMS_API_URL;
const USE_MOCK = process.env.USE_MOCK !== "false"; // Por defecto usa mocks

async function resolve(path: string): Promise<ResolveResponse> {
  // Si tenemos API real y no queremos mocks
  if (CMS_API_URL && !USE_MOCK) {
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
      console.warn("Falling back to mock data");
      return getMockPage(path);
    }
  }

  // 🧪 Usar mocks (desarrollo)
  console.log(`📝 Using mock data for: ${path}`);
  return getMockPage(path);
}

export async function handle(event: { rawPath: string; headers: Record<string, string> }) {
  const data = await resolve(event.rawPath || "/");

  // Usar ruta relativa - CloudFront se encarga del routing
  // En producción: CloudFront sirve /client.js desde S3
  // En desarrollo local: se sirve desde dist/
  const clientJsUrl = "/client.js";

  const html = renderToString(
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>{data.seo?.title ?? "CMS"}</title>
        {data.seo?.description && (
          <meta name="description" content={data.seo.description} />
        )}
        {/* Preload client.js para descarga paralela */}
        <link rel="modulepreload" href={clientJsUrl} />
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

  return new Response(`<!DOCTYPE html>${html}`, { status: 200, headers });
}
