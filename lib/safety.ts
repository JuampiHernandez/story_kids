import type { SafetyDecision } from "@/lib/story-schema";

const blockedPatterns = [
  /(?:kill|murder|blood|gun|knife|weapon)/i,
  /(?:sex|naked|porn)/i,
  /(?:suicide|self[-\s]?harm|hurt myself)/i,
  /(?:medicine|doctor|diagnose|dose|pill)/i,
  /(?:address|phone number|where do i live|my school)/i,
  /(?:google maps|directions|drive to|navigate to)/i,
];

const redirectPatterns = [
  /(?:scary|monster|zombie|ghost)/i,
  /(?:poop|pee|butt)/i,
  /(?:youtube|tiktok|instagram|internet)/i,
];

export function sanitizeChildInput(rawTranscript: string): SafetyDecision {
  const transcript = rawTranscript.trim().slice(0, 500);

  if (!transcript) {
    return {
      status: "redirect",
      sanitizedIntent: "a gentle surprise adventure",
      childMessage: "I heard a tiny whisper. Should our story begin in a forest or by the sea?",
      reason: "empty_input",
    };
  }

  if (blockedPatterns.some((pattern) => pattern.test(transcript))) {
    return {
      status: "block",
      sanitizedIntent: "a gentle friendship adventure",
      childMessage:
        "That one is for a grown-up. In our story, should the hero find a sparkly key or a sleepy cloud?",
      reason: "blocked_child_safety_topic",
    };
  }

  if (redirectPatterns.some((pattern) => pattern.test(transcript))) {
    return {
      status: "redirect",
      sanitizedIntent: "a silly but gentle adventure with friendly pretend creatures",
      childMessage:
        "Let’s make that cozy and friendly. Should the pretend creature be giggly or sleepy?",
      reason: "redirect_to_age_appropriate_story",
    };
  }

  return {
    status: "allowed",
    sanitizedIntent: transcript,
    childMessage: transcript,
    reason: "allowed_story_request",
  };
}
