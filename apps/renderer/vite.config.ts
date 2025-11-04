import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc"
import path from "path";

export default defineConfig({
  plugins: [rsc({}), react()],
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, "public"),
  environments: {
    // `rsc` environment loads modules with `react-server` condition.
    // this environment is responsible for:
    // - RSC stream serialization (React VDOM -> RSC stream)
    // - server functions handling
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: './entry.rsc.tsx',
          },
          output: {
            entryFileNames: "client.js",
            chunkFileNames: "chunks/[name].js",
            assetFileNames: "assets/[name]-[hash].[ext]"
          }
        },
      },
    },

    // `ssr` environment loads modules without `react-server` condition.
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional SSR (React VDOM -> HTML string/stream)
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: './entry.ssr.tsx',
          },
          output: {
            entryFileNames: "client.js",
            chunkFileNames: "chunks/[name].js",
            assetFileNames: "assets/[name]-[hash].[ext]"
          }
        },
      },
    },

    // client environment is used for hydration and client-side rendering
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional CSR (React VDOM -> Browser DOM tree mount/hydration)
    // - refetch and re-render RSC
    // - calling server functions
    client: {
      build: {
        rollupOptions: {
          input: {
            index: './entry.browser.tsx',
          },
          output: {
            entryFileNames: "client.js",
            chunkFileNames: "chunks/[name].js",
            assetFileNames: "assets/[name]-[hash].[ext]"
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
});