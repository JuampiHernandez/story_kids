import OpenAI from "openai";
import { resolvedStoryModel } from "@/lib/openai-model-config";
import { sanitizeChildInput } from "@/lib/safety";
import {
  ART_STYLE,
  STORY_SCENE_COUNT,
  type ChildProfile,
  type NarrationLine,
  type Scene,
  type StoryBible,
  type StorySession,
  type StoryTurnRequest,
  type StoryTurnResponse,
  type VoiceCastMember,
  type VoiceTrait,
} from "@/lib/story-schema";
import { createDefaultVoiceCast, getFallbackVoiceIdForSpeaker } from "@/lib/voice-cast";

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function inferHero(intent: string) {
  const match = intent.match(/\b(?:a|an|the)\s+([a-z]+(?:\s+[a-z]+)?)/i);
  return titleCase(match?.[1] || "Brave Dragon");
}

function createStoryBible(intent: string, protagonistOverride?: string): StoryBible {
  const protagonist = protagonistOverride || inferHero(intent);

  return {
    premise: intent,
    protagonist,
    setting: "a cozy, magical picture-book world with soft hills and friendly creatures",
    tone: "warm, playful, reassuring, and age appropriate",
    artStyle: ART_STYLE,
    characterDesigns: `${protagonist}: a small expressive storybook hero with a memorable silhouette, exact species/body shape, exact skin and hair colors, exact eye shape, exact outfit or signature accessory, and exact scale relative to friends. Supporting characters must also have fixed colors, accessories, and silhouettes. Keep every recurring character visually identical in every scene.`,
    plotSummary: `${protagonist} begins a gentle adventure about ${intent}.`,
    forbiddenContent: [
      "real-world instructions",
      "medical or legal advice",
      "graphic violence",
      "sexual content",
      "personal data",
      "maps or navigation",
    ],
  };
}

function fallbackLines(sceneNumber: number, bible: StoryBible, childName: string): NarrationLine[] {
  const hero = bible.protagonist;
  const beats = [
    [
      `${childName}, our story opens in a warm watercolor meadow where ${hero} has a very important problem.`,
      `"Oh my," said ${hero}, "I need a kind helper and a brave idea!"`,
      "A tiny bell chimed, and the whole meadow seemed ready to help.",
    ],
    [
      `${hero} followed a path of glowing pebbles toward the first tiny clue.`,
      `"I can do this one tiny step at a time," ${hero} whispered.`,
      "From a soft blue tree, a wise owl blinked and smiled.",
    ],
    [
      "The adventure grew sillier, brighter, and a little more surprising.",
      `"Look!" squeaked Tiny Friend. "The clue is dancing!"`,
      `${hero} laughed so warmly that even the clouds wiggled closer.`,
    ],
    [
      `At last, ${hero} found exactly what the story needed: courage, kindness, and a happy ending.`,
      `"Thank you for choosing with me," said ${hero}.`,
      "The picture-book world tucked itself into a cozy goodnight sparkle.",
    ],
    [
      `${hero} noticed the smallest helper had been carrying the biggest idea all along.`,
      `"We did it together," said Tiny Friend, hopping in a happy circle.`,
      "The meadow answered with a parade of twinkly lights and soft drumbeats.",
    ],
    [
      `When the moon rose like a warm cookie, ${hero} knew the adventure had become a favorite memory.`,
      `"Tomorrow we can be brave again," ${hero} said with a sleepy smile.`,
      `${childName}, the whole world whispered goodnight and kept one sparkle just for you.`,
    ],
  ];

  const selected = beats[Math.min(sceneNumber - 1, beats.length - 1)];
  return [
    { speakerId: "narrator", speakerName: "Narrator", text: selected[0], emotion: "warm" },
    { speakerId: "hero", speakerName: hero, text: selected[1], emotion: "curious" },
    {
      speakerId: sceneNumber === 3 ? "friend" : "narrator",
      speakerName: sceneNumber === 3 ? "Tiny Friend" : "Narrator",
      text: selected[2],
      emotion: sceneNumber === 3 ? "silly" : "gentle",
    },
  ];
}

