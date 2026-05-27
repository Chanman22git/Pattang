import { requireSupabase } from "./supabase";
import type {
  DocumentInsert,
  DocumentRow,
  DocumentWithLinks,
} from "./types";

// ----- Per-case + per-template queries -----------------------------------

export async function listDocumentsForCase(
  case_id: string
): Promise<DocumentWithLinks[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("document")
    .select("*, template:template_id(name), cases:case_id(title)")
    .eq("case_id", case_id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(flatten);
}

export async function listDocumentsForTemplate(
  template_id: string
): Promise<DocumentWithLinks[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("document")
    .select("*, template:template_id(name), cases:case_id(title)")
    .eq("template_id", template_id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(flatten);
}

export async function getDocument(
  id: string
): Promise<DocumentWithLinks | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("document")
    .select("*, template:template_id(name), cases:case_id(title)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? flatten(data) : null;
}

// ----- Create / delete ---------------------------------------------------

export async function createDocument(
  input: DocumentInsert
): Promise<DocumentRow> {
  const db = requireSupabase();
  const { data: u } = await db.auth.getUser();
  const user_id = u.user?.id;
  if (!user_id) throw new Error("Not signed in.");

  const { data, error } = await db
    .from("document")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;

  // Keep template.linked_doc_count fresh. A DB trigger would be the
  // proper fix; this client-side bump is safe for a single-user app and
  // is the simplest thing that ships chunk 3.
  if (input.template_id) {
    await bumpLinkedCount(input.template_id, +1);
  }

  return data as DocumentRow;
}

export async function deleteDocument(doc: DocumentRow): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("document").delete().eq("id", doc.id);
  if (error) throw error;
  if (doc.template_id) {
    await bumpLinkedCount(doc.template_id, -1);
  }
}

async function bumpLinkedCount(template_id: string, delta: number) {
  const db = requireSupabase();
  // Read-modify-write rather than an RPC. Acceptable for v1 (single user,
  // serial usage). Switch to a server-side increment (RPC or trigger)
  // when multi-user lands.
  const { data, error } = await db
    .from("template")
    .select("linked_doc_count")
    .eq("id", template_id)
    .maybeSingle();
  if (error || !data) return;
  const next = Math.max(0, (data.linked_doc_count ?? 0) + delta);
  await db
    .from("template")
    .update({ linked_doc_count: next })
    .eq("id", template_id);
}

// ----- helpers -----------------------------------------------------------

/** PostgREST returns embedded relations as nested objects. We flatten the
 *  pieces we care about so callers don't have to deal with the join shape. */
function flatten(row: any): DocumentWithLinks {
  const { template, cases, ...rest } = row;
  return {
    ...rest,
    template_name: template?.name ?? null,
    case_title: cases?.title ?? "",
  } as DocumentWithLinks;
}
