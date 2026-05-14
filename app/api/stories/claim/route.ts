import { NextResponse } from "next/server";
import { claimOrphanStoriesForUser } from "@/lib/supabase";
import { getAuthSessionUser } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const storyIdsRaw = Array.isArray((body as { storyIds?: unknown }).storyIds)
    ? (body as { storyIds: unknown[] }).storyIds
    : [];

  const storyIds = storyIdsRaw
    .filter((id): id is string => typeof id === "string" && /^[\w-]+$/.test(id))
    .slice(0, 40);

  if (storyIds.length === 0) {
    return NextResponse.json({ claimed: 0, skipped: 0 });
  }

  const { claimed, skipped } = await claimOrphanStoriesForUser(storyIds, user.id);
  return NextResponse.json({ claimed, skipped });
}
