"use client";
import { usePageMeta } from "./router";

export function PageMetaUpdater({ title, description }: { title?: string; description?: string }) {
    usePageMeta(title, description);
    return null;
}
