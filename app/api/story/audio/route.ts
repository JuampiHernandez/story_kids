import { NextResponse } from "next/server";
import { memoryStories } from "@/lib/memory-store";
import { saveStorySession } from "@/lib/supabase";
import { resolveStorySession } from "@/lib/story-session-resolve";
import { getAuthSessionUser } from "@/lib/supabase/auth-server";
import { preGenerateStoryAudio } from "@/lib/audio-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId: string;
    regenerate?: boolean; // Force regeneration of existing audio
    session?: unknown;
  };

  if (!body.sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await resolveStorySession(body.sessionId, body.session);
  if (!session) {
    return NextResponse.json({ error: "Story session not found" }, { status: 404 });
  }

  const user = await getAuthSessionUser();

  try {
    // Collect all narration lines from all scenes
    const allLines = session.scenes.flatMap(scene => scene.lines);
    
    // Check if we need to generate audio
    const needsAudio = body.regenerate || allLines.some(line => !line.audioUrl);
    
    if (!needsAudio) {
      return NextResponse.json({ 
        message: "Audio already generated",
        audioCount: allLines.filter(line => line.audioUrl).length
      });
    }

    console.log(`Generating audio for story ${session.id}...`);
    
    // Generate all audio files
    const audioUrls = await preGenerateStoryAudio(session.id, allLines, session.voiceCast);
    
    // Update the session with audio URLs
    let lineIndex = 0;
    const updatedScenes = session.scenes.map(scene => ({
      ...scene,
      lines: scene.lines.map(line => {
        const currentLineIndex = lineIndex++;
        const audioUrl = audioUrls[currentLineIndex];
        return audioUrl ? { ...line, audioUrl } : line;
      })
    }));

    const updatedSession = {
      ...session,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString()
    };

    // Save updated session
    memoryStories.set(updatedSession.id, updatedSession);
    await saveStorySession(updatedSession, user ? { ownerUserId: user.id } : undefined);

    const generatedCount = Object.keys(audioUrls).length;
    console.log(`Generated ${generatedCount} audio files for story ${session.id}`);

    return NextResponse.json({
      message: "Audio generation completed",
      audioCount: generatedCount,
      totalLines: allLines.length
    });
  } catch (error) {
    console.error("Audio generation failed:", error);
    return NextResponse.json({ 
      error: "Audio generation failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}