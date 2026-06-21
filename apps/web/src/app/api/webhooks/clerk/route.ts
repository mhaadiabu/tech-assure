import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { fetchMutation } from "convex/nextjs";

import { api } from "@_scaffold/backend/convex/_generated/api";
import { env } from "@_scaffold/env/web";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[clerk-webhook] received request", req.url);

  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    console.error("[clerk-webhook] NEXT_PUBLIC_CONVEX_URL not set");
    return new Response("Convex deployment URL is not configured", { status: 500 });
  }

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("[clerk-webhook] verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("[clerk-webhook] verified event", evt.type);

  if (evt.type !== "user.created" && evt.type !== "user.updated") {
    return new Response("Ignored", { status: 200 });
  }

  const data = evt.data;
  const issuer = env.CLERK_JWT_ISSUER_DOMAIN?.replace(/^https?:\/\//, "") ?? "clerk.com";
  const externalId = `https://${issuer}|${data.id}`;
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    "TechAssure operator";

  try {
    await fetchMutation(api.dashboard.upsertUserFromClerk, {
      externalId,
      name,
      email: data.email_addresses?.[0]?.email_address,
      imageUrl: data.image_url,
    });
    console.log("[clerk-webhook] upserted user", externalId);
  } catch (error) {
    console.error("[clerk-webhook] convex upsert failed", error);
    return new Response("Convex upsert failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
