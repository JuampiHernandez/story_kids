import { createClient } from "@supabase/supabase-js";
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

export async function saveStorySession(session: StorySession) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { persisted: false };

  const { error } = await supabase.from("toddler_tales_stories").upsert({
    id: session.id,
    child_name: session.childProfile.name,
    status: session.status,
    session,
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

export async function listStorySessions() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase.from("toddler_tales_stories").select("session");

  if (error) {
    console.error("Failed to list story sessions", error);
    return [];
  }

  return data
    .map((row) => row.session as StorySession)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
