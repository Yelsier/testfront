/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
    glob: (pattern: string, options?: { eager?: boolean; import?: string; as?: string }) => Record<string, any>
}