import { getFallbackVoiceIdForSpeaker, getVoiceIdForSpeaker } from "@/lib/voice-cast";
import type { StorySession } from "@/lib/story-schema";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export function getVoiceId(session: StorySession | undefined, speakerId: string) {
  return session
    ? getVoiceIdForSpeaker(session.voiceCast, speakerId)
    : getFallbackVoiceIdForSpeaker(speakerId);
}

export async function synthesizeSpeech(text: string, voiceId: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.52,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }

  return response.body;
}

export async function transcribeWithElevenLabs(audio: Blob) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const formData = new FormData();
  formData.append("model_id", "scribe_v1");
  formData.append("file", audio, "child-audio.webm");

  const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs STT failed: ${response.status}`);
  }

  const data = (await response.json()) as { text?: string };
  return data.text || "";
}
