import { requireSupabase } from "./supabase";
import type { CaseInsert, CaseRow } from "./types";

// RLS does the user filtering — we never need to pass user_id from the
// client. The DB rejects rows that don't belong to auth.uid().

export async function listCases(): Promise<CaseRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("cases")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCase(id: string): Promise<CaseRow | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCase(input: CaseInsert): Promise<CaseRow> {
  const db = requireSupabase();
  // user_id is filled by us because the column is NOT NULL. RLS still
  // verifies it matches auth.uid() before insert.
  const { data: userResp } = await db.auth.getUser();
  const user_id = userResp.user?.id;
  if (!user_id) throw new Error("Not signed in.");

  const { data, error } = await db
    .from("cases")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCase(
  id: string,
  patch: Partial<CaseInsert>
): Promise<CaseRow> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("cases")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCase(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("cases").delete().eq("id", id);
  if (error) throw error;
}
