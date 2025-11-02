import { lazy } from "react";

// Cache de componentes lazy para evitar recrearlos infinitamente
const moduleCache = new Map<string, React.LazyExoticComponent<any>>();

export const loadModule = (type: string) => {
    console.log("Loading module", type);

    // Si ya está en cache, devolverlo
    if (moduleCache.has(type)) {
        return moduleCache.get(type)!;
    }

    // Crear el componente lazy y guardarlo en cache
    const lazyComponent = lazy(() => import(`./modules/${type}.tsx`));
    moduleCache.set(type, lazyComponent);

    return lazyComponent;
};

export type loadModuleType = typeof loadModule;