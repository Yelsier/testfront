import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        client: path.resolve(__dirname, "entry.client.tsx"),
      },
      output: {
        entryFileNames: "client.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});