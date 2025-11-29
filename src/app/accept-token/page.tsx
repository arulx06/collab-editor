"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";

export default function AcceptTokenPage() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const clerk = useClerk();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "failed" | "no-token">("idle");

  useEffect(() => {
    async function consumeToken() {
      setStatus("working");

      // read token from query param
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") ?? params.get("ticket"); // accept either name

      if (!token) {
        setStatus("no-token");
        // fallback: go home in a second
        setTimeout(() => router.replace("/"), 900);
        return;
      }

      // wait for Clerk signIn JS icon to load
      if (!signInLoaded || !signIn) {
        // If Clerk not loaded yet, wait and retry a few times
        const start = Date.now();
        while ((!signInLoaded || !signIn) && Date.now() - start < 5000) {
          // small delay
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      if (!signIn) {
        console.error("Clerk signIn object not available");
        setStatus("failed");
        return;
      }

      try {
        // Create a sign-in attempt using the ticket strategy.
        // This consumes the backend-created sign-in token.
        const signInAttempt = await signIn.create({
          strategy: "ticket",
          ticket: token,
        });

        // If the sign-in attempt produced a created session id, set it active.
        // This avoids any UI. setActive makes the session the current browser session.
        const createdSessionId = (signInAttempt)?.createdSessionId ?? null;

        if (createdSessionId && clerk?.setActive) {
          // setActive expects SetActiveParams — pass session id
          await clerk.setActive({ session: createdSessionId });
          setStatus("done");

          // Now user is signed in in-browser. Redirect to app home / desired page.
          router.replace("/");
          return;
        }

        // Some setups require extra verification steps (2FA / first factor). If that
        // happens we cannot complete silently. Handle it gracefully:
        if ((signInAttempt)?.status === "needs_first_factor") {
          console.warn("Sign-in requires first factor verification; cannot complete silently.");
          setStatus("failed");
          // decide: redirect to a UI route to complete verification, or fallback to sign-in page:
          router.replace("/sign-in"); // optional
          return;
        }

        // If no createdSessionId and no explicit need-for-interaction, treat as failure
        console.error("No createdSessionId returned from signIn.create:", signInAttempt);
        setStatus("failed");
      } catch (err) {
        console.error("Error accepting sign-in token:", err);
        setStatus("failed");
      }
    }

    // Run once on mount
    consumeToken();
  }, [router, signInLoaded, signIn, clerk]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>
        {status === "working" && <p>Signing you in…</p>}
        {status === "done" && <p>Signed in — redirecting…</p>}
        {status === "failed" && (
          <div>
            <p>Could not sign you in silently. Please try signing in manually.</p>
            <button onClick={() => window.location.replace("/sign-in")}>Open sign-in</button>
          </div>
        )}
        {status === "no-token" && <p>No token found in URL.</p>}
      </div>
    </div>
  );
}
