// src/app/api/zoho-auth/route.ts
import { NextResponse } from "next/server";
import { clerkClient as getClerkClient } from "@clerk/nextjs/server";

type ZohoPayload = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [k: string]: unknown;
};

// Minimal shape for the parts of a Clerk user we rely on
type MinimalClerkUser = {
  id: string;
  publicMetadata?: Record<string, unknown>;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
};


export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ZohoPayload;

    if (!body || (!body.id && !body.email)) {
      return NextResponse.json({ error: "missing zoho id or email" }, { status: 400 });
    }

    // IMPORTANT: clerkClient in your version is a function, so call it and await.
    const clerkClient = await getClerkClient();

    const zohoId = typeof body.id === "string" ? body.id : undefined;
    const zohoEmail = typeof body.email === "string" ? body.email : undefined;

    // --- SECURITY: you should verify the payload here (signature / server-to-server) ---
    // For now we assume the payload is validated elsewhere. Do not skip this in prod.

    // 1) Try find user by email first (cleanly typed)
    let foundUser: MinimalClerkUser | null = null;

    if (zohoEmail) {
      // getUserList returns a list-type response; type it loosely but safely
      const listResp = await clerkClient.users.getUserList({ emailAddress: [zohoEmail] });
      if (Array.isArray(listResp.data) && listResp.data.length > 0) {
        // cast to MinimalClerkUser shape for our usage
        foundUser = listResp.data[0] as unknown as MinimalClerkUser;
      }
    }

    // 2) If not found, search a small page of users for matching publicMetadata.zohoId
    // NOTE: scanning is fine for small user-bases. For production, keep a mapping DB.
    if (!foundUser && zohoId) {
      const listResp = await clerkClient.users.getUserList({ limit: 100 });
      if (Array.isArray(listResp.data)) {
        // Type guard while iterating
        foundUser = listResp.data.find((u) => {
          const meta = (u as MinimalClerkUser).publicMetadata;
          return meta && typeof meta === "object" && meta.zohoId === zohoId;
        }) as unknown as MinimalClerkUser | undefined ?? null;
      }
    }

    // 3) Create user if not found
    if (!foundUser) {
      const createParams: Record<string, unknown> = {
        publicMetadata: { zohoId },
      };
      if (zohoEmail) createParams.emailAddress = [zohoEmail];
      if (typeof body.first_name === "string") createParams.firstName = body.first_name;
      if (typeof body.last_name === "string") createParams.lastName = body.last_name;

      // createUser returns the created user object
      const created = await clerkClient.users.createUser(createParams);
      foundUser = created as unknown as MinimalClerkUser;
    } else {
      // ensure zohoId present on metadata (idempotent)
      if (zohoId && foundUser.publicMetadata?.zohoId !== zohoId) {
        // updateUser is available on clerkClient.users
        // Use a typed call but avoid `any` by creating a plain object for metadata
        const newMeta = { ...(foundUser.publicMetadata ?? {}), zohoId };
        await clerkClient.users.updateUser(foundUser.id, {
          publicMetadata: newMeta,
        });
      }
    }

    // 4) Create sign-in token for the user
    // Depending on your Clerk version the sign-in token API may differ.
    // In many versions clerkClient.signInTokens.createSignInToken(...) works.
    // If your version uses a different namespace (e.g., client.signIn.create), adjust accordingly.
    // 4) Create sign-in token for the user
    const signInResponse = await clerkClient.signInTokens.createSignInToken({
      userId: foundUser.id,
      expiresInSeconds: 60, // REQUIRED
    });


    // Return only the token
    return NextResponse.json({ token: signInResponse.token });
  } catch (err) {
    console.error("zoho-auth error:", err);
    return NextResponse.json({ error: String((err as Error).message || err) }, { status: 500 });
  }
}
