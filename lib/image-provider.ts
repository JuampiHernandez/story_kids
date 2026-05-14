import { generateText } from "ai";
import OpenAI, { toFile } from "openai";
import {
  economyGuestImageGenerationParams,
  isDallE2Model,
  pixarImageGenerationParams,
  resolvedImageModel,
  resolveImageGenerationParams,
  type ImageQualityTier,
} from "@/lib/openai-model-config";
import { ART_STYLE, type Scene, type StoryBible } from "@/lib/story-schema";
import { dataUrlToBlob, uploadStoryImage } from "@/lib/supabase-storage";
import type { ImageStyle } from "@/lib/story-settings";

/**
 * Google's Gemini 2.5 Flash Image (a.k.a. "Nano Banana") routed through the
 * Vercel AI Gateway. Primary generator for the Disney/Pixar style — about
 * 4× cheaper than `gpt-image-1` at `quality:high` with comparable subject
 * integrity per published benchmarks.
 *
 * OpenAI Pixar (`images.generate` / `images.edit`) is kept in code but **off by
 * default** — set `OPENAI_PIXAR_FALLBACK_ENABLED=true` to restore GPT backup.
 *
 * Auth: `ai` resolves `AI_GATEWAY_API_KEY` automatically (or `VERCEL_OIDC_TOKEN`
 * after `vercel env pull`). Vercel adds zero markup over Google's list price.
 */
const NANO_BANANA_GATEWAY_MODEL = "google/gemini-2.5-flash-image";

function isOpenAiPixarFallbackEnabled(): boolean {
  return process.env.OPENAI_PIXAR_FALLBACK_ENABLED?.trim().toLowerCase() === "true";
}

type ChildReferenceImage = {
  childName: string;
  faceDataUrl: string;
};

/**
 * Art-direction prompt fragment for the "Disney / Pixar 3D animation" style.
 * Tuned for OpenAI's `gpt-image-1` model — paragraph form, punchy adjectives,
 * inspired by Disney/Pixar/Dreamworks feature-film CGI references.
 */
export const PIXAR_ART_STYLE =
  [
    "Pixar-quality 3D animated cartoon style, stylized cinematic CG render in the look of a modern Disney/Pixar/Dreamworks feature film",
    "stylized cartoon characters with large expressive eyes, soft subsurface skin shading, fluffy stylized hair, gentle rounded silhouettes, friendly proportions",
    "painterly volumetric lighting with warm golden rim light, soft ambient bounce, cinematic depth of field with creamy bokeh",
    "lush detailed environments with hand-crafted set dressing, atmospheric haze, magical mood",
    "vibrant but harmonious color palette, polished feature-film CGI look, high-end studio quality",
    "family-friendly children's movie aesthetic, single subject focus, full-bleed cinematic composition",
    "absolutely no text or watermarks anywhere: no words, letters, numbers, captions, subtitles, signs, logos, UI, or typography of any language",
    "no book mockup, no open book, no page layout, no panels, no borders — pure standalone illustrated scene",
  ].join(", ");

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

/** Thrown when OpenAI fails or misconfig prevents a real raster image response (never the SVG fallback). */
export class StoryImageGenerationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StoryImageGenerationError";
  }
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

function dataUrlToImageBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  return {
    buffer: Buffer.from(match[2], "base64"),
    mimeType,
  };
}

async function generateSceneImageFromChildReference(
  openai: OpenAI,
  prompt: string,
  reference: ChildReferenceImage,
  qualityTier: ImageQualityTier | undefined,
  isPixar: boolean,
) {
  const imageData = dataUrlToImageBuffer(reference.faceDataUrl);
  if (!imageData) return null;

  const params = isPixar
    ? pixarImageGenerationParams()
    : resolveImageGenerationParams("gpt-image-1", qualityTier);
  const quality = params.quality === "hd" ? "high" : params.quality;
  const referenceFile = await toFile(imageData.buffer, "child-face.jpg", {
    type: imageData.mimeType,
  });

  const result = await openai.images.edit({
    model: params.model,
    size: params.size,
    n: params.n,
    quality,
    image: referenceFile,
    prompt: [
      "Use the uploaded photo only as the identity reference for the child protagonist.",
      `The protagonist is ${reference.childName}; preserve their face shape, skin tone, hair, eye shape, and smile while translating them into the requested kid-friendly illustration style.`,
      "Do not render the source photo itself, a selfie, a photo frame, or a realistic portrait. Create the complete story scene.",
      prompt,
    ].join("\n"),
  });

  const image = result.data?.[0];
  if (image?.b64_json) {
    return `data:image/png;base64,${image.b64_json}`;
  }

  if (image?.url) {
    return await imageUrlToDataUrl(image.url);
  }

  return null;
}

