import { loadModuleType } from "apps/renderer/registry";
import React, { Suspense, useEffect, useRef, startTransition } from "react";
import * as ReactDOMClient from "react-dom/client";
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

// Componente que decide automáticamente si usar Island o no
export function SmartModule({ module, index, loadModule }: { module: ModuleDef; index: number; loadModule: loadModuleType }) {
  // Memoizar el componente para evitar recrearlo en cada render
  const C = React.useMemo(() => loadModule(module.type), [module.type, loadModule]);

  // Decidir si debe ser lazy:
  // 1. Si está en la lista de componentes lazy
  // 2. O si está después del índice 2 (tercer componente en adelante)
  const shouldBeLazy = LAZY_COMPONENTS.has(module.type) || index > 2;

  /* if (shouldBeLazy) {
    return <Island type={module.type} props={module.props} loadModule={loadModule} />;
  } */

  return <C key={module.key} {...module.props} />;
}

export function ModuleRenderer({ modules, loadModule }: { modules: ModuleDef[], loadModule: loadModuleType }) {
  const content = modules.map((m, index) => (
    <SmartModule key={m.key} module={m} index={index} loadModule={loadModule} />
  ));

  // En servidor: sin Suspense (componentes síncronos cargados con require)
  if (typeof window === 'undefined') {
    return <>{content}</>;
  }

  // En cliente: con Suspense (componentes lazy para chunks)
  return (
    <Suspense fallback={<div>Loading modules...</div>}>
      {content}
    </Suspense>
  );
}