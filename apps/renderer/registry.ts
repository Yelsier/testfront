import React, { lazy } from "react";

// Cache de componentes lazy para evitar recrearlos infinitamente
const moduleCache = new Map<string, { component: React.LazyExoticComponent<any>, fallback?: React.LazyExoticComponent<any> }>();

// Cache de componentes para SSR (componentes reales, no lazy)
const ssrCache = new Map<string, { component: React.ComponentType<any>, fallback?: React.ComponentType<any> }>();

// Función para pre-cargar módulo en servidor
export async function preloadSSRModule(type: string): Promise<void> {
    if (ssrCache.has(type)) {
        return;
    }

    try {
        const module = await import(`./modules/${type}.tsx`);
        const Component = module.default;
        const Fallback = module.Fallback;
        ssrCache.set(type, {
            component: Component,
            fallback: Fallback
        });
    } catch (error) {
        console.warn(`Failed to preload SSR module ${type}:`, error);
        const fallback = () => React.createElement('div', null, `Error loading ${type}`);
        ssrCache.set(type, { component: fallback });
    }
}

export const loadModule = (type: string): { component: React.ComponentType<any>, fallback?: React.ComponentType<any> } => {
    // En servidor: usar componentes pre-cargados del cache SSR
    if (typeof window === 'undefined') {
        const cache = ssrCache.get(type);
        if (!cache) {
            console.warn(`SSR Module ${type} not preloaded. Use preloadSSRModule first.`);
            return { component: () => React.createElement('div', null, `Loading ${type}...`) };
        }
        return { component: cache.component, fallback: cache.fallback };
    }

    // En cliente: usar lazy components con cache (para chunks)
    if (moduleCache.has(type)) {
        return moduleCache.get(type)!;
    }

    const lazyComponent = lazy(() => import(`./modules/${type}.tsx`));
    const fallbackComponent = lazy(() => import(`./modules/${type}.tsx`).then(module => ({
        default: module.Fallback
    })));
    console.log({
        lazyComponent,
        fallbackComponent
    });

    console.log("⏳ Importing module:", type);
    moduleCache.set(type, { component: lazyComponent, fallback: fallbackComponent });

    return {
        component: lazyComponent,
        fallback: fallbackComponent
    };
};

export type loadModuleType = typeof loadModule;
export type ModuleType = ReturnType<loadModuleType>;