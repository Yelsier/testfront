import { handle } from "./server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
const BUCKET_URL = process.env.BUCKET_URL!;

export const handler = async (event: any) => {
  const path = event.rawPath || event.requestContext?.http?.path || "/";
  const headers = event.headers || {};

  // Normalizar path para S3 (/ -> index.html, /about -> about.html)
  const s3Key = path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`;

  try {
    // 1. Intentar servir desde S3 si existe
    try {
      const s3Response = await s3.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      }));

      // Leer el contenido del S3
      const body = await s3Response.Body?.transformToString();

      console.log(`✅ Served ${s3Key} from S3 cache`);

      // Devolver el HTML desde S3 sin redirigir
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": s3Response.CacheControl || "public, max-age=3600",
          "X-Cache": "HIT" // Para debugging
        },
        body
      };
    } catch (error: any) {
      // Archivo no existe, continuar con SSR
      if (error.name !== "NoSuchKey") {
        console.warn("S3 read error:", error);
      }
    }

    // 2. Generar página con SSR
    const res = await handle({ rawPath: path, headers });
    const body = await res.text();
    const responseHeaders: Record<string, string> = {};

    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 3. Si es estática, guardar en S3 para próximas peticiones
    const cacheControl = responseHeaders["cache-control"] || responseHeaders["Cache-Control"];
    const isStatic = cacheControl?.includes("s-maxage") && !cacheControl.includes("no-store");

    if (isStatic) {
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: body,
          ContentType: "text/html; charset=utf-8",
          CacheControl: cacheControl
        }));

        console.log(`✅ Cached ${s3Key} to S3`);
      } catch (s3Error) {
        console.error("Failed to cache to S3:", s3Error);
        // No fallar si no se puede cachear
      }
    }

    // 4. Devolver respuesta
    return {
      statusCode: res.status,
      headers: {
        ...responseHeaders,
        "X-Cache": "MISS" // Para debugging
      },
      body
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Internal Server Error"
    };
  }
};