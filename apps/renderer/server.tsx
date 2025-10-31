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

// 🔧 hoy: simulamos el CMS
async function resolve(path: string): Promise<ResolveResponse> {
  if (path === "/" || path === "/home") {
    return {
      renderMode: "static",
      ttl: 86400,
      modules: [{ type: "Hero", key: "hero-1", props: { title: "Hola CMS" } }]
    };
  }
  return {
    renderMode: "dynamic",
    modules: [{ type: "Hero", key: "hero-2", props: { title: `Ruta ${path}` } }]
  };
}

export async function handle(event: { rawPath: string; headers: Record<string,string> }) {
  const data = await resolve(event.rawPath || "/");
  const bodyStream = await renderToReadableStream(
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>{data.seo?.title ?? "CMS"}</title>
      </head>
      <body>
        <div id="root">
          <ModuleRenderer modules={data.modules} />
        </div>
        <script dangerouslySetInnerHTML={{__html: `window.__DATA__=${JSON.stringify(data)};`}} />
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  );

  const headers: Record<string,string> = {
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
