import { NextResponse } from "next/server";
import {
  generateAndUploadStoryImage,
  isPlaceholderImageUrl,
  looksLikeExpiredProneImageUrl,
  StoryImageGenerationError,
} from "@/lib/image-provider";
import { memoryStories } from "@/lib/memory-store";
import type { ImageQualityTier } from "@/lib/openai-model-config";
import { fetchUserPremiumFlag } from "@/lib/supabase-profiles";
import { type ImageStyle, imageStyleSchema } from "@/lib/story-settings";
import { saveStorySession } from "@/lib/supabase";
import { getAuthSessionUser } from "@/lib/supabase/auth-server";
import { resolveStorySession } from "@/lib/story-session-resolve";

export const runtime = "nodejs";

const IMAGE_TIERS = new Set<ImageQualityTier>(["low", "medium", "high"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    sceneId?: string;
    /** Snapshot from client when the handler runs on a different instance than /api/story/turn */
    session?: unknown;
    imageQualityTier?: ImageQualityTier;
    imageStyle?: ImageStyle;
    useChildAsProtagonist?: boolean;
    childFaceDataUrl?: string;
  };

  if (!body.sessionId || !body.sceneId) {
    return NextResponse.json({ error: "Missing sessionId or sceneId" }, { status: 400 });
  }

  const user = await getAuthSessionUser();
  const isPremium = user ? await fetchUserPremiumFlag(user.id, user.email ?? undefined) : false;

  const parsedImageStyle = imageStyleSchema.safeParse(body.imageStyle);
  let imageStyle: ImageStyle = parsedImageStyle.success ? parsedImageStyle.data : "watercolor";

  const requestedTier =
    body.imageQualityTier && IMAGE_TIERS.has(body.imageQualityTier)
      ? body.imageQualityTier
      : undefined;

  let economyGuestMode = false;
  let allowChildFace = false;
  let imageQualityTier: ImageQualityTier | undefined;

  if (!user) {
    economyGuestMode = true;
    imageStyle = "watercolor";
    imageQualityTier = "medium";
    allowChildFace = false;
  } else {
    allowChildFace = true;

    if (!isPremium && imageStyle === "disney-pixar") {
      imageStyle = "watercolor";
    }

    let tier: ImageQualityTier | undefined = requestedTier;

    if (!isPremium && tier === "high") {
      tier = "medium";
    }

    if (imageStyle === "disney-pixar") {
      tier = "high";
    }

    imageQualityTier = tier;
  }

  const session = await resolveStorySession(body.sessionId, body.session);
  if (!session) {
    return NextResponse.json({ error: "Story session not found" }, { status: 404 });
  }

  const scene = session.scenes.find((candidate) => candidate.id === body.sceneId);
  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  if (
    !scene.imageUrl ||
    isPlaceholderImageUrl(scene.imageUrl) ||
    looksLikeExpiredProneImageUrl(scene.imageUrl)
  ) {
    const sceneIndex = session.scenes.findIndex((s) => s.id === scene.id);
    try {
      scene.imageUrl = await generateAndUploadStoryImage(
        scene,
        session.storyBible,
        session.id,
        sceneIndex,
        {
          imageQualityTier,
          imageStyle,
          economyGuestMode,
          childReference:
            allowChildFace && body.useChildAsProtagonist && body.childFaceDataUrl
              ? {
                  childName: session.childProfile.name,
                  faceDataUrl: body.childFaceDataUrl,
                }
              : undefined,
        },
      );
    } catch (error) {
      const message =
        error instanceof StoryImageGenerationError
          ? error.message
          : "Image generation failed";
      console.error("[api/story/image]", error);
      return NextResponse.json({ error: message }, { status: 502 });
    }
    session.updatedAt = new Date().toISOString();
    memoryStories.set(session.id, session);
    await saveStorySession(session, user ? { ownerUserId: user.id } : undefined);
  }

  return NextResponse.json({ sceneId: scene.id, imageUrl: scene.imageUrl });
}
