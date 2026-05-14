import { NextResponse } from "next/server";
import { storyQualifiesForCommunityShelf } from "@/lib/story-completeness";
import { uploadStoryImages } from "@/lib/supabase-storage";
import { getAuthSessionUser } from "@/lib/supabase/auth-server";
import { listCommunityStorySessions, listMyStorySessions, saveStorySession } from "@/lib/supabase";
import type { StorySession } from "@/lib/story-schema";

export const runtime = "nodejs";

function sceneImageUrlsKey(session: StorySession): string {
  return session.scenes.map((scene) => scene.imageUrl ?? "").join("\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "my";

  if (scope !== "my" && scope !== "community") {
    return NextResponse.json({ error: "scope must be my or community" }, { status: 400 });
  }

  const user = await getAuthSessionUser();

  if (scope === "my") {
    if (!user) {
      return NextResponse.json({ stories: [], authenticated: false });
    }

    const storiesRaw = await listMyStorySessions(user.id);
    let migrationBudget = 8;
    const stories: StorySession[] = [];

    for (const row of storiesRaw) {
      try {
        const before = sceneImageUrlsKey(row);
        const normalized = await uploadStoryImages(row);
        const after = sceneImageUrlsKey(normalized);

        if (before !== after && migrationBudget > 0) {
          migrationBudget -= 1;
          const toSave = { ...normalized, updatedAt: new Date().toISOString() };
          const { persisted } = await saveStorySession(toSave, { ownerUserId: user.id });
          stories.push(persisted ? toSave : row);
        } else {
          stories.push(before !== after ? row : normalized);
        }
      } catch (error) {
        console.warn("[api/stories] image migrate skipped", row.id, error);
        stories.push(row);
      }
    }

    return NextResponse.json({ stories, authenticated: true });
  }

  const raw = await listCommunityStorySessions();
  const stories = raw.filter(storyQualifiesForCommunityShelf);
  return NextResponse.json({ stories, authenticated: Boolean(user) });
}
