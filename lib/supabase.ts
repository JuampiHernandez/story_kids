import { createClient } from "@supabase/supabase-js";
import type { StoryLibraryCard } from "@/lib/story-library";
import type { StorySession } from "@/lib/story-schema";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function saveStorySession(
  session: StorySession,
  opts?: { ownerUserId?: string | null },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { persisted: false };

  let user_id: string | null;

  if (opts?.ownerUserId !== undefined) {
    user_id = opts.ownerUserId;
  } else {
    const { data: existing } = await supabase
      .from("toddler_tales_stories")
      .select("user_id")
      .eq("id", session.id)
      .maybeSingle();
    user_id = existing?.user_id ?? null;
  }

  const { error } = await supabase.from("toddler_tales_stories").upsert({
    id: session.id,
    child_name: session.childProfile.name,
    status: session.status,
    session,
    user_id,
  });

  if (error) {
    console.error("Failed to save story session", error);
    return { persisted: false, error: error.message };
  }

  return { persisted: true };
}

export async function getStorySession(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("toddler_tales_stories")
    .select("session")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to load story session", error);
    return null;
  }

  return data.session as StorySession;
}

/**
 * Full bookshelf for the **Community** tab: every persisted story in Supabase.
 * (Filtering only anonymous rows hid stories saved while signed in — e.g. “Sunny the snake”.)
 */
export async function listCommunityStorySessions(): Promise<StorySession[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("toddler_tales_stories")
    .select("session")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to list community story sessions", error);
    return [];
  }

  return data
    .map((row) => row.session as StorySession)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

type StoryCardRow = {
  id: string;
  title: string | null;
  premise: string | null;
  page_count: number | null;
  cover_image_url: string | null;
  cover_title: string | null;
  updated_at: string | null;
};

export async function listStoryLibraryCards(): Promise<StoryLibraryCard[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("toddler_tales_story_cards")
    .select("id, title, premise, page_count, cover_image_url, cover_title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to list story library cards", error);
    return [];
  }

  return ((data || []) as StoryCardRow[]).map((row) => ({
    id: row.id,
    title: row.title || "Untitled Story",
    premise: row.premise || "",
    pageCount: row.page_count || 0,
    coverImageUrl: row.cover_image_url || undefined,
    coverTitle: row.cover_title || row.title || "Story cover",
    updatedAt: row.updated_at || new Date(0).toISOString(),
  }));
}

export async function listMyStorySessions(userId: string): Promise<StorySession[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("toddler_tales_stories")
    .select("session")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to list user story sessions", error);
    return [];
  }

  return data
    .map((row) => row.session as StorySession)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** Attach rows whose `user_id` is still null so signed-in parents see tales created before cookies stuck. */
export async function claimOrphanStoriesForUser(
  storyIds: string[],
  ownerUserId: string,
): Promise<{ claimed: number; skipped: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { claimed: 0, skipped: storyIds.length };
  }

  let claimed = 0;
  let skipped = 0;
  const unique = [...new Set(storyIds)].slice(0, 40);

  for (const id of unique) {
    const { data: row, error } = await supabase
      .from("toddler_tales_stories")
      .select("session,user_id")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      skipped += 1;
      continue;
    }
    if (row.user_id != null) {
      skipped += 1;
      continue;
    }

    const session = row.session as StorySession;
    const { persisted } = await saveStorySession(session, { ownerUserId });
    skipped += persisted ? 0 : 1;
    if (persisted) claimed += 1;
  }

  return { claimed, skipped };
}
