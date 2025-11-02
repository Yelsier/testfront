import { ModuleRenderer } from "../../packages/runtime";
import * as ReactDOM from "react-dom/client";
import { loadModule } from "./registry";

const data = (window as any).__DATA__;

// Verificamos si el elemento root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

if (!data || !data.modules) {
  console.error("❌ No data found in window.__DATA__");
  console.error("Make sure you're running the dev server with SSR:");
  console.error("  pnpm dev (uses dev-server.ts with SSR)");
  console.error("  NOT: pnpm dev:vite (pure client-side)");
  throw new Error("Missing SSR data. Use 'pnpm dev' instead of 'pnpm dev:vite'");
}

// Sin SSR, usar createRoot
const root = ReactDOM.createRoot(rootElement);
root.render(
  <ModuleRenderer modules={data.modules} loadModule={loadModule} />
);