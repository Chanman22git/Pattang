import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Phase 0: client is wired but won't connect until VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set in .env.local (see .env.example).
// The anon key is safe to ship to the browser — RLS protects data.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // Persist session in localStorage and pick up magic-link tokens
          // from the URL fragment on page load.
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true,
          flowType: "implicit",
        },
      })
    : null;

export const supabaseConfigured = supabase !== null;

/**
 * Narrow helper so call sites get a non-null client without ?? everywhere.
 * Throws a clear error message if the caller forgot to gate on
 * supabaseConfigured.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY in .env.local (see .env.example)."
    );
  }
  return supabase;
}
