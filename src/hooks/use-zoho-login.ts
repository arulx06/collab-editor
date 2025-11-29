// src/hooks/use-zoho-login.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function debugLog(...args: unknown[]) {
  try {
    // normal console
    // eslint-disable-next-line no-console
    console.log("[ZOHO-DEBUG]", ...args);
    // also send to parent (if in an iframe) so parent devtools can see it
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ source: "ZOHO_DEBUG", payload: args }, "*");
      } catch (e) {
        console.log(e);
        // ignore
      }
    }
    // also write a small trace into localStorage (last message)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const prev = JSON.parse(window.localStorage.getItem("zohodebug_trace_v1" ) || "[]");
        prev.push({ ts: new Date().toISOString(), args: JSON.stringify(args) });
        // keep small
        window.localStorage.setItem("zohodebug_trace_v1", JSON.stringify(prev.slice(-20)));
      } catch (e) {
        console.log(e);
        // ignore
      }
    }
  } catch (e) {
    console.log(e);
    // ignore all debug failures
  }
}

export function useZohoLogin() {
  const router = useRouter();

  useEffect(() => {
    debugLog("useZohoLogin mounted");

    if (typeof window === "undefined") {
      debugLog("exit: window is undefined");
      return;
    }

    debugLog("location.href", window.location.href);
    const params = new URLSearchParams(window.location.search);
    const zoho = params.get("zoho");
    debugLog("zoho param raw:", zoho);

    if (!zoho) {
      debugLog("no zoho param -> returning");
      return;
    }

    (async () => {
      try {
        let zohoData;
        try {
          zohoData = JSON.parse(decodeURIComponent(zoho));
        } catch (parseErr) {
          debugLog("json parse failed, using raw", parseErr);
          zohoData = { raw: decodeURIComponent(zoho) };
        }
        debugLog("zohoData parsed:", zohoData);

        debugLog("POST /api/zoho-auth body:", zohoData);
        const res = await fetch("/api/zoho-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zohoData),
        });

        debugLog("zoho-auth status", res.status);
        const json = await res.json().catch((e) => {
          debugLog("failed to parse zoho-auth json:", e);
          return null;
        });

        debugLog("zoho-auth response json:", json);

        if (json?.token) {
          debugLog("got token, navigating to accept-token");
          // navigate to accept-token which finishes Clerk sign-in
          window.location.href = `/accept-token?token=${encodeURIComponent(json.token)}`;
        } else {
          debugLog("zoho-auth error or no token:", json);
        }
      } catch (e) {
        debugLog("useZohoLogin failed:", e);
      }
    })();
  }, [router]);
}
