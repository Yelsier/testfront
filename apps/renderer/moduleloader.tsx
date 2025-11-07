import { loadModule } from "./registry";
import { Suspense } from "react";
import { Island } from "./island";

export type ModuleDef = { type: string; key: string; props: any };

// 🎯 Configuración de lazy loading por tipo de componente
// El FRONTEND decide qué componentes son lazy, no el backend
const LAZY_COMPONENTS = new Set([
  "Gallery",
  "Comments",
  "VideoPlayer",
  "Map",
  "Chart",
  // Añade aquí los componentes que quieres cargar lazy
]);

export const isAsyncFunction = (fn: unknown): fn is (...a: any[]) => Promise<any> =>
  typeof fn === "function" && fn.constructor?.name === "AsyncFunction";

// Componente que decide automáticamente si usar Island o no
export function SmartModule({ module, index }: { module: ModuleDef; index: number; }) {
  // Memoizar el componente para evitar recrearlo en cada render
  const { component: C, fallback: F } = loadModule(module.type)

  //Async function
  const isAsync = isAsyncFunction(C);

  // Decidir si debe ser lazy:
  // 1. Si está en la lista de componentes lazy
  // 2. O si está después del índice 2 (tercer componente en adelante)
  const shouldBeLazy = LAZY_COMPONENTS.has(module.type) || index > 2;

  if (shouldBeLazy) {
    return <Island type={module.type} props={module.props} >
      <C key={module.key} {...module.props} />
    </Island>
  }

  return isAsync ?
    <Suspense fallback={F ? <F /> : null}>
      <C {...module.props} />
    </Suspense>
    : <C {...module.props} />;
}

export function ModuleRenderer({ modules }: { modules: ModuleDef[] }) {
  return modules.map((m, index) => (
    <SmartModule key={m.key} module={m} index={index} />
  ));
}