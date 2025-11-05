import React, { lazy } from "react";

// Cache de componentes lazy para evitar recrearlos infinitamente
const moduleCache = new Map<string, React.LazyExoticComponent<any>>();

// Cache de componentes para SSR (componentes reales, no lazy)
const ssrCache = new Map<string, React.ComponentType<any>>();

// Función para pre-cargar módulo en servidor
export async function preloadSSRModule(type: string): Promise<void> {
    if (ssrCache.has(type)) {
        return;
    }

    try {
        const module = await import(`./modules/${type}.tsx`);
        const Component = module.default;
        ssrCache.set(type, Component);
    } catch (error) {
        console.warn(`Failed to preload SSR module ${type}:`, error);
        const fallback = () => React.createElement('div', null, `Error loading ${type}`);
        ssrCache.set(type, fallback);
    }
}

export const loadModule = (type: string): React.ComponentType<any> => {
    // En servidor: usar componentes pre-cargados del cache SSR
    if (typeof window === 'undefined') {
        const Component = ssrCache.get(type);
        if (!Component) {
            console.warn(`SSR Module ${type} not preloaded. Use preloadSSRModule first.`);
            return () => React.createElement('div', null, `Loading ${type}...`);
        }
        return Component;
    }

    // En cliente: usar lazy components con cache (para chunks)
    if (moduleCache.has(type)) {
        return moduleCache.get(type)!;
    }

    const lazyComponent = lazy(() => import(`./modules/${type}.tsx`));
    console.log("⏳ Importing module:", type);
    moduleCache.set(type, lazyComponent);

    return lazyComponent;
};

export type loadModuleType = typeof loadModule;
export type ModuleType = ReturnType<loadModuleType>;