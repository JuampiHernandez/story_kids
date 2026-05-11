import { NextResponse } from "next/server";
import { memoryStories } from "@/lib/memory-store";
import { getStorySession } from "@/lib/supabase";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = memoryStories.get(id) || (await getStorySession(id));

  if (!session) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
