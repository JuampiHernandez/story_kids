import OpenAI from "openai";
import {
  isDallE2Model,
  resolvedImageModel,
  resolveImageGenerationParams,
  type ImageQualityTier,
} from "@/lib/openai-model-config";
import { ART_STYLE, type Scene, type StoryBible } from "@/lib/story-schema";

/** OpenAI DALL·E temporary download URLs (Azure blob) expire after about an hour — do not persist as the only copy. */
export function looksLikeExpiredProneImageUrl(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  try {
    return new URL(url).hostname.endsWith(".blob.core.windows.net");
  } catch {
    return false;
  }
}

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fee2e2"/>
      <stop offset="50%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="280" cy="320" r="120" fill="#fff7ed" opacity="0.8"/>
  <circle cx="720" cy="300" r="90" fill="#dbeafe" opacity="0.85"/>
  <path d="M160 760 C310 590 430 650 520 530 C650 365 820 510 900 760 Z" fill="#86efac" opacity="0.8"/>
  <path d="M246 604 C330 520 450 512 546 596 C638 678 744 650 816 584" fill="none" stroke="#7c3aed" stroke-width="34" stroke-linecap="round" opacity="0.45"/>
  <text x="512" y="894" text-anchor="middle" font-family="Arial" font-size="54" fill="#7c2d12">Toddler Tales</text>
</svg>`);

export function isPlaceholderImageUrl(imageUrl?: string) {
  return imageUrl === PLACEHOLDER_IMAGE;
}

function compactForDallE2(prompt: string, scene: Scene, storyBible: StoryBible) {
  const compactPrompt = [
    "Kid-friendly watercolor storybook illustration. No words, letters, labels, captions, signs, or UI.",
    `Story: ${storyBible.plotSummary}`,
    storyBible.characterDesigns ? `Characters: ${storyBible.characterDesigns}` : "",
    `Scene ${scene.sceneNumber}: ${scene.imagePrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  return compactPrompt.length <= 980 ? compactPrompt : `${compactPrompt.slice(0, 977)}...`;
}

async function imageUrlToDataUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) return imageUrl;

  const contentType = response.headers.get("content-type") || "image/png";
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${imageBuffer.toString("base64")}`;
}

export async function generateSceneImage(
  scene: Scene,
  storyBible: StoryBible,
  options?: { imageQualityTier?: ImageQualityTier },
) {
  if (!process.env.OPENAI_API_KEY) {
    return PLACEHOLDER_IMAGE;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = [
    storyBible.artStyle || ART_STYLE,
    [
      "Create one full-bleed scene illustration only.",
      "The output must look like a standalone story moment, not a photographed book, not an open book, not a printed page, not a collage, not a two-page spread.",
      "Do not include any written words, letters, numbers, handwriting, handwriting-like scribbles, fake gibberish text, captions, subtitles, storefront signs, street signs.",
      "No labels, arrows, callouts, tooltips, infographics, color-palette stripes, typography in any script, meme captions, meme UI, meme stickers.",
      "No speech bubbles containing text — if mouths move, imply speech visually only without letters.",
      "Use the same character proportions, colors, clothing/accessories, face shapes, and silhouettes in every scene.",
      "Keep camera style consistent: medium-wide child-friendly composition, soft watercolor texture, rounded toy-like characters, warm pastel lighting.",
    ].join(" "),
    storyBible.characterDesigns
      ? `Use these exact recurring character designs in every image: ${storyBible.characterDesigns}`
      : "",
    `Keep this story consistent: ${storyBible.plotSummary}`,
    `Scene moment to illustrate: ${scene.imagePrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const model = resolvedImageModel();
  const trimmedModel = model.trim();
  const params = resolveImageGenerationParams(model, options?.imageQualityTier);
  const finalPrompt = isDallE2Model(model) ? compactForDallE2(prompt, scene, storyBible) : prompt;
  const requestB64Json =
    isDallE2Model(trimmedModel) || trimmedModel.startsWith("dall-e-3");

  try {
    const result = await openai.images.generate({
      ...params,
      prompt: finalPrompt,
      ...(requestB64Json ? ({ response_format: "b64_json" } as const) : {}),
    });

    const image = result.data?.[0];
    if (image?.b64_json) {
      return `data:image/png;base64,${image.b64_json}`;
    }

    if (image?.url) {
      return await imageUrlToDataUrl(image.url);
    }

    return PLACEHOLDER_IMAGE;
  } catch (error) {
    console.error("OpenAI image generation failed", error);
    return PLACEHOLDER_IMAGE;
  }
}
