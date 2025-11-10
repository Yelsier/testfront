"use client"

import { createFromFetch } from "@vitejs/plugin-rsc/browser";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RscPayload } from "../entry.rsc";

type RouterCtx = {
    path: string;
    navigate: (to: string, opts?: { replace?: boolean; scroll?: boolean }) => void;
};

const RouterContext = createContext<RouterCtx | null>(null);

const Router: React.FC<{
    children?: React.ReactNode
    path: string
}> = ({ children, path }) => {

    const [currentPath, setCurrentPath] = useState(path);
    const [tree, setTree] = useState<React.ReactNode | null>(null);

    const navigate = useCallback((to: string, opts?: { replace?: boolean; scroll?: boolean }) => {

    }, []);

    const ctx = useMemo<RouterCtx>(() => ({ path, navigate }), [path, navigate]);

    useEffect(() => {
        createFromFetch(fetch("/about?__rsc", { credentials: 'include' }) as any).then((res) => {
            console.log(res);

            setTree((res as RscPayload).app);
        })
    }, [])


    const handleChange = () => {
        createRoot(document.getElementById('root')!).render(tree);
    }

    return <RouterContext.Provider value={ctx}>
        <button onClick={handleChange}>Change</button>
        {children}
    </RouterContext.Provider>
}

export default Router;
