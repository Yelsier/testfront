import { handle } from "./server";

export const handler = async (event: any) => {
  // Para Function URL, el path viene en event.rawPath
  // Para API Gateway, viene en event.pathParameters
  const path = event.rawPath || event.requestContext?.http?.path || "/";
  const headers = event.headers || {};
  
  try {
    const res = await handle({ rawPath: path, headers });
    
    // Convertir la Response web estándar a formato Lambda
    const body = await res.text();
    const responseHeaders: Record<string, string> = {};
    
    // Extraer headers de la Response
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      statusCode: res.status,
      headers: responseHeaders,
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