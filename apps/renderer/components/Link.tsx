"use client";
import { useContext } from "react";
import { RouterContext, prefetchRoute } from "../lib/router";

const Link: React.FC<{
    href: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    children: React.ReactNode;
}> = ({ href, replace, scroll, prefetch = true, children }) => {
    const router = useContext(RouterContext);
    if (!router) {
        throw new Error("Link must be used within a Router");
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        router.navigate(href, { replace, scroll });
    };

    const handleMouseEnter = () => {
        if (prefetch) {
            prefetchRoute(href);
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
        >
            {children}
        </a>
    );
}

export default Link;