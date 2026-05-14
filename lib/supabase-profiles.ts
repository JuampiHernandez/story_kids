import { computeIsPremiumEmail } from "@/lib/premium-email";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function ensureProfileRow(userId: string, email: string | undefined) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const isPremium = computeIsPremiumEmail(email);
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: email ?? "",
      is_premium: isPremium,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("ensureProfileRow upsert:", error.message);
  }
}

export async function fetchUserPremiumFlag(userId: string, fallbackEmail?: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return computeIsPremiumEmail(fallbackEmail);

  const { data } = await admin.from("profiles").select("is_premium").eq("id", userId).maybeSingle();

  if (data && typeof data.is_premium === "boolean") {
    return data.is_premium;
  }

  return computeIsPremiumEmail(fallbackEmail);
}
