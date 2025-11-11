"use client"

import { CallServerCallback, createFromFetch } from "@vitejs/plugin-rsc/browser";
import { createContext, useCallback, useEffect, useMemo, useState, startTransition } from "react";

type RouterCtx = {
    path: string;
    navigate: (to: string, opts?: { replace?: boolean; scroll?: boolean }) => void;
    isPending: boolean;
};

export const RouterContext = createContext<RouterCtx | null>(null);

// Cache para RSC responses
type CacheEntry = {
    promise: Promise<React.ReactNode>;
    value?: React.ReactNode;
    error?: unknown;
};

const cache = new Map<string, CacheEntry>();

const callServer: CallServerCallback = async (id, args) => {
    const res = await fetch('/_rsc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RSC-Action': id as string
        },
        body: JSON.stringify(args),
        credentials: 'include',
    });
    return createFromFetch(Promise.resolve(res), { callServer });
};

function fetchRSC(pathname: string): Promise<React.ReactNode> {
    const key = pathname;
    let entry = cache.get(key);

    if (!entry) {
        const promise = (async () => {
            const url = `${pathname}?__rsc&__partial`;
            const res = await fetch(url, { credentials: 'include' });
            const result = await createFromFetch(Promise.resolve(res), { callServer }) as any;
            // Extrae el contenido (ajusta según tu estructura)
            return result?.root || result;
        })();

        entry = { promise };
        cache.set(key, entry);

        promise
            .then(v => { entry!.value = v; })
            .catch(e => { entry!.error = e; });
    }

    if (entry.error) throw entry.error;
    if (entry.value !== undefined) return Promise.resolve(entry.value);
    return entry.promise;
}

// Función pública para prefetch
export function prefetchRoute(pathname: string): void {
    fetchRSC(pathname).catch(error => {
        console.error('Prefetch error:', error);
    });
}

const Router: React.FC<{
    children?: React.ReactNode
    path: string
}> = ({ children, path }) => {
    // Inicializa con el contenido del servidor para hidratación
    const [currentPath, setCurrentPath] = useState(path);
    const [tree, setTree] = useState<React.ReactNode>(children);
    const [isPending, setIsPending] = useState(false);

    const navigate = useCallback((to: string, opts?: { replace?: boolean; scroll?: boolean }) => {
        const url = new URL(to, window.location.origin);
        const pathname = url.pathname + url.search;

        // Actualiza la URL
        if (opts?.replace) {
            window.history.replaceState(null, '', to);
        } else {
            window.history.pushState(null, '', to);
        }

        setCurrentPath(pathname);

        startTransition(() => {
            setIsPending(true);
            fetchRSC(pathname)
                .then(newTree => {
                    setTree(newTree);
                    setIsPending(false);

                    // Scroll opcional
                    if (opts?.scroll !== false) {
                        window.scrollTo(0, 0);
                    }
                })
                .catch(error => {
                    console.error('Navigation error:', error);
                    setIsPending(false);
                });
        });
    }, []);

    // Maneja navegación con botones del navegador
    useEffect(() => {
        const handlePopState = () => {
            const pathname = window.location.pathname + window.location.search;
            setCurrentPath(pathname);

            startTransition(() => {
                setIsPending(true);
                fetchRSC(pathname)
                    .then(newTree => {
                        setTree(newTree);
                        setIsPending(false);
                    })
                    .catch(error => {
                        console.error('Navigation error:', error);
                        setIsPending(false);
                    });
            });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const ctx = useMemo<RouterCtx>(() => ({
        path: currentPath,
        navigate,
        isPending
    }), [currentPath, navigate, isPending]);

    // isPending puede usarse para mostrar un indicador de carga global o crear transiciones entre paginas
    return (
        <RouterContext.Provider value={ctx}>
            {tree}
        </RouterContext.Provider>
    );
}

export default Router;
