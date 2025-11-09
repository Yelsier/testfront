import { ModuleDef, ModuleRenderer } from "./moduleloader"
import { preloadSSRModule } from "./registry";
import type { ResolveResponse, SEO } from "../mocks/types";
import { getMockPage } from "../mocks/data";


export async function Root(props: { modules: ModuleDef[], seo?: SEO }) {
    const { modules, seo } = props;

    const moduleTypes = [...new Set(modules.map(m => m.type))];
    await Promise.all(moduleTypes.map(type => preloadSSRModule(type)));

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
                <div id="root">
                    <ModuleRenderer modules={modules} />
                </div>
            </body>
        </html>
    )
}
