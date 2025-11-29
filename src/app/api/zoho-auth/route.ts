// src/app/api/zoho-auth/route.ts
import { NextResponse } from "next/server";
import { clerkClient as getClerkClient } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";

type ZohoPayload = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [k: string]: unknown;
};

function safeStringify(v: unknown) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

function makeRandomPassword(): string {
  const base = randomBytes(16).toString("base64").replace(/[/+=]/g, "A");
  return base.slice(0, 12) + "1!";
}

function sanitizeUsername(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[_\-.]+|[_\-.]+$/g, "")
    .slice(0, 20) || `user${Math.floor(Math.random() * 10000)}`;
}

export async function POST(req: Request) {
  try {
    console.log("[ZOHO-AUTH] incoming request");
    const body = (await req.json()) as ZohoPayload;
    console.log("[ZOHO-AUTH] body:", safeStringify(body));

    if (!body || (!body.id && !body.email)) {
      return NextResponse.json({ error: "missing zoho id or email" }, { status: 400 });
    }

    const clerkClient = await getClerkClient();

    const zohoId = typeof body.id === "string" ? body.id : undefined;
    const zohoEmail = typeof body.email === "string" ? body.email : undefined;
    const firstName = typeof body.first_name === "string" ? body.first_name : undefined;
    const lastName = typeof body.last_name === "string" ? body.last_name : undefined;

    // try to find existing user by email or by public metadata
    let foundUser: any = null;
    try {
      if (zohoEmail) {
        const listResp = await clerkClient.users.getUserList({ emailAddress: [zohoEmail] });
        if (Array.isArray(listResp.data) && listResp.data.length > 0) {
          foundUser = listResp.data[0];
          console.log("[ZOHO-AUTH] found user by email:", foundUser.id);
        }
      }
    } catch (e) {
      console.error("[ZOHO-AUTH] error listing users by email:", e);
    }

    try {
      if (!foundUser && zohoId) {
        const listResp = await clerkClient.users.getUserList({ limit: 200 });
        if (Array.isArray(listResp.data)) {
          foundUser = listResp.data.find((u) => {
            try {
              const meta = (u as any).publicMetadata;
              return meta && meta.zohoId === zohoId;
            } catch {
              return false;
            }
          }) ?? null;
          if (foundUser) console.log("[ZOHO-AUTH] found user by zohoId:", foundUser.id);
        }
      }
    } catch (e) {
      console.error("[ZOHO-AUTH] error scanning users for zohoId:", e);
    }

    // if found, ensure metadata present
    if (foundUser) {
      try {
        if (zohoId && (foundUser.publicMetadata?.zohoId !== zohoId)) {
          await clerkClient.users.updateUser(foundUser.id, { publicMetadata: { ...(foundUser.publicMetadata ?? {}), zohoId } });
          console.log("[ZOHO-AUTH] updated user's publicMetadata");
        }
      } catch (e) {
        console.error("[ZOHO-AUTH] error updating metadata:", e);
      }
    }

    // If not found, try to create. We'll build many candidate payloads and try them.
    if (!foundUser) {
      // build sensible username
      const usernameBase = zohoId ?? (zohoEmail ? zohoEmail.split("@")[0] : `user${Math.floor(Math.random() * 10000)}`);
      const username = sanitizeUsername(usernameBase);

      // Candidate payload templates (exhaustive, include snake_case, verified flags, etc.)
      const payloads: Record<string, unknown>[] = [];

      // 1: username + emailAddress (array)
      payloads.push({
        username,
        emailAddress: zohoEmail ? [zohoEmail] : undefined,
        publicMetadata: { zohoId },
        firstName,
        lastName,
      });

      // 2: username + emailAddresses (array of objects)
      payloads.push({
        username,
        emailAddresses: zohoEmail ? [{ emailAddress: zohoEmail, verified: true }] : undefined,
        publicMetadata: { zohoId },
        firstName,
        lastName,
      });

      // 3: username + primaryEmailAddress
      payloads.push({
        username,
        primaryEmailAddress: zohoEmail ?? undefined,
        publicMetadata: { zohoId },
        firstName,
        lastName,
      });

      // 4: snake_case email_address + username
      payloads.push({
        username,
        email_address: zohoEmail ?? undefined,
        publicMetadata: { zohoId },
        firstName,
        lastName,
      });

      // 5: explicit 'emails' field (some backend shapes)
      payloads.push({
        username,
        emails: zohoEmail ? [{ address: zohoEmail, verified: true }] : undefined,
        publicMetadata: { zohoId },
        name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
      });

      // 6: name fields only plus password
      payloads.push({
        username,
        name: firstName && lastName ? `${firstName} ${lastName}` : undefined,
        firstName,
        lastName,
        emailAddress: zohoEmail ? [zohoEmail] : undefined,
        password: makeRandomPassword(),
        publicMetadata: { zohoId },
      });

      // 7: email verified flags explicitly (if supported)
      payloads.push({
        username,
        emailAddress: zohoEmail ? [zohoEmail] : undefined,
        publicMetadata: { zohoId },
        email_verified: true,
        firstName,
        lastName,
        password: makeRandomPassword(),
      });

      // 8: minimal with snake username field
      payloads.push({
        user_name: username,
        email_address: zohoEmail ?? undefined,
        publicMetadata: { zohoId },
        password: makeRandomPassword(),
      });

      // 9..20: repeat some combos to ensure coverage (email addresses obj vs array)
      payloads.push({
        username,
        emails: zohoEmail ? [{ email: zohoEmail, verified: true }] : undefined,
        publicMetadata: { zohoId },
        password: makeRandomPassword(),
      });

      // Filter out undefined-only keys to keep payloads clean
      const normalize = (p: Record<string, unknown>) => {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(p)) {
          const v = (p as any)[k];
          if (v !== undefined) out[k] = v;
        }
        return out;
      };
      const normalizedPayloads = payloads.map(normalize);

      // Try each payload sequentially and capture the first success
      let lastError: any = null;
      for (const p of normalizedPayloads) {
        console.log("[ZOHO-AUTH] try createUser with keys:", Object.keys(p));
        try {
          const created = await clerkClient.users.createUser(p);
          console.log("[ZOHO-AUTH] createUser succeeded with keys:", Object.keys(p));
          foundUser = created;
          break;
        } catch (err: any) {
          lastError = err;
          console.error("[ZOHO-AUTH] createUser failed:", {
            message: err?.message,
            status: err?.status,
            clerkTraceId: err?.clerkTraceId,
            errors: err?.errors,
          });
        }
      }

      if (!foundUser) {
        // Return full Clerk error payload (stringified) for exact debugging
        const errPayload = lastError ?? { message: "unknown" };
        console.error("[ZOHO-AUTH] all attempts failed; returning clerk error payload to client:", errPayload);
        return NextResponse.json({
          error: "Failed to create Clerk user",
          clerkError: {
            message: errPayload?.message ?? String(errPayload),
            status: errPayload?.status ?? null,
            clerkTraceId: errPayload?.clerkTraceId ?? null,
            errors: errPayload?.errors ?? null,
            raw: safeStringify(errPayload),
          },
        }, { status: 422 });
      }
    }

    // At this point we have foundUser
    const userId = (foundUser as any).id;
    if (!userId) {
      console.error("[ZOHO-AUTH] foundUser has no id", foundUser);
      return NextResponse.json({ error: "User created but no id returned" }, { status: 500 });
    }

    try {
      const signInResp = await clerkClient.signInTokens.createSignInToken({
        userId,
        expiresInSeconds: 60,
      });
      console.log("[ZOHO-AUTH] sign in token length:", (signInResp?.token ?? "").length);
      return NextResponse.json({ token: signInResp.token });
    } catch (e) {
      console.error("[ZOHO-AUTH] createSignInToken failed:", e);
      return NextResponse.json({ error: "Failed to create sign-in token", details: safeStringify(e) }, { status: 500 });
    }
  } catch (err) {
    console.error("[ZOHO-AUTH] unexpected error:", err);
    return NextResponse.json({ error: String((err as Error).message || err), raw: safeStringify(err) }, { status: 500 });
  }
}
