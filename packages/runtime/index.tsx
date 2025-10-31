import React, { Suspense, useEffect, useRef, startTransition } from "react";
import * as ReactDOMClient from "react-dom/client";

type ModuleDef = { type: string; key: string; props: any };
const registry: Record<string, React.ComponentType<any>> = {};

export function register(type: string, cmp: React.ComponentType<any>) {
  registry[type] = cmp;
}

export function ModuleRenderer({ modules }: { modules: ModuleDef[] }) {
  return (
    <Suspense fallback={null}>
      {modules.map(m => {
        const C = registry[m.type];
        if (!C) return null;
        return <C key={m.key} {...m.props} />;
      })}
    </Suspense>
  );
}

// “Isla” opcional (hidratación diferida)
export function Island({ type, props }: { type: string; props: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hydrate = () => {
      const C = registry[type];
      if (!C || !ref.current) return;
      startTransition(() => {
        ReactDOMClient.createRoot(ref.current!).render(<C {...props} />);
      });
    };
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); (window as any).requestIdleCallback?.(hydrate) ?? hydrate(); }
    });
    obs.observe(ref.current!);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} suppressHydrationWarning />;
}
