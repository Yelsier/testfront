"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";

type RouterCtx = {
  path: string;
  navigate: (
    to: string,
    opts?: { replace?: boolean; scroll?: boolean },
  ) => void;
  isPending: boolean;
};

export const RouterContext = createContext<RouterCtx | null>(null);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within Router");
  return ctx;
}

// Hook para actualizar el título y meta tags
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description]);
}

// --- lazy loader del runtime browser de vite-rsc ---
type ViteRscBrowser = typeof import("@vitejs/plugin-rsc/browser");
let viteRscBrowserPromise: Promise<ViteRscBrowser> | null = null;

function getViteRscBrowser(): Promise<ViteRscBrowser> {
  if (!viteRscBrowserPromise) {
    viteRscBrowserPromise = import("@vitejs/plugin-rsc/browser");
  }
  return viteRscBrowserPromise;
}

// Cache para RSC responses
type CacheEntry = {
  promise: Promise<React.ReactNode>;
  value?: React.ReactNode;
  error?: unknown;
};
const cache = new Map<string, CacheEntry>();

function normalize(to: string) {
  const u = new URL(to, window.location.origin);
  return u.pathname + u.search;
}
function rscUrl(pathname: string) {
  return `${pathname}${pathname.includes("?") ? "&" : "?"}__rsc&__partial`;
}

async function callServer(id: string, args: unknown[]) {
  // solo browser
  if (typeof window === "undefined") {
    throw new Error("callServer called on server");
  }

  const { createFromFetch } = await getViteRscBrowser();

  const res = await fetch("/_rsc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "RSC-Action": id,
    },
    body: JSON.stringify(args),
    credentials: "include",
  });

  return createFromFetch(Promise.resolve(res), {
    callServer: (id2: any, args2: any) =>
      callServer(id2 as string, args2 as any),
  });
}

function fetchRSC(to: string): Promise<React.ReactNode> {
  if (typeof window === "undefined") {
    // en SSR nunca deberíamos llamar esto
    return Promise.reject(new Error("fetchRSC called on server"));
  }

  const pathname = normalize(to);
  const key = pathname;

  let entry = cache.get(key);
  if (!entry) {
    const promise = (async () => {
      const { createFromFetch } = await getViteRscBrowser();

      const url = rscUrl(pathname);
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "text/x-component" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`RSC ${res.status}: ${text.slice(0, 200)}`);
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/x-component")) {
        const text = await res.text().catch(() => "");
        throw new Error(`Expected RSC, got ${ct}. Body: ${text.slice(0, 200)}`);
      }

      const result = (await createFromFetch(Promise.resolve(res), {
        callServer: (id: any, args: any) =>
          callServer(id as string, args as any),
      })) as any;

      return result?.root || result;
    })();

    entry = { promise };
    cache.set(key, entry);

    promise.then((v) => (entry!.value = v)).catch((e) => (entry!.error = e));
  }

  if (entry.error) throw entry.error;
  if (entry.value !== undefined) return Promise.resolve(entry.value);
  return entry.promise;
}

export function prefetchRoute(to: string) {
  if (typeof window === "undefined") return;
  fetchRSC(to).catch(() => {});
}

const Router: React.FC<{ children?: React.ReactNode; path: string }> = ({
  children,
  path,
}) => {
  // ✅ SSR-safe: si esto llegase a renderizarse en server, no rompe nada
  if (typeof window === "undefined") {
    const ctx: RouterCtx = {
      path,
      navigate: () => {},
      isPending: false,
    };
    return (
      <RouterContext.Provider value={ctx}>{children}</RouterContext.Provider>
    );
  }

  const [currentPath, setCurrentPath] = useState(path);
  const [tree, setTree] = useState<React.ReactNode>(children);
  const [isPending, setIsPending] = useState(false);

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean; scroll?: boolean }) => {
      const pathname = normalize(to);

      if (opts?.replace) window.history.replaceState(null, "", pathname);
      else window.history.pushState(null, "", pathname);

      setCurrentPath(pathname);

      startTransition(() => {
        setIsPending(true);
        fetchRSC(pathname)
          .then((newTree) => {
            setTree(newTree);
            setIsPending(false);
            if (opts?.scroll !== false) window.scrollTo(0, 0);
          })
          .catch((err) => {
            console.error("Navigation error:", err);
            setIsPending(false);
          });
      });
    },
    [],
  );

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname + window.location.search;
      setCurrentPath(pathname);

      startTransition(() => {
        setIsPending(true);
        fetchRSC(pathname)
          .then((newTree) => {
            setTree(newTree);
            setIsPending(false);
          })
          .catch((err) => {
            console.error("Navigation error:", err);
            setIsPending(false);
          });
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const ctx = useMemo<RouterCtx>(
    () => ({ path: currentPath, navigate, isPending }),
    [currentPath, navigate, isPending],
  );

  return <RouterContext.Provider value={ctx}>{tree}</RouterContext.Provider>;
};

export default Router;
