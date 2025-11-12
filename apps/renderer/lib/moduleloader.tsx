import { loadModule } from "./registry";
import { Suspense } from "react";
import LazyImport from "./island";
import { ErrorBoundary } from "./ErrorBoundary";

export type ModuleDef = { type: string; key: string; props: any };

export const isAsyncFunction = (fn: unknown): fn is (...a: any[]) => Promise<any> =>
  typeof fn === "function" && fn.constructor?.name === "AsyncFunction";

export const isClientComponent = (component: any): boolean => {
  return component?.$$typeof?.toString() === "Symbol(react.client.reference)";
}

export function SmartModule({ module, index }: { module: ModuleDef; index: number }) {
  const { component: C, fallback: F, isLazy } = loadModule(module.type);
  const isAsync = isAsyncFunction(C);
  const isClient = isClientComponent(C);

  const shouldBeLazy = isLazy && index > 2;

  if (shouldBeLazy) {
    return (
      <LazyImport
        key={`lazy-${module.key}-${module.type}`}
        type={module.type}
        props={module.props}
        fallback={F ? <F {...module.props} /> : null}
        rootMargin="300px"
        threshold={0}
        preloadOnHover
      />
    );
  }

  return isAsync ? (
    <Suspense fallback={F ? <F {...module.props} /> : null}>
      <C {...module.props} />
    </Suspense>
  ) : isClient ? (
    <C {...module.props} />
  ) : (
    <C {...module.props} />
  );
}

export function ModuleRenderer({ modules }: { modules: ModuleDef[] }) {
  return modules.map((m, index) => (
    <ErrorBoundary key={`error-${m.key}`}>

      <SmartModule key={m.key} module={m} index={index} />
    </ErrorBoundary>
  ));
}