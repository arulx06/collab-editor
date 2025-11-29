// src/hooks/use-zoho-login.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useZohoLogin() {
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const zoho = params.get("zoho");
    if (!zoho) return;

    (async () => {
      try {
        let zohoData;
        try {
          zohoData = JSON.parse(decodeURIComponent(zoho));
        } catch {
          zohoData = { raw: decodeURIComponent(zoho) };
        }

        const res = await fetch("/api/zoho-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zohoData),
        });

        const json = await res.json();
        if (json?.token) {
          // navigate to accept-token which finishes Clerk sign-in
          window.location.href = `/accept-token?token=${encodeURIComponent(json.token)}`;
        } else {
          console.error("zoho-auth error:", json);
        }
      } catch (e) {
        console.error("useZohoLogin failed", e);
      }
    })();
  }, [router]);
}
