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
        // Para SSR: solo el cliente
        client: path.resolve(__dirname, "entry.client.tsx"),
        // Para SPA (opcional): también el HTML
        // main: path.resolve(__dirname, "index.html")
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});