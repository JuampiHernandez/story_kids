import { z } from "zod";

export const ART_STYLE =
  [
    "cozy full-bleed watercolor story scene illustration",
    "soft rounded shapes, warm light, kid-friendly cinematic composition",
    "consistent cute character designs across every scene",
    "single image only, no book mockup, no open book, no page layout, no panels, no borders",
    "no text, no letters, no captions, no logos, no UI",
  ].join(", ");

export const STORY_DURATION_SECONDS = 240;
export const STORY_SCENE_COUNT = 18;

export const safetyDecisionSchema = z.object({
  status: z.enum(["allowed", "redirect", "block"]),
  sanitizedIntent: z.string(),
  childMessage: z.string(),
  reason: z.string(),
});

export const voiceTraitSchema = z.enum([
  "narrator",
  "brave",
  "tiny",
  "wise",
  "silly",
  "gentle",
]);

export const voiceCastMemberSchema = z.object({
  speakerId: z.string(),
  displayName: z.string(),
  trait: voiceTraitSchema,
  voiceId: z.string().optional(),
});

export const narrationLineSchema = z.object({
  speakerId: z.string(),
  speakerName: z.string(),
  text: z.string(),
  emotion: z.enum(["warm", "excited", "curious", "gentle", "silly"]),
});

export const choiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  spokenPrompt: z.string(),
});

export const sceneSchema = z.object({
  id: z.string(),
  sceneNumber: z.number().int().min(1),
  title: z.string(),
  summary: z.string(),
  imagePrompt: z.string(),
  imageUrl: z.string().optional(),
  lines: z.array(narrationLineSchema).min(1),
  choices: z.array(choiceSchema).min(0).max(2),
  selectedChoiceId: z.string().optional(),
});

export const storyBibleSchema = z.object({
  premise: z.string(),
  protagonist: z.string(),
  setting: z.string(),
  tone: z.string(),
  artStyle: z.string(),
  characterDesigns: z.string().optional(),
  plotSummary: z.string(),
  forbiddenContent: z.array(z.string()),
});

export const childProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  ageRange: z.enum(["2-3", "4-5", "6-7"]).default("4-5"),
});

export const storySessionSchema = z.object({
  id: z.string(),
  childProfile: childProfileSchema,
  status: z.enum(["setup", "listening", "playing", "complete"]),
  currentSceneIndex: z.number().int().min(0),
  storyBible: storyBibleSchema,
  voiceCast: z.array(voiceCastMemberSchema),
  scenes: z.array(sceneSchema),
  safetyLog: z.array(safetyDecisionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const storyTurnRequestSchema = z.object({
  sessionId: z.string().optional(),
  childName: z.string().min(1).default("Luna"),
  transcript: z.string().min(1),
  selectedChoiceId: z.string().optional(),
  session: storySessionSchema.optional(),
});

export const storyTurnResponseSchema = z.object({
  session: storySessionSchema,
  scene: sceneSchema,
  safety: safetyDecisionSchema,
});

export type SafetyDecision = z.infer<typeof safetyDecisionSchema>;
export type VoiceTrait = z.infer<typeof voiceTraitSchema>;
export type VoiceCastMember = z.infer<typeof voiceCastMemberSchema>;
export type NarrationLine = z.infer<typeof narrationLineSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type StoryBible = z.infer<typeof storyBibleSchema>;
export type ChildProfile = z.infer<typeof childProfileSchema>;
export type StorySession = z.infer<typeof storySessionSchema>;
export type StoryTurnRequest = z.infer<typeof storyTurnRequestSchema>;
export type StoryTurnResponse = z.infer<typeof storyTurnResponseSchema>;
