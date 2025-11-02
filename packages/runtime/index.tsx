import { loadModuleType } from "apps/renderer/registry";
import React, { Suspense, useEffect, useRef, startTransition } from "react";
import * as ReactDOMClient from "react-dom/client";

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

  if (shouldBeLazy) {
    return <Island type={module.type} props={module.props} loadModule={loadModule} />;
  }

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

// "Isla" - Renderizado lazy (solo renderiza cuando es visible)
// ✅ Siempre renderiza el HTML (para evitar hydration mismatch)
// 🏝️ Pero deshabilita JavaScript hasta que sea visible
export function Island({ type, props, loadModule }: { type: string; props: any; loadModule: loadModuleType }) {
  const ref = useRef<HTMLDivElement>(null);
  const [jsActive, setJsActive] = React.useState(false);

  // Memoizar el componente para evitar recrearlo en cada render
  const C = React.useMemo(() => loadModule(type), [type, loadModule]);

  useEffect(() => {
    // Solo en el cliente (navegador)
    if (typeof window === 'undefined') return;

    console.log(`🏝️ Island watching: ${type}`);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log(`👁️ Island visible, activating JS: ${type}`);
          obs.disconnect();

          const activate = () => {
            console.time(`⏱️ Activation time: ${type}`);
            setJsActive(true);
            console.timeEnd(`⏱️ Activation time: ${type}`);
            console.log(`✅ Island JS active: ${type}`);
          };

          // Usar requestIdleCallback si está disponible
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(activate);
          } else {
            setTimeout(activate, 0);
          }
        }
      },
      {
        // Empezar a cargar 200px antes de que entre en viewport
        rootMargin: '200px'
      }
    );

    if (ref.current) {
      obs.observe(ref.current);
    }

    return () => obs.disconnect();
  }, [type]);

  // Siempre renderizar el componente (para SSR y evitar hydration errors)
  // Solo deshabilitamos interactividad hasta que sea visible
  const containerStyle = typeof window !== 'undefined' && !jsActive
    ? { pointerEvents: 'none' as const, position: 'relative' as const }
    : { position: 'relative' as const };

  return (
    <div ref={ref} style={containerStyle}>
      {/* Siempre renderizar el componente */}
      <C {...props} />
    </div>
  );
}