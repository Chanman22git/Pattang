import { requireSupabase } from "./supabase";
import type { CaseInsert, CaseRow, CaseRowEnriched } from "./types";

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

// ────────────────────────────────────────────────────────────────────────────
// Enriched listing for the Vakil Chambers Cases page.
// ────────────────────────────────────────────────────────────────────────────

export async function listCasesEnriched(): Promise<CaseRowEnriched[]> {
  const db = requireSupabase();
  // PostgREST exposes `count: 'exact'` on embedded selects — that gives
  // us per-row totals without a separate query. Same for case_fact, with
  // a second relation filtered to unconfirmed.
  const { data, error } = await db
    .from("cases")
    .select(
      "*, " +
        "documents:document(count), " +
        "facts:case_fact(count), " +
        "unconfirmed:case_fact!inner(count)"
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<
    CaseRow & {
      documents?: Array<{ count: number }>;
      facts?: Array<{ count: number }>;
      unconfirmed?: Array<{ count: number }>;
    }
  >;

  // We have to compute unconfirmed counts separately because PostgREST
  // doesn't let us pass a filter on the embedded relation via the URL
  // shape the typed client supports. Cheaper: one extra round-trip.
  let unconfirmedByCase: Record<string, number> = {};
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const uq = await db
      .from("case_fact")
      .select("case_id")
      .in("case_id", ids)
      .eq("confirmed", false);
    if (!uq.error && uq.data) {
      for (const row of uq.data as Array<{ case_id: string }>) {
        unconfirmedByCase[row.case_id] =
          (unconfirmedByCase[row.case_id] ?? 0) + 1;
      }
    }
  }

  // First active row → pinned. Cheap heuristic until we have a real flag.
  let firstActiveSeen = false;

  return rows.map((r) => {
    const docs = r.documents?.[0]?.count ?? 0;
    const facts = r.facts?.[0]?.count ?? 0;
    const unconfirmed = unconfirmedByCase[r.id] ?? 0;
    const pinned = !firstActiveSeen && r.status === "active";
    if (pinned) firstActiveSeen = true;
    return {
      ...r,
      parties: splitParties(r.title),
      gist: r.notes,
      stage: deriveStage(r),
      next: null, // P4 wires the real value
      docs,
      facts,
      unconfirmed,
      pinned,
    } satisfies CaseRowEnriched;
  });
}

/** Split a title like "Plaintiff A v. Defendant B" into parties.
 *  Falls back to using the whole title as the petitioner. */
function splitParties(title: string): { p: string; r: string } {
  const m = title.match(/^(.+?)\s+(?:v\.?|vs\.?)\s+(.+)$/i);
  if (m) return { p: m[1].trim(), r: m[2].trim() };
  return { p: title.trim(), r: "" };
}

function deriveStage(r: CaseRow): string | null {
  if (r.status === "closed") return "Disposed";
  if (r.status === "on_hold") return "On hold";
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-case facts — powers the Dossier "Key facts" block (PRD §4.3).
// ────────────────────────────────────────────────────────────────────────────

export interface CaseFactRow {
  id: string;
  user_id: string;
  case_id: string;
  kind: "party" | "date" | "fact";
  value: string;
  source_doc_id: string | null;
  confirmed: boolean;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listCaseFacts(case_id: string): Promise<CaseFactRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("case_fact")
    .select("*")
    .eq("case_id", case_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaseFactRow[];
}

/** Human "in 5 days" / "next month" relative phrase for a date string.
 *  Returns null when there's no date to describe. Render-time only. */
export function relativeWhen(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  const day = 86400_000;
  const days = Math.round(ms / day);
  if (days < -30) return "past";
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days === -1) return "yesterday";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "in a week";
  if (days < 35) return days < 24 ? "in 3 weeks" : "in a month";
  if (days < 65) return "next month";
  if (days < 110) return "in 2 months";
  return `in ${Math.round(days / 30)} months`;
}
