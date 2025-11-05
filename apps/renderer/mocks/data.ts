import type { ResolveResponse } from "./types";

// 🧪 MOCK DATA para desarrollo
// Puedes modificar esto libremente sin tocar el backend

export const mockPages: Record<string, ResolveResponse> = {
    "/": {
        renderMode: "static",
        ttl: 86400,
        modules: [
            {
                type: "Hero",
                key: "hero-home",
                props: {
                    title: "Bienvenido al CMS (Mock)"
                }
            },
            {
                type: "JsonTest",
                key: "json-test-1",
                props: {}
            },
            {
                type: "HeavyServer",
                key: "heavy-server-1",
                props: {}
            },
            {
                type: "Hero",
                key: "hero-second",
                props: {
                    title: "Segundo Hero (Mock)"
                }
            },
            {
                type: "Gallery",
                key: "gallery-1",
                props: {
                    title: "Mi Galería de Fotos"
                }
            }
        ],
        seo: {
            title: "Home - CMS",
            description: "Página principal del CMS"
        }
    },

    "/about": {
        renderMode: "static",
        ttl: 3600,
        modules: [
            {
                type: "Hero",
                key: "hero-about",
                props: {
                    title: "Sobre Nosotros (Mock)"
                }
            }
        ],
        seo: {
            title: "About - CMS",
            description: "Información sobre nuestra empresa"
        }
    },

    "/products": {
        renderMode: "dynamic",
        modules: [
            {
                type: "Hero",
                key: "hero-products",
                props: {
                    title: "Productos Dinámicos (Mock)"
                }
            }
        ],
        seo: {
            title: "Productos - CMS"
        }
    }
};

// Página por defecto para rutas no encontradas
export const mockNotFound: ResolveResponse = {
    renderMode: "dynamic",
    modules: [
        {
            type: "Hero",
            key: "hero-404",
            props: {
                title: "Página no encontrada (404)"
            }
        }
    ],
    seo: {
        title: "404 - Página no encontrada"
    }
};

export function getMockPage(path: string): ResolveResponse {
    if (mockPages[path]) {
        return mockPages[path];
    }

    // Simular páginas dinámicas (blog)
    if (path.startsWith("/blog/")) {
        const slug = path.replace("/blog/", "");
        return {
            renderMode: "dynamic",
            modules: [
                {
                    type: "Hero",
                    key: `hero-blog-${slug}`,
                    props: {
                        title: `Blog Post: ${slug} (Mock)`
                    }
                }
            ],
            seo: {
                title: `${slug} - Blog`
            }
        };
    }

    return mockNotFound;
}
