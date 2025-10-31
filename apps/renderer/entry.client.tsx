import { ModuleRenderer } from "../../packages/runtime";
import "./registry";
import * as ReactDOM from "react-dom/client";

const data = (window as any).__DATA__;

// Verificamos si el elemento root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// En desarrollo, usamos createRoot. En producción con SSR, usamos hydrateRoot
if (data && data.modules) {
  // Modo hidratación (SSR)
  ReactDOM.hydrateRoot(
    rootElement,
    <ModuleRenderer modules={data.modules} />
  );
} else {
  // Modo desarrollo (CSR)
  const root = ReactDOM.createRoot(rootElement);
  const fallbackModules = [
    { type: "Hero", key: "hero-dev", props: { title: "Modo Desarrollo" } }
  ];
  root.render(<ModuleRenderer modules={fallbackModules} />);
}