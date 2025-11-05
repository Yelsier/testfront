"use client"

import React, { useRef, useEffect } from "react";
import { loadModuleType, ModuleType } from "./registry";

// "Isla" - Renderizado lazy (solo renderiza cuando es visible)
// ✅ Siempre renderiza el HTML (para evitar hydration mismatch)
// 🏝️ Pero deshabilita JavaScript hasta que sea visible
export function Island({ type, children, props }: { type: string; children: React.ReactNode; props: any }) {
    const ref = useRef<HTMLDivElement>(null);
    const [jsActive, setJsActive] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        // Marcar como mounted para evitar hydration mismatch
        setMounted(true);

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
    // ⚠️ Solo aplicar estilos después de montar en el cliente
    const shouldDisableInteraction = mounted && !jsActive;

    return (
        <div
            ref={ref}
            style={{
                position: 'relative' as const,
                pointerEvents: shouldDisableInteraction ? 'none' : 'auto'
            }}
        >
            {/* Siempre renderizar el componente */}
            {children}
        </div>
    );
}