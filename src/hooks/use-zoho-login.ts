"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";

function debugLog(...args: unknown[]) {
  console.log("[ZOHO-DEBUG]", ...args);
}

export function useZohoLogin() {
  const router = useRouter();
  const search = useSearchParams();
  const zoho = search.get("zoho");
  const token = search.get("token");

  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();  

  useEffect(() => {
    // -------------------- PHASE 2: Token consumption --------------------
    if (token && isLoaded) {
      debugLog("Found token, consuming with Clerk...");

      (async () => {
        try {
          const resp = await signIn.create({
            strategy: "ticket",
            ticket: token,
          });

          await setActive({ session: resp.createdSessionId });

          debugLog("Token consumed successfully. Redirect → /");
          router.replace("/");
        } catch (e) {
          console.error("Failed to consume sign-in token:", e);
        }
      })();

      return;
    }

    if (!isLoaded) return;

    // -------------------- PHASE 1: Zoho payload handling --------------------
    if (!zoho) return;

    debugLog("Zoho login flow starting...");

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
          debugLog("Zoho auth successful → redirecting to /?token=...");
          router.replace(`/?token=${encodeURIComponent(json.token)}`);
        } else {
          debugLog("zoho-auth failed:", json);
        }
      } catch (e) {
        console.error("Zoho login failed:", e);
      }
    })();
  }, [isLoaded, zoho, token]);
}
