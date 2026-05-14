/**
 * Public URL of the current request. Prefer proxy headers on Vercel so redirects
 * match the browser-visible host (production domain), not an internal URL.
 */
export function getRequestOrigin(request: Request): string {
  const fromUrl = new URL(request.url).origin;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) {
    return fromUrl;
  }
  const host = forwardedHost.split(",")[0]?.trim();
  if (!host) {
    return fromUrl;
  }
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`;
}
