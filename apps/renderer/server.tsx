import { renderToString } from "react-dom/server";
import type { ResolveResponse } from "./mocks/types";
import { getMockPage } from "./mocks/data";
import { Root } from "./root";

// 🔧 Configuración del CMS API
const CMS_API_URL = process.env.CMS_API_URL;
const USE_MOCK = process.env.USE_MOCK !== "false"; // Por defecto usa mocks

async function resolve(path: string): Promise<ResolveResponse> {
  // Si tenemos API real y no queremos mocks
  if (CMS_API_URL && !USE_MOCK) {
    try {
      throw new Error(`CMS API error: Api not implemented yet`);

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

  // ✅ Awaitar Root porque ahora es async
  const rootElement = await Root({
    url: new URL(`http://localhost${event.rawPath}`)
  });

  const html = renderToString(rootElement);

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
