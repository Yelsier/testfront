// handler.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

process.on("unhandledRejection", (reason) => {
  console.error("🚨 unhandledRejection:", {
    type: typeof reason,
    reason,
    stack: (reason as any)?.stack,
  });
});

process.on("uncaughtException", (err) => {
  console.error("🚨 uncaughtException:", {
    message: err?.message,
    stack: err?.stack,
    err,
  });
});

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
let rscHandlerCache: ((req: Request) => Promise<Response> | Response) | null =
  null;
let rscHandlerInit: Promise<
  (req: Request) => Promise<Response> | Response
> | null = null;

async function getRscHandler() {
  if (rscHandlerCache) return rscHandlerCache;

  if (!rscHandlerInit) {
    rscHandlerInit = (async () => {
      // @ts-ignore
      const mod = await import("./dist/rsc/index.js");
      const handler = (mod.default ?? mod.handler ?? mod.render) as any;

      if (typeof handler !== "function") {
        throw new Error("RSC bundle did not export a handler function");
      }

      rscHandlerCache = handler;
      return handler;
    })().catch((e) => {
      // si falla el init, permite reintentar en la siguiente request
      rscHandlerInit = null;
      throw e;
    });
  }

  return rscHandlerInit;
}

void getRscHandler().catch((e) => console.error("Warm RSC init failed:", e));

const getRequestFromEvent = (event: any): Request => {
  // Convert Lambda Function URL event to Web Request
  const {
    rawPath,
    headers = {},
    requestContext,
    body,
    isBase64Encoded,
  } = event;
  const method = requestContext?.http?.method || "GET";
  const host = headers.host || headers.Host || "localhost";

  // Build URL
  const queryString = event.rawQueryString || "";
  const url = `https://${host}${rawPath}${queryString ? "?" + queryString : ""}`;

  // Build headers
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    requestHeaders.set(key, value as string);
  }
  // Solo setear accept si no viene en los headers originales
  if (!requestHeaders.has("accept")) {
    requestHeaders.set("accept", "text/html");
  }

  // Build request body if present
  let requestBody = undefined;
  if (body) {
    if (isBase64Encoded) {
      requestBody = Buffer.from(body, "base64");
    } else {
      requestBody = body;
    }
  }

  // Create Web Request
  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body:
      requestBody && method !== "GET" && method !== "HEAD"
        ? requestBody
        : undefined,
  });

  return request;
};

