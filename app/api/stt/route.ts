import { NextResponse } from "next/server";
import { transcribeWithElevenLabs } from "@/lib/elevenlabs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio blob" }, { status: 400 });
  }

  const transcript = await transcribeWithElevenLabs(audio);

  if (transcript === null) {
    return NextResponse.json(
      {
        error: "ELEVENLABS_API_KEY is not configured",
        transcript: "",
      },
      { status: 501 },
    );
  }

  return NextResponse.json({ transcript });
}
