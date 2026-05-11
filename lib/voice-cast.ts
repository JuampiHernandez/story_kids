import type { VoiceCastMember, VoiceTrait } from "@/lib/story-schema";

const fallbackVoiceIds: Record<VoiceTrait, string> = {
  narrator: process.env.ELEVENLABS_NARRATOR_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  brave: process.env.ELEVENLABS_CREATURE_VOICE_ID || "29vD33N1CtxCmqQRPOHJ",
  tiny: process.env.ELEVENLABS_TINY_VOICE_ID || "AZnzlk1XvdvUeBnXmlld",
  wise: process.env.ELEVENLABS_WISE_VOICE_ID || "ErXwobaYiN019PkySvjV",
  silly: process.env.ELEVENLABS_SILLY_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
  gentle: process.env.ELEVENLABS_NARRATOR_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
};

export function createDefaultVoiceCast(protagonistName: string): VoiceCastMember[] {
  return [
    {
      speakerId: "narrator",
      displayName: "Narrator",
      trait: "narrator",
      voiceId: fallbackVoiceIds.narrator,
    },
    {
      speakerId: "hero",
      displayName: protagonistName,
      trait: "brave",
      voiceId: fallbackVoiceIds.brave,
    },
    {
      speakerId: "friend",
      displayName: "Tiny Friend",
      trait: "tiny",
      voiceId: fallbackVoiceIds.tiny,
    },
    {
      speakerId: "guide",
      displayName: "Wise Owl",
      trait: "wise",
      voiceId: fallbackVoiceIds.wise,
    },
  ];
}

export function getVoiceIdForSpeaker(voiceCast: VoiceCastMember[], speakerId: string) {
  return (
    voiceCast.find((member) => member.speakerId === speakerId)?.voiceId ||
    fallbackVoiceIds.narrator
  );
}

export function getFallbackVoiceIdForSpeaker(speakerId: string) {
  const speakerTraitMap: Record<string, VoiceTrait> = {
    narrator: "narrator",
    hero: "brave",
    friend: "tiny",
    guide: "wise",
    silly: "silly",
  };
  const trait = speakerTraitMap[speakerId] || (speakerId as VoiceTrait);
  return fallbackVoiceIds[trait] || fallbackVoiceIds.narrator;
}
