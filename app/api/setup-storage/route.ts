import { NextResponse } from "next/server";
import { createStorageBuckets } from "@/lib/supabase-storage";

export const runtime = "nodejs";

/**
 * Setup endpoint to create Supabase Storage buckets
 * Call this once to initialize storage buckets
 */
export async function POST(request: Request) {
  try {
    await createStorageBuckets();
    
    return NextResponse.json({
      message: "Storage buckets setup completed",
      buckets: ["story-images", "story-audio", "assets"]
    });
  } catch (error) {
    console.error("Storage setup failed:", error);
    return NextResponse.json({
      error: "Storage setup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}