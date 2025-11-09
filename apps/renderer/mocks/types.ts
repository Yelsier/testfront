// Tipos para la respuesta de la API CMS
export type RenderMode = "static" | "dynamic";

export interface ModuleDef {
    type: string;
    key: string;
    props: any;
}

export interface SEO {
    title?: string;
    description?: string;
    image?: string;
    keywords?: string[];
}

export interface ResolveResponse {
    renderMode: RenderMode;
    ttl?: number;
    modules: ModuleDef[];
    seo?: SEO;
}
