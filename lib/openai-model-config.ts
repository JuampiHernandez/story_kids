/**
 * Central place for env-driven OpenAI model selection used by story + illustrations.
 */

export const DEFAULT_OPENAI_STORY_MODEL = "gpt-4.1";
/** Default favors lowest image API spend (see `OPENAI_IMAGE_MODEL` / `OPENAI_IMAGE_SIZE`). */
export const DEFAULT_OPENAI_IMAGE_MODEL = "dall-e-2";

const DALL_E_2_SIZES = ["256x256", "512x512", "1024x1024"] as const;

/** Chat / completions model — produces story JSON (`lib/story-engine.ts`). */
export function resolvedStoryModel(): string {
  const raw =
    process.env.OPENAI_STORY_MODEL?.trim() ||
    process.env.OPENAI_CHAT_MODEL?.trim();
  return raw || DEFAULT_OPENAI_STORY_MODEL;
}

/**
 * Images API model (`images.generate`). Supports `OPENAI_IMAGE_MODEL`; also reads
 * `IMAGE_MODEL` for convenience (matches common local naming).
 */
export function resolvedImageModel(): string {
  const raw =
    process.env.OPENAI_IMAGE_MODEL?.trim() || process.env.IMAGE_MODEL?.trim();
  return raw || DEFAULT_OPENAI_IMAGE_MODEL;
}

export function isDallE2Model(model: string): boolean {
  return model.trim().startsWith("dall-e-2");
}

/** Subset passed to `openai.images.generate` beside `prompt`. */
export type ImageGenerationBase = {
  model: string;
  size: "1024x1024" | "512x512" | "256x256" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd" | "low" | "medium" | "high";
  n: 1;
};

export type ImageQualityTier = "low" | "medium" | "high";

/**
 * Builds `images.generate` fields for supported families. Prefer setting
 * `OPENAI_IMAGE_QUALITY` for cost vs fidelity (meaning depends on model family).
 */
export function imageGenerationParams(modelFromEnv: string): ImageGenerationBase {
  const model = modelFromEnv.trim();
  const q = process.env.OPENAI_IMAGE_QUALITY?.trim().toLowerCase();
  const n = 1 as const;

  if (isDallE2Model(model)) {
    const requested = process.env.OPENAI_IMAGE_SIZE?.trim() as (typeof DALL_E_2_SIZES)[number] | undefined;
    const size =
      requested && DALL_E_2_SIZES.includes(requested) ? requested : "512x512";
    return {
      model,
      size,
      n,
    };
  }

  if (model.startsWith("dall-e-3")) {
    const quality = q === "hd" ? "hd" : "standard";
    return {
      model,
      size: "1024x1024",
      quality,
      n,
    };
  }

  // gpt-image-1 (and dated snapshots): quality low | medium | high — default low (~cheapest).
  const quality =
    q === "medium" || q === "high"
      ? q
      : q === "low" || q === undefined || q === ""
        ? "low"
        : "low";

  return {
    model,
    size: "1024x1024",
    quality,
    n,
  };
}

/** Parent-facing tier: maps to size (DALL·E 2), quality (gpt-image), or hd flag (DALL·E 3). */
export function imageGenerationParamsForTier(
  modelFromEnv: string,
  tier: ImageQualityTier,
): ImageGenerationBase {
  const model = modelFromEnv.trim();
  const n = 1 as const;

  if (isDallE2Model(model)) {
    const size = tier === "low" ? "256x256" : tier === "medium" ? "512x512" : "1024x1024";
    return { model, size, n };
  }

  if (model.startsWith("dall-e-3")) {
    const quality = tier === "high" ? "hd" : "standard";
    return { model, size: "1024x1024", quality, n };
  }

  const quality: "low" | "medium" | "high" =
    tier === "low" ? "low" : tier === "medium" ? "medium" : "high";
  return { model, size: "1024x1024", quality, n };
}

export function resolveImageGenerationParams(
  modelFromEnv: string,
  tier?: ImageQualityTier,
): ImageGenerationBase {
  return tier ? imageGenerationParamsForTier(modelFromEnv, tier) : imageGenerationParams(modelFromEnv);
}
