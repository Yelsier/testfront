// LazyImport.tsx (client)
"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

type LazyImportProps = {
    type: string;                 // clave del módulo
    props?: Record<string, any>;   // props serializables
    fallback?: React.ReactNode;    // se muestra hasta activar/cargar
    rootMargin?: string;
    threshold?: number | number[];
    preloadOnHover?: boolean;
};

/**
 * 
 * This component does NOT render HTML on the client side until activated.
 * It uses IntersectionObserver to detect when it enters the viewport,
 * and then dynamically imports and renders the actual component.
 * 
 * It affects performance positively by reducing initial JS execution and hydration time,
 * but may have SEO implications since content is not present in the initial HTML.
 * 
 */
export default function LazyImport({
    type,
    props,
    fallback = null,
    rootMargin = "300px",
    threshold = 0,
    preloadOnHover = true,
}: LazyImportProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [ActiveComp, setActiveComp] = useState<React.ComponentType<any> | null>(null);
    const activatedRef = useRef(false);

    const activate = useCallback(() => {
        if (activatedRef.current) return;
        activatedRef.current = true;

        const run = async () => {
            console.time(`⏱️ Activation time: ${type}`);
            console.log(`📦 Importing module: ${type}`);
            const mod = await import(`./modules/${type}`);
            setActiveComp(() => mod.default);
            console.timeEnd(`⏱️ Activation time: ${type}`);
            console.log(`✅ LazyImport active: ${type}`);
        };

        if (typeof (window as any).requestIdleCallback === "function") {
            console.log(`🕒 Idle activate scheduled: ${type}`);
            (window as any).requestIdleCallback(run);
        } else {
            console.log(`🕒 setTimeout activate scheduled: ${type}`);
            setTimeout(run, 0);
        }
    }, [type]);

    useEffect(() => {
        console.log(`🏝️ LazyImport mounted & watching: ${type}`);
        const node = ref.current;
        if (!node) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    console.log(`👁️ Visible → activating: ${type}`);
                    io.disconnect();
                    activate();
                }
            },
            { rootMargin, threshold }
        );
        io.observe(node);

        return () => {
            io.disconnect();
            console.log(`🧹 IO disconnected: ${type}`);
        };
    }, [activate, rootMargin, threshold, type]);

    useEffect(() => {
        if (!preloadOnHover || !ref.current) return;
        const node = ref.current;
        const onOver = () => {
            console.log(`🪝 Preload on hover/touch → activating: ${type}`);
            activate();
        };
        node.addEventListener("pointerover", onOver, { passive: true });
        node.addEventListener("touchstart", onOver, { passive: true });
        return () => {
            node.removeEventListener("pointerover", onOver);
            node.removeEventListener("touchstart", onOver);
            console.log(`🧹 Hover listeners removed: ${type}`);
        };
    }, [preloadOnHover, activate, type]);

    return (
        <div ref={ref} data-lazy-import={type}>
            {ActiveComp ? <ActiveComp {...props} /> : fallback}
        </div>
    );
}
