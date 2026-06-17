import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ReaderCtx = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;

export type AppRole = Doc<"users">["role"];

export type SessionUser = {
  identity: {
    externalId: string;
    name?: string;
    email?: string;
  };
  user: Doc<"users">;
};

export async function getSessionUser(ctx: ReaderCtx): Promise<SessionUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const externalId = identity.tokenIdentifier;
  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();

  if (!user) {
    return null;
  }

  return {
    identity: {
      externalId,
      name: identity.name,
      email: identity.email,
    },
    user,
  };
}

export async function requireSessionUser(ctx: ReaderCtx): Promise<SessionUser> {
  const session = await getSessionUser(ctx);
  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export function requireRole(user: Doc<"users">, roles: readonly AppRole[]) {
  if (!roles.includes(user.role)) {
    throw new Error("You do not have permission to perform this action");
  }
}
