import { ModuleDef, ModuleRenderer } from "./moduleloader"
import { preloadSSRModule } from "./registry";
import type { SEO } from "../mocks/types";
import Router from "./router";


export async function Root(props: { modules: ModuleDef[], seo?: SEO, path: string }) {
    const { modules, seo, path } = props;

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{seo?.title ?? "CMS"}</title>
                {seo?.description && (
                    <meta name="description" content={seo.description} />
                )}
            </head>
            <body>
                <Router path={path}>
                    <App modules={modules} />
                </Router>
            </body>
        </html>
    )
}

export async function App(props: { modules: ModuleDef[] }) {
    const { modules } = props;

    const moduleTypes = [...new Set(modules.map(m => m.type))];
    await Promise.all(moduleTypes.map(type => preloadSSRModule(type)));

    return (
        <div id="root">
            <ModuleRenderer modules={modules} />
        </div>
    )
}