function openAIAsErrorDetail(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

/**
 * Render a Pixar-style scene with Nano Banana via Vercel AI Gateway. Returns a
 * `data:image/...;base64,...` URL on success, or `null` when no Gateway auth is
 * present or the model returns no image file. When OpenAI Pixar fallback is
 * disabled (default), the caller throws; when enabled, the caller may use GPT.
 */
async function generatePixarSceneImageWithNanoBanana(
  prompt: string,
  reference?: ChildReferenceImage,
): Promise<string | null> {
  const hasGatewayAuth =
    Boolean(process.env.AI_GATEWAY_API_KEY?.trim()) ||
    Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
  if (!hasGatewayAuth) return null;

  const referenceImage = reference ? dataUrlToImageBuffer(reference.faceDataUrl) : null;
  const referenceInstruction = reference
    ? [
        "Use the attached child photo only as identity reference.",
        `The protagonist is ${reference.childName}; preserve their face shape, skin tone, hair, eye shape, and smile while translating into the requested Disney/Pixar style.`,
        "Do not render the source photo itself, a selfie, a photo frame, or a realistic portrait.",
      ].join(" ")
    : "";

  const result = await generateText({
    model: NANO_BANANA_GATEWAY_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: [referenceInstruction, prompt].filter(Boolean).join("\n") },
          ...(referenceImage
            ? [
                {
                  type: "image" as const,
                  image: referenceImage.buffer,
                  mediaType: referenceImage.mimeType,
                },
              ]
            : []),
        ],
      },
    ],
  });

  for (const file of result.files ?? []) {
    if (file.mediaType?.startsWith("image/")) {
      const base64 = Buffer.from(file.uint8Array).toString("base64");
      return `data:${file.mediaType};base64,${base64}`;
    }
  }

  return null;
}