export const handler = awslambda.streamifyResponse(
  async (event, responseStream) => {
    const path = event.rawPath || event.requestContext?.http?.path || "/";
    const headers = event.headers || {};
    const request = getRequestFromEvent(event);
    const method = request.method;
    const isHead = method.toUpperCase() === "HEAD";

    let responded = false;

    const respond = (init: {
      statusCode: number;
      headers?: Record<string, string | undefined>;
    }) => {
      responded = true;
      responseStream = awslambda.HttpResponseStream.from(responseStream, init);
    };

    try {
      // Si es un asset estático (js, css, etc), servir desde S3 directamente
      if (
        path.match(
          /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
        )
      ) {
        try {
          const s3Key = path.replace(/^\//, ""); // Quitar / inicial

          const s3Response = await s3.send(
            new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
            }),
          );

          const body = await s3Response.Body?.transformToByteArray();

          // Determinar Content-Type
          const ext = path.split(".").pop();
          const contentTypes: Record<string, string> = {
            js: "application/javascript",
            css: "text/css",
            json: "application/json",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif",
            svg: "image/svg+xml",
            ico: "image/x-icon",
            woff: "font/woff",
            woff2: "font/woff2",
            ttf: "font/ttf",
            eot: "application/vnd.ms-fontobject",
          };

          respond({
            statusCode: 200,
            headers: {
              "Content-Type":
                contentTypes[ext || ""] || "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Encoding": s3Response.ContentEncoding || undefined,
              "X-Served-From": "S3",
            },
          });

          if (isHead) {
            responseStream.end();
            return;
          }

          // Enviar el buffer directamente sin base64
          responseStream.write(Buffer.from(body || []));
          responseStream.end();
          return;
        } catch (error: any) {
          if (error.name === "NoSuchKey") {
            respond({
              statusCode: 404,
              headers: { "Content-Type": "text/plain" },
            });

            if (isHead) {
              responseStream.end();
              return;
            }

            responseStream.write("Asset not found");
            responseStream.end();
            return;
          }
          throw error;
        }
      }

      const rscHandler = await getRscHandler();
      const rscResponse = await rscHandler(request);
      const body = rscResponse.body;

      if (!body) {
        throw new Error("Response body is null");
      }

      const responseHeaders: Record<string, string> = {};
      rscResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Determinar si es una petición RSC
      const isRscRequest =
        responseHeaders["content-type"]?.includes("text/x-component");

      // Normalizar path para S3 (/ -> index.html, /about -> about.html)
      const s3Key =
        path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`;

      // 1. Intentar servir HTML desde S3 (cache)
      if (!isRscRequest) {
        try {
          const s3Response = await s3.send(
            new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
            }),
          );

          const htmlContent = await s3Response.Body?.transformToString();

          console.log(`✅ Serving ${s3Key} from S3 cache`);

          respond({
            statusCode: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              "X-Cache": "HIT",
            },
          });

          if (isHead) {
            responseStream.end();
            return;
          }

          responseStream.write(htmlContent);
          responseStream.end();
          return;
        } catch (error: any) {
          // Si no existe en S3, continuar con SSR
          if (error.name !== "NoSuchKey") {
            console.warn("S3 read error:", error);
          }
          console.log(`🔄 Cache miss for ${s3Key}, generating SSR`);
        }
      }

      console.log(
        `📊 Request: ${path}, isRscRequest: ${isRscRequest}, Content-Type: ${responseHeaders["content-type"]}`,
      );

      // 2. Generar HTML con RSC+SSR (solo si no está en cache)
      // Para RSC, usar el Content-Type correcto y no cachear
      if (isRscRequest) {
        respond({
          statusCode: 200,
          headers: {
            "Content-Type":
              responseHeaders["content-type"] || "text/x-component",
            "Cache-Control": "no-store",
            Vary: "Accept",
            "X-Cache": "BYPASS",
          },
        });

        if (isHead) {
          responseStream.end();
          return;
        }

        const nodeBody = Readable.fromWeb(body as any);
        await pipeline(nodeBody, responseStream); // pipeline ya cierra el writable
        return;
      }

      // Para HTML regular, cachear en S3
      respond({
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Cache": "MISS",
        },
      });

      if (isHead) {
        responseStream.end();
        return;
      }

      const [stream, streamCopy] = body.tee();

      await pipeline(Readable.fromWeb(stream as any), responseStream);

      // 3. Si es estática, guardar en S3 para próximas peticiones
      const cacheControl =
        responseHeaders["cache-control"] || responseHeaders["Cache-Control"];
      const isStatic = !cacheControl?.includes("no-store");

      if (isStatic) {
        try {
          const reader = streamCopy.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const html = new TextDecoder("utf-8").decode(Buffer.concat(chunks));

          // Guardar el HTML en S3 para futuras peticiones
          await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
              Body: html,
              ContentType: "text/html; charset=utf-8",
              CacheControl: "public, max-age=3600",
            }),
          );

          console.log(`💾 Cached ${s3Key} to S3`);
        } catch (e) {
          console.error("⚠️ Background cache failed (ignored):", e);
        }
      }
    } catch (e: any) {
      // Log que NO se rompa aunque e sea undefined
      console.error("💥 Handler crashed:", {
        type: typeof e,
        name: e?.name,
        message: e?.message,
        stack: e?.stack,
        raw: e,
      });

      if (!responded) {
        respond({
          statusCode: 500,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }

      if (!isHead) {
        responseStream.write("Internal Server Error");
      }
      responseStream.end();
      return;
    }
  },
);
