/** Mirrors SQL `compute_is_premium_email` — keep domains aligned with Supabase triggers. */
export function computeIsPremiumEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed === "juampi.contact@gmail.com") return true;
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return false;
  const domain = trimmed.slice(at + 1);
  return domain === "elevenlabs.io" || domain === "cursor.com";
}
