import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Utility: Normalize Clerk org ID
function normalizeOrgId(orgId: string | null | undefined) {
  if (!orgId || orgId === "") return undefined;
  return orgId;
}

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    initialContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const organizationId = normalizeOrgId(
      typeof user.organization_id === "string" ? user.organization_id : undefined
    );


    return await ctx.db.insert("documents", {
      title: args.title ?? "Untitled document",
      ownerId: user.subject,
      organizationId,
      initialContent: args.initialContent,
      leftMargin: 56,
      rightMargin: 56,
    });
  },
});

export const get = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { search, paginationOpts }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const organizationId = normalizeOrgId(
      typeof user.organization_id === "string" ? user.organization_id : undefined
    );

    // -------------------- SEARCH + ORG --------------------
    if (search && organizationId) {
      return await ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) =>
          q.search("title", search).eq("organizationId", organizationId)
        )
        .paginate(paginationOpts);
    }

    // -------------------- SEARCH + PERSONAL --------------------
    if (search && !organizationId) {
      return await ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) =>
          q.search("title", search).eq("ownerId", user.subject)
        )
        .paginate(paginationOpts);
    }

    // -------------------- ORG MODE --------------------
    if (organizationId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", organizationId)
        )
        .paginate(paginationOpts);
    }

    // -------------------- PERSONAL MODE --------------------
    return await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject))
      .paginate(paginationOpts);
  },
});

export const removeById = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const document = await ctx.db.get(id);
    if (!document) throw new ConvexError("Document not found");

    const organizationId = normalizeOrgId(
      typeof user.organization_id === "string" ? user.organization_id : undefined
    );


    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember =
      !!document.organizationId &&
      document.organizationId === organizationId;

    if (!isOwner && !isOrganizationMember) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.delete(id);
  },
});

export const updateById = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const document = await ctx.db.get(id);
    if (!document) throw new ConvexError("Document not found");

    const organizationId = normalizeOrgId(
      typeof user.organization_id === "string" ? user.organization_id : undefined
    );


    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember =
      !!document.organizationId &&
      document.organizationId === organizationId;

    if (!isOwner && !isOrganizationMember) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.patch(id, { title });
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const document = await ctx.db.get(id)
    if(!document){
      throw new ConvexError("Document not found")
    }
    return document;
  },
});

export const getByIds = query({
  args: {ids: v.array(v.id("documents"))},
  handler: async(convexToJson,{ids})=>{
    const documents =[]
    for (const id of ids){
      const document = await convexToJson.db.get(id)

      if(document){
        documents.push({id:document._id,name: document.title})
      }else{
        documents.push({id,name: "[Removed]"})
      }
    }
      return documents
  }
})
