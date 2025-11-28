"use server";

import { auth, clerkClient, User } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function getDocuments(ids:Id<"documents">[]) {
    return await convex.query(api.documents.getByIds,{ids})
}

export async function getUsers() {
  const { sessionClaims } = await auth();
  const orgId = sessionClaims?.org_id as string | undefined;

  // call the factory to get the client instance
  const client = await (clerkClient)();

  const response = await client.users.getUserList({
    organizationId: orgId ? [orgId] : undefined,
  });

  return response.data.map((user:User) => ({
    id: user.id,
    name:
      user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
    avatar: user.imageUrl ?? null,
  }));
}