export async function generateSceneImage(
  scene: Scene,
  storyBible: StoryBible,
  options?: {
    imageQualityTier?: ImageQualityTier;
    imageStyle?: ImageStyle;
    childReferenceImage?: ChildReferenceImage;
    /** Anonymous sessions: capped {@link economyGuestImageGenerationParams} */
    economyGuestMode?: boolean;
  },
) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new StoryImageGenerationError("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (options?.economyGuestMode) {
    const economyPrompt = compactForDallE2("", scene, storyBible);
    const params = economyGuestImageGenerationParams();

    try {
      const result = await openai.images.generate({
        ...params,
        prompt: economyPrompt,
      });

      const image = result.data?.[0];
      if (image?.b64_json) {
        return `data:image/png;base64,${image.b64_json}`;
      }

      if (image?.url) {
        return await imageUrlToDataUrl(image.url);
      }
      throw new StoryImageGenerationError("OpenAI Images returned no image data (guest)");
    } catch (error) {
      if (error instanceof StoryImageGenerationError) throw error;
      console.error("OpenAI economy guest image generation failed", error);
      const detail = openAIAsErrorDetail(error);
      throw new StoryImageGenerationError(
        detail ? `Guest image generation failed: ${detail}` : "Guest image generation failed",
        { cause: error },
      );
    }
  }

  const isPixar = options?.imageStyle === "disney-pixar";

  const artDirection = isPixar
    ? PIXAR_ART_STYLE
    : storyBible.artStyle || ART_STYLE;

  const sceneDirection = isPixar
    ? [
        "Create one full-bleed cinematic scene render only.",
        "Output must look like a single still frame from a Pixar/Disney 3D animated feature, not a photographed book, not an open book, not a printed page, not a collage, not a two-page spread.",
        "Do not include any written words, letters, numbers, handwriting, handwriting-like scribbles, fake gibberish text, captions, subtitles, storefront signs, or street signs.",
        "No labels, arrows, callouts, tooltips, infographics, color-palette stripes, typography in any script, meme captions, meme UI, or meme stickers.",
        "No speech bubbles containing text — if mouths move, imply speech visually only without letters.",
        "Use the same stylized character proportions, colors, clothing/accessories, face shapes, and silhouettes in every scene.",
        "Keep camera style consistent: medium-wide child-friendly cinematic composition, polished CG render, soft volumetric lighting with warm rim light, painterly bokeh, vibrant harmonious palette.",
      ].join(" ")
    : [
        "Create one full-bleed scene illustration only.",
        "The output must look like a standalone story moment, not a photographed book, not an open book, not a printed page, not a collage, not a two-page spread.",
        "Do not include any written words, letters, numbers, handwriting, handwriting-like scribbles, fake gibberish text, captions, subtitles, storefront signs, street signs.",
        "No labels, arrows, callouts, tooltips, infographics, color-palette stripes, typography in any script, meme captions, meme UI, meme stickers.",
        "No speech bubbles containing text — if mouths move, imply speech visually only without letters.",
        "Use the same character proportions, colors, clothing/accessories, face shapes, and silhouettes in every scene.",
        "Keep camera style consistent: medium-wide child-friendly composition, soft watercolor texture, rounded toy-like characters, warm pastel lighting.",
      ].join(" ");

  const prompt = [
    artDirection,
    sceneDirection,
    storyBible.characterDesigns
      ? `Use these exact recurring character designs in every image: ${storyBible.characterDesigns}`
      : "",
    `Keep this story consistent: ${storyBible.plotSummary}`,
    `Scene moment to illustrate: ${scene.imagePrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (options?.childReferenceImage && !isPixar) {
    try {
      const referencedImage = await generateSceneImageFromChildReference(
        openai,
        prompt,
        options.childReferenceImage,
        options.imageQualityTier,
        isPixar,
      );
      if (referencedImage) return referencedImage;
    } catch (error) {
      console.error("OpenAI reference image generation failed", error);
    }
  }

  if (isPixar) {
    // Primary: Nano Banana (Gemini 2.5 Flash Image) via AI Gateway.
    try {
      const nanoBananaImage = await generatePixarSceneImageWithNanoBanana(
        prompt,
        options?.childReferenceImage,
      );
      if (nanoBananaImage) return nanoBananaImage;
      console.warn(
        options?.childReferenceImage
          ? "Nano Banana Pixar image returned no image data (with child reference)"
          : "Nano Banana Pixar image returned no image data",
      );
    } catch (error) {
      console.warn(
        options?.childReferenceImage
          ? "Nano Banana Pixar image generation failed (with child reference)"
          : "Nano Banana Pixar image generation failed",
        error,
      );
    }

    if (!isOpenAiPixarFallbackEnabled()) {
      console.warn(
        "OpenAI Pixar fallback is disabled. Set OPENAI_PIXAR_FALLBACK_ENABLED=true to use gpt-image-1 as backup.",
      );
      throw new StoryImageGenerationError(
        "Pixar illustrations require AI Gateway (Gemini / Nano Banana). Configure AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN, or set OPENAI_PIXAR_FALLBACK_ENABLED=true to allow OpenAI gpt-image-1 as a fallback.",
      );
    }

    // --- OpenAI Pixar fallback (disabled by default; preserved for emergencies) ---
    if (options?.childReferenceImage) {
      try {
        const referencedImage = await generateSceneImageFromChildReference(
          openai,
          prompt,
          options.childReferenceImage,
          options.imageQualityTier,
          true,
        );
        if (referencedImage) {
          console.warn(
            "Using OpenAI Pixar child-reference fallback after Nano Banana path",
          );
          return referencedImage;
        }
      } catch (error) {
        console.warn(
          "OpenAI Pixar child-reference fallback failed; trying OpenAI text-only Pixar fallback",
          error,
        );
      }
    }

    const params = pixarImageGenerationParams();
    try {
      const result = await openai.images.generate({
        ...params,
        prompt,
      });

      const image = result.data?.[0];
      if (image?.b64_json) {
        return `data:image/png;base64,${image.b64_json}`;
      }

      if (image?.url) {
        return await imageUrlToDataUrl(image.url);
      }
      throw new StoryImageGenerationError("OpenAI Images returned no image data (Pixar style)");
    } catch (error) {
      if (error instanceof StoryImageGenerationError) throw error;
      console.error("OpenAI image generation failed", error);
      const detail = openAIAsErrorDetail(error);
      throw new StoryImageGenerationError(
        detail ? `Pixar-style image generation failed: ${detail}` : "Pixar-style image generation failed",
        { cause: error },
      );
    }
  }

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

    throw new StoryImageGenerationError("OpenAI Images returned no image data");
  } catch (error) {
    if (error instanceof StoryImageGenerationError) throw error;
    console.error("OpenAI image generation failed", error);
    const detail = openAIAsErrorDetail(error);
    throw new StoryImageGenerationError(
      detail ? `Image generation failed: ${detail}` : "Image generation failed",
      { cause: error },
    );
  }
}

/**
 * Generate and upload image to Supabase Storage
 * Returns Supabase Storage URL instead of data URL
 */
export async function generateAndUploadStoryImage(
  scene: Scene,
  storyBible: StoryBible,
  storyId: string,
  sceneIndex: number,
  options?: {
    imageQualityTier?: ImageQualityTier;
    childReference?: ChildReferenceImage;
    imageStyle?: ImageStyle;
    economyGuestMode?: boolean;
  },
): Promise<string> {
  const dataUrl = await generateSceneImage(scene, storyBible, {
    imageQualityTier: options?.imageQualityTier,
    imageStyle: options?.imageStyle,
    childReferenceImage: options?.childReference,
    economyGuestMode: options?.economyGuestMode,
  });

  // Convert data URL to blob and upload to Supabase
  const imageBlob = dataUrlToBlob(dataUrl);
  if (!imageBlob) {
    throw new StoryImageGenerationError("Could not decode generated image for upload");
  }

  const uploadedUrl = await uploadStoryImage(imageBlob, storyId, sceneIndex);
  if (!uploadedUrl) {
    console.warn('Failed to upload image to Supabase, using data URL');
    return dataUrl; // Fallback to data URL
  }
  
  console.log(`Image uploaded to Supabase Storage: ${uploadedUrl}`);
  return uploadedUrl;
}
