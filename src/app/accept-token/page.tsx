// src/app/accept-token/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";

function dlog(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log("[ACCEPT-TOKEN]", ...args);
  try {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ source: "ACCEPT_TOKEN_DEBUG", payload: args }, "*");
    }
    if (typeof window !== "undefined" && window.localStorage) {
      const prev = JSON.parse(window.localStorage.getItem("accept_token_debug_v1") || "[]");
      prev.push({ ts: new Date().toISOString(), args: JSON.stringify(args) });
      window.localStorage.setItem("accept_token_debug_v1", JSON.stringify(prev.slice(-30)));
    }
  } catch (e) {
    console.log(e);
    // ignore
  }
}

export default function AcceptTokenPage() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const clerk = useClerk();

  useEffect(() => {
    dlog("mounted accept-token page", { signInLoaded });

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") ?? params.get("ticket");
    dlog("token present:", !!token);

    if (!token) {
      dlog("no token found -> redirecting");
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const start = Date.now();
        while ((!signInLoaded || !signIn) && Date.now() - start < 4000) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 100));
        }
        dlog("after wait: signInLoaded:", signInLoaded, "signIn exists:", !!signIn);

        if (!signIn) {
          dlog("signIn not available - abort");
          router.replace("/?signinUnavailable=1");
          return;
        }

        dlog("calling signIn.create with ticket (first 50 chars):", token.slice(0, 50));
        const attempt = await signIn.create({
          strategy: "ticket",
          ticket: token,
        });
        dlog("signIn.create result:", attempt);

        const createdSessionId = (attempt)?.createdSessionId ?? null;
        dlog("createdSessionId:", createdSessionId);

        if (createdSessionId && clerk?.setActive) {
          dlog("calling clerk.setActive");
          await clerk.setActive({ session: createdSessionId });
          dlog("setActive succeeded; now redirecting to /");
          router.replace("/");
          return;
        }

        // if we hit here, signIn didn't produce a createdSessionId
        dlog("sign-in attempt didn't produce session; full attempt:", attempt);
        // If attempt.status indicates need for verification, surface reason to logs
        // (it might be 'needs_first_factor' or such)
        router.replace("/?signinIncomplete=1");
      } catch (err) {
        dlog("accept-token error:", err);
        router.replace("/?signinError=1");
      }
    })();
  }, [router, signInLoaded, signIn, clerk]);

  return <div className="min-h-screen flex items-center justify-center">Processing sign-in token…</div>;
}
