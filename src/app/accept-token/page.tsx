// src/app/accept-token/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSignIn, useClerk, useAuth } from "@clerk/nextjs";

function now() { return new Date().toISOString(); }

export default function AcceptTokenDebug() {
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const clerk = useClerk();
  const auth = useAuth();

  const [log, setLog] = useState<string[]>([]);
  const push = (label: string, obj?: any) => {
    const line = `[${now()}] ${label} ${obj === undefined ? "" : JSON.stringify(obj, null, 2)}`;
    // eslint-disable-next-line no-console
    console.log(line);
    setLog((l) => [...l, line].slice(-200));
  };

  useEffect(() => {
    (async () => {
      push("mounted accept-token page", { signInLoaded });
      // read token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") ?? params.get("ticket");
      push("token present", !!token);

      if (!token) {
        push("no token in URL — nothing to do");
        return;
      }

      // wait briefly for signIn to be available
      const start = Date.now();
      while ((!signInLoaded || !signIn || !clerk) && Date.now() - start < 5000) {
        await new Promise((r) => setTimeout(r, 100));
      }
      push("after wait", { signInLoaded: !!signInLoaded, signInAvailable: !!signIn, clerkAvailable: !!clerk });

      if (!signIn) {
        push("ERROR: signIn object unavailable");
        return;
      }

      try {
        push("calling signIn.create with ticket (DO NOT SHARE FULL TOKEN)", { tokenSnippet: token.slice(0, 40) + "..." });
        const attempt = await signIn.create({ strategy: "ticket", ticket: token });
        push("signIn.create returned", attempt);

        // Dump the attempt keys and any known fields
        const createdSessionId = (attempt as any)?.createdSessionId ?? null;
        push("createdSessionId", createdSessionId);

        // If Clerk returned a status
        push("attempt.status", (attempt as any)?.status ?? null);

        // Attempt setActive if we have a createdSessionId
        if (createdSessionId && clerk?.setActive) {
          try {
            push("calling clerk.setActive", { createdSessionId });
            await clerk.setActive({ session: createdSessionId });
            push("clerk.setActive resolved");
          } catch (e) {
            push("clerk.setActive threw", e);
          }
        } else {
          push("no createdSessionId or setActive unavailable");
        }

        // Give Clerk a moment to settle cookies
        await new Promise((r) => setTimeout(r, 300));
        push("auth.isSignedIn", { isSignedIn: auth.isSignedIn, userId: auth.userId ?? null });

        // Check cookies for the current origin (quick snapshot)
        try {
          const cookies = document.cookie;
          push("document.cookie (snapshot)", cookies ? cookies : "<no cookies>");
        } catch (e) {
          push("reading document.cookie threw", String(e));
        }

        // Provide full debug object on screen
        push("debug finished - copy the below debug blob and paste in chat if still failing");
      } catch (err) {
        push("error during token consumption", String(err));
      }
    })();
  }, [signInLoaded, signIn, clerk, auth.isSignedIn, auth.userId]);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>Accept-token debug</h2>
      <p>This page will attempt to consume the sign-in token and print a debug log.</p>

      <div style={{ marginTop: 12 }}>
        <strong>Logs (most recent at bottom):</strong>
        <div style={{ maxHeight: 360, overflow: "auto", background: "#111", color: "#eee", padding: 12, marginTop: 8 }}>
          {log.map((l, i) => <div key={i} style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{l}</div>)}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Debug blob (copy & paste here):</strong>
        <textarea
          readOnly
          value={JSON.stringify({ logs: log, ts: new Date().toISOString() }, null, 2)}
          rows={10}
          style={{ width: "100%", marginTop: 8 }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => window.location.reload()}>Reload</button>
        <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ logs: log }, null, 2)); }} style={{ marginLeft: 8 }}>Copy debug blob</button>
      </div>
    </div>
  );
}
