import { NextResponse } from "next/server";
import { memoryStories } from "@/lib/memory-store";
import { getVoiceId, synthesizeSpeech } from "@/lib/elevenlabs";
import { getStorySession } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
    speakerId?: string;
    sessionId?: string;
  };

  if (!body.text || !body.speakerId) {
    return NextResponse.json({ error: "Missing text or speakerId" }, { status: 400 });
  }

  const session = body.sessionId
    ? memoryStories.get(body.sessionId) || (await getStorySession(body.sessionId))
    : undefined;
  const voiceId = getVoiceId(session || undefined, body.speakerId);

  if (!voiceId) {
    return NextResponse.json({ error: "No voice configured" }, { status: 400 });
  }

  const stream = await synthesizeSpeech(body.text, voiceId);

  if (!stream) {
    return NextResponse.json({
      fallback: true,
      text: body.text,
      message: "ELEVENLABS_API_KEY is not configured; use browser speech fallback.",
    });
  }

  return new Response(stream, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}
