// convex/mutations.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setLeftMargin = mutation({
  args: {
    documentId: v.id("documents"),
    position: v.number(),
  },
  handler: async ({ db }, { documentId, position }) => {
    await db.patch(documentId, { leftMargin: position });
  },
});

export const setRightMargin = mutation({
  args: {
    documentId: v.id("documents"),
    position: v.number(),
  },
  handler: async ({ db }, { documentId, position }) => {
    await db.patch(documentId, { rightMargin: position });
  },
});
