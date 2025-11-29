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

type MinimalClerkUser = {
  id: string;
  publicMetadata?: Record<string, unknown>;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
};

export async function POST(req: Request) {
  try {
    console.log("[ZOHO-AUTH] incoming request");
    const body = (await req.json()) as ZohoPayload;
    console.log("[ZOHO-AUTH] body:", JSON.stringify(body));

    if (!body || (!body.id && !body.email)) {
      console.log("[ZOHO-AUTH] missing id/email -> 400");
      return NextResponse.json({ error: "missing zoho id or email" }, { status: 400 });
    }

    const clerkClient = await getClerkClient();

    const zohoId = typeof body.id === "string" ? body.id : undefined;
    const zohoEmail = typeof body.email === "string" ? body.email : undefined;

    let foundUser: MinimalClerkUser | null = null;

    if (zohoEmail) {
      const listResp = await clerkClient.users.getUserList({ emailAddress: [zohoEmail] });
      if (Array.isArray(listResp.data) && listResp.data.length > 0) {
        foundUser = listResp.data[0] as unknown as MinimalClerkUser;
        console.log("[ZOHO-AUTH] found user by email:", foundUser.id);
      }
    }

    if (!foundUser && zohoId) {
      const listResp = await clerkClient.users.getUserList({ limit: 100 });
      if (Array.isArray(listResp.data)) {
        foundUser = listResp.data.find((u) => {
          const meta = (u as MinimalClerkUser).publicMetadata;
          return meta && typeof meta === "object" && meta.zohoId === zohoId;
        }) as unknown as MinimalClerkUser | undefined ?? null;

        if (foundUser) console.log("[ZOHO-AUTH] found user by publicMetadata.zohoId:", foundUser.id);
      }
    }

    if (!foundUser) {
      const createParams: Record<string, unknown> = {
        publicMetadata: { zohoId },
      };
      if (zohoEmail) createParams.emailAddress = [zohoEmail];
      if (typeof body.first_name === "string") createParams.firstName = body.first_name;
      if (typeof body.last_name === "string") createParams.lastName = body.last_name;

      const created = await clerkClient.users.createUser(createParams);
      foundUser = created as unknown as MinimalClerkUser;
      console.log("[ZOHO-AUTH] created user:", foundUser.id);
    } else {
      if (zohoId && foundUser.publicMetadata?.zohoId !== zohoId) {
        const newMeta = { ...(foundUser.publicMetadata ?? {}), zohoId };
        await clerkClient.users.updateUser(foundUser.id, {
          publicMetadata: newMeta,
        });
        console.log("[ZOHO-AUTH] updated user metadata for:", foundUser.id);
      }
    }

    // Create sign-in token
    const signInResponse = await clerkClient.signInTokens.createSignInToken({
      userId: foundUser.id,
      expiresInSeconds: 60,
    });
    console.log("[ZOHO-AUTH] sign-in token created; tokenLength:", signInResponse.token?.length ?? 0);

    return NextResponse.json({ token: signInResponse.token });
  } catch (err) {
    console.error("zoho-auth error:", err);
    return NextResponse.json({ error: String((err as Error).message || err) }, { status: 500 });
  }
}
