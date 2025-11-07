// handler.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
///@ts-ignore
import rscHandler from './dist/rsc/index.js';


const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
let rscHandler: (req: Request) => Promise<Response> | Response;

async function getRscHandler() {
  if (!rscHandler) {
    // IMPORTA EL BUNDLE COMPILADO POR Vite (no fuentes, no "virtual:")
    //@ts-ignore
    const mod = await import("./dist/rsc/index.js");
    rscHandler = (mod.default ?? mod.handler ?? mod.render) as any;
  }
  return rscHandler!;
}

const getRequestFromEvent = (event: any): Request => {
  // Convert Lambda Function URL event to Web Request
  const { rawPath, headers = {}, requestContext, body, isBase64Encoded } = event;
  const method = requestContext?.http?.method || 'GET';
  const host = headers.host || headers.Host || 'localhost';

  // Build URL
  const queryString = event.rawQueryString || '';
  const url = `https://${host}${rawPath}${queryString ? '?' + queryString : ''}`;

  // Build headers
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    requestHeaders.set(key, value as string);
  }
  requestHeaders.set("accept", "text/html");

  // Build request body if present
  let requestBody = undefined;
  if (body) {
    if (isBase64Encoded) {
      requestBody = Buffer.from(body, 'base64');
    } else {
      requestBody = body;
    }
  }

  // Create Web Request
  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: requestBody && method !== 'GET' && method !== 'HEAD' ? requestBody : undefined,
  });

  return request;
}


export const handler = awslambda.streamifyResponse(
  async (event, responseStream) => {

    const httpResponseMetadata = {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html"
      }
    };
    responseStream = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);

    const request = getRequestFromEvent(event);
    const rscHandler = await getRscHandler();
    const qwes = await rscHandler(request);
    const body = qwes.body;

    if (!body) {
      throw new Error("Response body is null");
    }

    await pipeline(body as unknown as Readable, responseStream);
  }
);