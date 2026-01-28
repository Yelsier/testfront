import {
  createFromReadableStream,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply,
} from "@vitejs/plugin-rsc/browser";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import type { RscPayload } from "./entry.rsc";

import Router from "./lib/router"; // ajusta la ruta

async function main() {
  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);

  // ✅ Si usas server actions, deja esto (adaptado a tu endpoint)
  setServerCallback(async (id, args) => {
    const temporaryReferences = createTemporaryReferenceSet();
    const res = await fetch("/_rsc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RSC-Action": id as string,
      },
      body: JSON.stringify(args),
      credentials: "include",
    });

    // OJO: si tu server actions espera el formato encodeReply/temporary refs,
    // entonces usa encodeReply en lugar de JSON.stringify (depende de cómo lo montaste en server)
    // body: await encodeReply(args, { temporaryReferences }),

    const payload = await createFromReadableStream<RscPayload>(
      // @ts-ignore
      res.body,
      { temporaryReferences } as any,
    );

    return payload.returnValue;
  });

  const path = window.location.pathname + window.location.search;

  hydrateRoot(
    document,
    <React.StrictMode>
      <Router path={path}>{initialPayload.root}</Router>
    </React.StrictMode>,
    { formState: initialPayload.formState },
  );
}

main();
