import { isPlaceholderImageUrl } from "./image-provider";

export function isPlaceholderStoryImageUrl(imageUrl?: string) {
  return isPlaceholderImageUrl(imageUrl);
}

/** OpenAI / Azure temporary blobs — URLs die quickly; hydrate to Supabase Storage for library covers. */
export function looksLikeExpiredProneStoryImageUrl(imageUrl: string) {
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) return false;
  try {
    return new URL(imageUrl).hostname.endsWith(".blob.core.windows.net");
  } catch {
    return false;
  }
}

/** True when the session already has a displayable, non-expiring image reference (data URL or non-blob HTTPS). */
export function hasGeneratedStoryImageUrl(imageUrl?: string): imageUrl is string {
  return Boolean(
    imageUrl &&
      !isPlaceholderStoryImageUrl(imageUrl) &&
      !looksLikeExpiredProneStoryImageUrl(imageUrl),
  );
}

/** True when the reader can show something while the story runs — real art or the soft gradient fallback illustration. */
export function hasRenderableStoryImageUrl(imageUrl?: string): imageUrl is string {
  return hasGeneratedStoryImageUrl(imageUrl) || isPlaceholderStoryImageUrl(imageUrl);
}
