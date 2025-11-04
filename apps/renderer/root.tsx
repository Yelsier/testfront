import { ModuleRenderer } from "./moduleloader"
import { loadModule, preloadSSRModule } from "./registry";
import type { ResolveResponse } from "./mocks/types";
import { getMockPage } from "./mocks/data";

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

export function Root(props: { url: URL }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Vite + RSC</title>
            </head>
            <body>
                <App {...props} />
            </body>
        </html>
    )
}

async function App(props: { url: URL }) {

    const data = await resolve(props.url.pathname);

    const moduleTypes = [...new Set(data.modules.map(m => m.type))];
    await Promise.all(moduleTypes.map(type => preloadSSRModule(type)));

    return (
        <div id="root">
            <ModuleRenderer modules={data.modules} loadModule={loadModule} />
        </div>
    )
}
