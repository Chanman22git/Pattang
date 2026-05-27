import { requireSupabase } from "./supabase";
import type { ProfileRow } from "./types";

/**
 * Idempotently upsert a row in `profile` for the signed-in user. Called
 * once when the session first becomes available so downstream features
 * (prefill defaults, advocate name on documents) have somewhere to write.
 *
 * Returns the row whether we inserted or it already existed.
 */
export async function ensureProfile(): Promise<ProfileRow | null> {
  const db = requireSupabase();
  const { data: u } = await db.auth.getUser();
  const user = u.user;
  if (!user) return null;

  // Try a select first — cheaper than an upsert when the row exists.
  const existing = await db
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const { data, error } = await db
    .from("profile")
    .insert({ user_id: user.id, email: user.email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}
