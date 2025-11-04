"use client"

import React, { useRef, useEffect } from "react";
import { loadModuleType } from "./registry";

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