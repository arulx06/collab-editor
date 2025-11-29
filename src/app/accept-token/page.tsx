// src/app/accept-token/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "starting" | "accepting" | "done" | "no-token" | "failed";

export default function AcceptTokenPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("starting");

  useEffect(() => {
    if (typeof window === "undefined") return; // browser only

    async function acceptTokenFlow() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("no-token");
          setTimeout(() => router.replace("/"), 800);
          return;
        }

        setStatus("accepting");
        console.log("[accept-token] token found, attempting to accept with Clerk...");

        // 1) Preferred API: authenticateWithTicket
        if (window.Clerk?.authenticateWithTicket) {
          try {
            await window.Clerk.authenticateWithTicket({ ticket: token });
            console.log("[accept-token] authenticateWithTicket succeeded");
            setStatus("done");
            router.replace("/");
            return;
          } catch (err: unknown) {
            console.warn("[accept-token] authenticateWithTicket failed:", formatError(err));
          }
        }

        // 2) Fallback API: openSignIn
        if (window.Clerk?.openSignIn) {
          try {
            await window.Clerk.openSignIn({ strategy: "ticket", ticket: token });
            console.log("[accept-token] openSignIn succeeded");
            setStatus("done");
            router.replace("/");
            return;
          } catch (err: unknown) {
            console.warn("[accept-token] openSignIn failed:", formatError(err));
          }
        }

        // 3) Fallback: redirect with token in hash
        console.warn("[accept-token] No Clerk client accept method found, redirecting with token in hash.");
        window.location.replace(`/?clerk_ticket=${encodeURIComponent(token)}`);
      } catch (err: unknown) {
        console.error("[accept-token] unexpected error:", formatError(err));
        setStatus("failed");
        setTimeout(() => router.replace("/?loginError=1"), 1200);
      }
    }

    acceptTokenFlow();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        {status === "starting" && <div>Preparing to sign you in…</div>}
        {status === "accepting" && <div>Signing you in — please wait…</div>}
        {status === "done" && <div>Signed in. Redirecting…</div>}
        {status === "no-token" && <div>No token found. Redirecting…</div>}
        {status === "failed" && (
          <div>
            Sign-in failed. You can close this window and try again, or contact support.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Safely format unknown errors
 */
function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
