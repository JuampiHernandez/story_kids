export function isPlaceholderStoryImageUrl(imageUrl?: string) {
  return Boolean(imageUrl?.startsWith("data:image/svg+xml") && imageUrl.includes("Toddler%20Tales"));
}

function looksLikeExpiredProneImageUrl(imageUrl: string) {
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
      !looksLikeExpiredProneImageUrl(imageUrl),
  );
}
