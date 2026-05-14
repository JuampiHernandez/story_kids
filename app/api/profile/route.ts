import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ensureProfileRow, fetchUserPremiumFlag } from "@/lib/supabase-profiles";
import { createSupabaseAuthServerClient, getAuthSessionUser } from "@/lib/supabase/auth-server";
import {
  DEFAULT_STORY_SETTINGS,
  storyParentSettingsSchema,
  type StoryParentSettings,
} from "@/lib/story-settings";

export const runtime = "nodejs";

function mergeProfileStorySettings(
  stored: unknown,
  isPremium: boolean,
): StoryParentSettings {
  const parsed = storyParentSettingsSchema.safeParse(stored);
  const fromDb = parsed.success ? parsed.data : {};

  const merged: StoryParentSettings = {
    ...DEFAULT_STORY_SETTINGS,
    ...fromDb,
  };

  if (merged.imageQualityTier === "low") {
    merged.imageQualityTier = "medium";
  }

  if (!parsed.success && isPremium) {
    merged.imageQualityTier = "high";
  }

  return merged;
}

export async function GET() {
  const supabaseAuth = await createSupabaseAuthServerClient();
  if (!supabaseAuth) {
    return NextResponse.json({ error: "Supabase auth is not configured" }, { status: 503 });
  }

  const user = await getAuthSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfileRow(user.id, user.email ?? undefined);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const isPremium = await fetchUserPremiumFlag(user.id, user.email ?? undefined);

  const { data: row } = await admin.from("profiles").select("story_settings").eq("id", user.id).maybeSingle();

  const story_settings = mergeProfileStorySettings(row?.story_settings, isPremium);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    is_premium: isPremium,
    story_settings,
  });
}

export async function PATCH(request: Request) {
  const user = await getAuthSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { story_settings?: unknown };
  const parsed = storyParentSettingsSchema.safeParse(body.story_settings);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid story_settings", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await ensureProfileRow(user.id, user.email ?? undefined);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const isPremium = await fetchUserPremiumFlag(user.id, user.email ?? undefined);

  let nextSettings = parsed.data;
  if (nextSettings.imageQualityTier === "low") {
    nextSettings = { ...nextSettings, imageQualityTier: "medium" };
  }
  if (!isPremium) {
    nextSettings = {
      ...nextSettings,
      imageStyle: nextSettings.imageStyle === "disney-pixar" ? "watercolor" : nextSettings.imageStyle,
      imageQualityTier: nextSettings.imageQualityTier === "high" ? "medium" : nextSettings.imageQualityTier,
    };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      story_settings: nextSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile PATCH failed", error);
    const raw = error.message ?? "";
    const infra =
      /profiles|schema cache|does not exist|relation/i.test(raw);
    return NextResponse.json(
      { error: infra ? "Could not sync profile (database not ready)." : "Could not save settings." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, story_settings: nextSettings });
}