/**
 * Validates and cleans AI-generated titles to ensure they are short, catchy, and child-friendly.
 * Removes character descriptions, possessive forms, and other problematic patterns.
 * If the title can't be cleaned effectively, generates a new one based on the story intent.
 * 
 * Requirements for good titles:
 * - 3-5 words maximum
 * - Focus on adventure themes and action words
 * - No character descriptions or possessive forms
 * - Examples: "Dragon Mountain Quest", "Magic Forest Adventure", "Ocean Treasure Hunt"
 */
function validateAndCleanTitle(title: string, intent: string): string {
  if (!title || title.trim().length === 0) {
    return generateCatchyTitle(intent, "", 1);
  }
  
  let cleanTitle = title.trim();
  
  // Remove possessive forms and character descriptions
  cleanTitle = cleanTitle.replace(/'s\s+(Story|Adventure|Tale|Journey|Quest|Big Little Adventure)$/i, '');
  cleanTitle = cleanTitle.replace(/^.*'s\s+/i, '');
  
  // Remove character description patterns - more specific patterns
  cleanTitle = cleanTitle.replace(/,\s*a\s+[a-zA-Z\s,]+?(who|that|with)[^,]*,?/gi, '');
  cleanTitle = cleanTitle.replace(/,?\s*who\s+[^,]+/gi, '');
  cleanTitle = cleanTitle.replace(/,?\s*a\s+(gentle|curious|shy|little|big|small|brave|tiny|wise)\s+[^,]*/gi, '');
  
  // Clean up extra spaces and conjunctions
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/^(The|A|An)\s+/i, '');
  
  // If the cleaned title is empty or just has connecting words, generate new
  if (!cleanTitle || /^(and|or|but|with|for|the|a|an|of|in|on|at|to|from)$/i.test(cleanTitle)) {
    return generateCatchyTitle(intent, "", 1);
  }
  
  // If title is too long or still contains problematic descriptive words, generate a new one
  const wordCount = cleanTitle.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 5 || cleanTitle.length > 35 || 
      /\b(who|that|which|with|gentle|curious|shy|loves|sunshine)\b/i.test(cleanTitle)) {
    return generateCatchyTitle(intent, "", 1);
  }
  
  // Check if it's a good title already (action words, themes, etc.)
  const goodWords = /\b(quest|adventure|journey|magic|treasure|mystery|dragon|castle|forest|ocean|space|rainbow|hero|rescue|discovery|secret|wonder|dream)\b/i;
  if (wordCount <= 4 && goodWords.test(cleanTitle)) {
    // Capitalize properly and return
    return cleanTitle.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // If it doesn't contain good adventure words, generate a new title
  return generateCatchyTitle(intent, "", 1);
}

/**
 * Generates catchy, child-friendly story titles based on the story intent.
 * Uses comprehensive theme matching to create engaging titles that focus on
 * adventure and action rather than character descriptions.
 * 
 * @param intent The story premise/intent from the user
 * @param protagonist The main character name (optional, not used in title generation)
 * @param sceneNumber The scene number (unused, kept for backward compatibility)
 * @returns A short, action-focused title (3-5 words)
 */
function generateCatchyTitle(intent: string, protagonist: string, sceneNumber: number): string {
  // Adventure-themed action words and themes for engaging titles
  const actionWords = [
    "Quest", "Adventure", "Journey", "Discovery", "Mission", "Rescue",
    "Magic", "Mystery", "Treasure", "Dream", "Wonder", "Secret"
  ];
  
  const themes = [
    "Forest", "Ocean", "Sky", "Castle", "Mountain", "Garden", 
    "Island", "Cave", "Rainbow", "Star", "Moon", "Crystal"
  ];
  
  // Extract key themes from the intent with more comprehensive matching
  const intentLower = intent.toLowerCase();
  let titleBase = "";
  
  // More comprehensive theme matching
  if (intentLower.includes("dragon") || intentLower.includes("dinosaur")) titleBase = "Dragon Quest";
  else if (intentLower.includes("princess") || intentLower.includes("fairy") || intentLower.includes("magic")) titleBase = "Magic Kingdom";
  else if (intentLower.includes("ocean") || intentLower.includes("sea") || intentLower.includes("water") || intentLower.includes("mermaid")) titleBase = "Ocean Adventure";
  else if (intentLower.includes("space") || intentLower.includes("star") || intentLower.includes("rocket") || intentLower.includes("planet")) titleBase = "Space Journey";
  else if (intentLower.includes("forest") || intentLower.includes("tree") || intentLower.includes("jungle") || intentLower.includes("wood")) titleBase = "Forest Quest";
  else if (intentLower.includes("treasure") || intentLower.includes("gold") || intentLower.includes("pirate")) titleBase = "Treasure Hunt";
  else if (intentLower.includes("wizard") || intentLower.includes("spell") || intentLower.includes("wand")) titleBase = "Magic Adventure";
  else if (intentLower.includes("friend") || intentLower.includes("help") || intentLower.includes("together")) titleBase = "Friendship Quest";
  else if (intentLower.includes("rescue") || intentLower.includes("save") || intentLower.includes("hero")) titleBase = "Hero's Mission";
  else if (intentLower.includes("mystery") || intentLower.includes("find") || intentLower.includes("detective")) titleBase = "Mystery Adventure";
  else if (intentLower.includes("castle") || intentLower.includes("kingdom") || intentLower.includes("royal")) titleBase = "Castle Quest";
  else if (intentLower.includes("animal") || intentLower.includes("pet") || intentLower.includes("cat") || intentLower.includes("dog")) titleBase = "Animal Adventure";
  else if (intentLower.includes("night") || intentLower.includes("dream") || intentLower.includes("sleep")) titleBase = "Dream Journey";
  else if (intentLower.includes("rainbow") || intentLower.includes("color")) titleBase = "Rainbow Quest";
  else {
    // Fallback: combine a random action word with theme
    const randomAction = actionWords[Math.floor(Math.random() * actionWords.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    titleBase = `${randomTheme} ${randomAction}`;
  }
  
  return titleBase;
}

function createFallbackStory(intent: string, childName: string, useChildAsProtagonist = false) {
  const bible = createStoryBible(intent, useChildAsProtagonist ? childName : undefined);
  const voiceCast = createDefaultVoiceCast(bible.protagonist);
  const mainTitle = generateCatchyTitle(intent, bible.protagonist, 1);
  
  const scenes = Array.from({ length: STORY_SCENE_COUNT }, (_, index) => {
    const sceneNumber = index + 1;
    const lines = fallbackLines(sceneNumber, bible, childName);
    return {
      id: makeId("scene"),
      sceneNumber,
      title: sceneNumber === 1 ? mainTitle : `Chapter ${sceneNumber}`,
      summary: lines.map((line) => line.text).join(" "),
      imagePrompt: createImagePrompt(sceneNumber, bible, lines),
      lines,
      choices: [],
    } satisfies Scene;
  });

  return { bible, voiceCast, scenes };
}

type GeneratedFullStory = {
  storyBible?: Partial<StoryBible>;
  voiceCast?: Array<{
    speakerId: string;
    displayName: string;
    trait: VoiceTrait;
  }>;
  scenes?: Array<{
    title: string;
    summary: string;
    imagePrompt: string;
    lines: NarrationLine[];
  }>;
};

function cleanSpeakerId(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

function normalizeVoiceCast(
  generatedCast: GeneratedFullStory["voiceCast"],
  protagonist: string,
): VoiceCastMember[] {
  const cast = generatedCast?.length
    ? generatedCast
    : createDefaultVoiceCast(protagonist).map(({ speakerId, displayName, trait }) => ({
        speakerId,
        displayName,
        trait,
      }));

  const normalized = cast
    .slice(0, 5)
    .map((member) => {
      const speakerId = member.speakerId === "narrator" ? "narrator" : cleanSpeakerId(member.speakerId);
      return {
        speakerId,
        displayName: member.displayName,
        trait: member.trait,
        voiceId:
          speakerId === "narrator"
            ? getFallbackVoiceIdForSpeaker("narrator")
            : getFallbackVoiceIdForSpeaker(member.trait),
      };
    })
    .filter((member) => member.speakerId && member.displayName);

  if (!normalized.some((member) => member.speakerId === "narrator")) {
    normalized.unshift({
      speakerId: "narrator",
      displayName: "Narrator",
      trait: "narrator",
      voiceId: getFallbackVoiceIdForSpeaker("narrator"),
    });
  }

  return normalized;
}

function ensureChildHeroVoice(voiceCast: VoiceCastMember[], childName: string): VoiceCastMember[] {
  const heroIndex = voiceCast.findIndex((member) => member.speakerId === "hero");
  if (heroIndex >= 0) {
    return voiceCast.map((member, index) =>
      index === heroIndex ? { ...member, displayName: childName, trait: "brave" } : member,
    );
  }

  const narrator = voiceCast.find((member) => member.speakerId === "narrator");
  const supportingCast = voiceCast.filter((member) => member.speakerId !== "narrator").slice(0, 3);

  return [
    narrator,
    {
      speakerId: "hero",
      displayName: childName,
      trait: "brave",
      voiceId: getFallbackVoiceIdForSpeaker("brave"),
    },
    ...supportingCast,
  ].filter(Boolean) as VoiceCastMember[];
}

function normalizeLines(lines: NarrationLine[], voiceCast: VoiceCastMember[]) {
  const validSpeakerIds = new Set(voiceCast.map((member) => member.speakerId));
  const speakerByAlias = new Map<string, VoiceCastMember>();

  voiceCast.forEach((member) => {
    speakerByAlias.set(cleanSpeakerId(member.speakerId), member);
    speakerByAlias.set(cleanSpeakerId(member.displayName), member);
  });

  return lines
    .filter((line) => line.text?.trim())
    .slice(0, 4)
    .map((line) => {
      const matchedSpeaker =
        voiceCast.find((member) => member.speakerId === line.speakerId) ||
        speakerByAlias.get(cleanSpeakerId(line.speakerId)) ||
        speakerByAlias.get(cleanSpeakerId(line.speakerName));
      const speakerId =
        matchedSpeaker && validSpeakerIds.has(matchedSpeaker.speakerId)
          ? matchedSpeaker.speakerId
          : "narrator";
      const speakerName = matchedSpeaker?.displayName || "Narrator";
      return {
        speakerId,
        speakerName,
        text: line.text.trim(),
        emotion: line.emotion || "warm",
      } satisfies NarrationLine;
    });
}

function storyStyleHints(ageRange: ChildProfile["ageRange"], storyEnergy: "calm" | "balanced" | "silly") {
  const ageLine =
    ageRange === "2-3"
      ? "Target ages 2-3: very simple vocabulary, short sentences, concrete imagery, gentle repetition."
      : ageRange === "6-7"
        ? "Target ages 6-7: richer description and light plot twists are fine; stay kind and clear."
        : "Target ages 4-5: playful pacing and simple emotional arcs.";

  const energyLine =
    storyEnergy === "calm"
      ? "Keep stakes soft and cozy—suitable for winding down."
      : storyEnergy === "silly"
        ? "Lean into playful humor and funny beats while staying kind."
        : "Balance warmth with adventure—neither too sleepy nor too zany.";

  return [ageLine, energyLine];
}

async function generateFullStoryWithOpenAI(
  childName: string,
  childInput: string,
  hints?: {
    ageRange: ChildProfile["ageRange"];
    storyEnergy: "calm" | "balanced" | "silly";
    useChildAsProtagonist?: boolean;
  },
) {
  if (!process.env.OPENAI_API_KEY) {
    return createFallbackStory(childInput, childName, hints?.useChildAsProtagonist);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: resolvedStoryModel(),
      temperature: 0.72,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            ...(hints ? storyStyleHints(hints.ageRange, hints.storyEnergy) : []),
            "You are an elite preschool picture-book writer and story editor.",
            hints?.useChildAsProtagonist
              ? `The child must be the protagonist and main recurring hero. The protagonist's exact name is ${childName}. Keep random magical friends and side characters, but do not replace the child with another main character.`
              : "Invent a delightful random main character from the child's idea.",
            "Create one complete, linear, emotionally satisfying 4-minute audio story from the child's idea.",
            "The story must be fun, coherent, and easy for kids ages 4-7 to follow.",
            "IMPORTANT TITLE REQUIREMENTS: Create short, catchy, child-friendly titles (3-5 words maximum). Focus on adventure themes and action words, NOT character descriptions. Examples of GOOD titles: 'Dragon Mountain Quest', 'Magic Forest Adventure', 'Treasure Island Mystery', 'Rainbow Castle Journey'. Examples of BAD titles: 'Sunny the Snake's Story', 'A Gentle Curious Snake Who Loves Sunshine', 'The Adventures of a Shy Little Snake'. Never include character descriptions or possessive forms in titles.",
            "Use narrator lines for exposition and character speaker IDs only for actual character dialogue.",
            "Use at least two different named character speakers across the story, plus narrator when helpful.",
            "Every line speakerId must exactly match one speakerId from voiceCast. Do not invent speakerIds inside scenes.",
            "Never ask the child to choose during the story. No interactive choices.",
            "Use recurring character designs that can be reused exactly in every image.",
            "The imagePrompt for each scene must describe only a standalone full-bleed scene illustration. Never ask for a book page, open book, printed page, panels, frames, borders, captions, handwriting or handwriting-like scribbles, fake lettering, scribbled fake words, arrows that point at labels, typography, typography in any signage, typography in any overlays, typography in meme-style captions, typography in infographics.",
            "For characterDesigns, define stable visual identity: species/body shape, size, colors, facial features, clothing/accessories, and one memorable silhouette detail for every recurring character.",
            "Keep the content safe: no graphic violence, real-world instructions, medical/legal advice, sexual content, private data, maps, or internet assistant behavior.",
            "Return only JSON.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            childName,
            childInput,
            targetDurationSeconds: 240,
            pageCount: STORY_SCENE_COUNT,
            availableVoices: [
              {
                speakerId: "narrator",
                displayName: "Narrator",
                trait: "narrator",
                usage: "Use for all AI narration and non-character lines.",
              },
              {
                speakerId: "hero",
                displayName: hints?.useChildAsProtagonist ? childName : "Main character",
                trait: "brave",
                usage: "Use for the main character dialogue.",
              },
              {
                speakerId: "friend",
                displayName: "Small friend",
                trait: "tiny",
                usage: "Use for a small, cute friend character dialogue.",
              },
              {
                speakerId: "guide",
                displayName: "Wise guide",
                trait: "wise",
                usage: "Use for a calm mentor character dialogue.",
              },
              {
                speakerId: "silly",
                displayName: "Silly character",
                trait: "silly",
                usage: "Use for a playful comic character dialogue.",
              },
            ],
            requiredJsonShape: {
              storyBible: {
                premise: "string",
                protagonist: "string",
                setting: "string",
                tone: "string",
                characterDesigns:
                  "Detailed, reusable visual design bible for every recurring character.",
                plotSummary: "Complete beginning-middle-end summary.",
              },
              voiceCast:
                "Array of 3-5 cast members. Must include narrator and at least two named character voices. Use stable speakerIds and traits from the available voices.",
              scenes:
                `Exactly ${STORY_SCENE_COUNT} pages. Each page has title, summary, imagePrompt, and 2-4 lines. Keep the full story near 4 minutes total. Lines include speakerId, speakerName, text, emotion. CRITICAL: Scene titles must be 3-5 words maximum, focus on action/adventure themes (e.g., 'Dragon Mountain Quest', 'Magic Forest Adventure'), never use character descriptions or possessive forms.`,
            },
          }),
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message.content || "{}") as GeneratedFullStory;
    const generatedBible = parsed.storyBible || {};
    const fallbackBible = createStoryBible(
      childInput,
      hints?.useChildAsProtagonist ? childName : undefined,
    );
    const protagonist = hints?.useChildAsProtagonist
      ? childName
      : generatedBible.protagonist || inferHero(childInput);
    const bible: StoryBible = {
      ...fallbackBible,
      ...generatedBible,
      premise: generatedBible.premise || childInput,
      protagonist,
      artStyle: ART_STYLE,
      characterDesigns: [
        hints?.useChildAsProtagonist
          ? `${childName} is the main character: a real child transformed into a gentle storybook hero. Keep ${childName}'s face, hair, skin tone, eye shape, and smile consistent with the uploaded reference photo when one is provided; use a fixed child-friendly outfit or signature accessory across every page.`
          : "",
        generatedBible.characterDesigns || fallbackBible.characterDesigns,
      ]
        .filter(Boolean)
        .join(" "),
      forbiddenContent: fallbackBible.forbiddenContent,
    };
    const voiceCast = hints?.useChildAsProtagonist
      ? ensureChildHeroVoice(normalizeVoiceCast(parsed.voiceCast, bible.protagonist), childName)
      : normalizeVoiceCast(parsed.voiceCast, bible.protagonist);
    const scenes = parsed.scenes?.slice(0, STORY_SCENE_COUNT).map((scene, index) => {
      const lines = normalizeLines(scene.lines || [], voiceCast);
      const sceneNumber = index + 1;
      
      // Validate and clean the title, with special handling for first scene
      let cleanedTitle = scene.title ? validateAndCleanTitle(scene.title, childInput) : "";
      if (!cleanedTitle || cleanedTitle === scene.title) {
        cleanedTitle = sceneNumber === 1 
          ? generateCatchyTitle(childInput, bible.protagonist, sceneNumber)
          : `Chapter ${sceneNumber}`;
      }
      
      return {
        id: makeId("scene"),
        sceneNumber,
        title: cleanedTitle,
        summary: scene.summary || lines.map((line) => line.text).join(" "),
        imagePrompt: [
          scene.imagePrompt,
          `Scene ${sceneNumber} of ${STORY_SCENE_COUNT}.`,
          "Show only the story moment as a standalone full-bleed illustration, with recurring characters matching the character design bible exactly.",
          "No book pages, no open books, no printed pages, no panel layouts, no captions.",
          "No typography, handwriting, fake gibberish text, scribbles that resemble letters, labels, arrows, callouts, color swatches, infographics.",
        ]
          .filter(Boolean)
          .join(" "),
        lines: lines.length ? lines : fallbackLines(sceneNumber, bible, childName),
        choices: [],
      } satisfies Scene;
    });

    if (scenes?.length === STORY_SCENE_COUNT) {
      return { bible, voiceCast, scenes };
    }
  } catch (error) {
    console.error("OpenAI full story generation failed", error);
  }

  return createFallbackStory(childInput, childName, hints?.useChildAsProtagonist);
}

function createImagePrompt(sceneNumber: number, bible: StoryBible, lines: NarrationLine[]) {
  return [
    `Scene ${sceneNumber} of a ${STORY_SCENE_COUNT}-scene story.`,
    `Protagonist: ${bible.protagonist}.`,
    `Setting: ${bible.setting}.`,
    `Story idea: ${bible.premise}.`,
    `Scene action (paint the moment only; never render dialogue as typography): ${lines.map((line) => line.text).join(" ")}`,
    "Show expressive characters, cozy action, and a clear standalone illustrated story moment.",
    "No typography of any language, handwriting, handwriting-like marks, scribbles, captions, meme UI, storefront signs.",
    "No labels, arrows, infographics, color-palette legends, scribbled fake words, watermarks.",
  ].join(" ");
}

export async function advanceStory(request: StoryTurnRequest): Promise<StoryTurnResponse> {
  const safety = sanitizeChildInput(request.transcript);
  const childName = request.childName || request.session?.childProfile.name || "Luna";
  const ageRange =
    request.childAgeRange || request.session?.childProfile.ageRange || ("4-5" as ChildProfile["ageRange"]);
  const storyEnergy = request.storyEnergy ?? "balanced";
  const useChildAsProtagonist = request.useChildAsProtagonist ?? false;
  const intent = safety.status === "allowed" ? safety.sanitizedIntent : safety.childMessage;
  const safeIntent = safety.status === "block" ? "a gentle friendship adventure" : intent;
  const { bible, voiceCast, scenes } = await generateFullStoryWithOpenAI(childName, safeIntent, {
    ageRange,
    storyEnergy,
    useChildAsProtagonist,
  });

  const session: StorySession = {
    id: request.session?.id || request.sessionId || makeId("story"),
    childProfile: request.session?.childProfile || {
      id: makeId("child"),
      name: childName,
      ageRange,
    },
    status: "complete",
    currentSceneIndex: 0,
    storyBible: bible,
    voiceCast,
    scenes,
    safetyLog: [...(request.session?.safetyLog || []), safety],
    createdAt: request.session?.createdAt || now(),
    updatedAt: now(),
  };

  return { session, scene: scenes[0], safety };
}
