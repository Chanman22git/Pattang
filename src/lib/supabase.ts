import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Phase 0: client is wired but won't connect until VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set in .env.local (see .env.example).
// The anon key is safe to ship to the browser — RLS protects data.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const supabaseConfigured = supabase !== null;
