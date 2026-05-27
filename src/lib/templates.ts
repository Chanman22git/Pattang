import { requireSupabase } from "./supabase";
import type {
  TemplateFieldInsert,
  TemplateFieldRow,
  TemplateInsert,
  TemplateRow,
  TemplateWithFields,
} from "./types";

// ----- Templates ----------------------------------------------------------

export async function listTemplates(): Promise<TemplateRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("template")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTemplate(
  id: string
): Promise<TemplateWithFields | null> {
  const db = requireSupabase();
  // One round-trip via the embedded fields select.
  const { data, error } = await db
    .from("template")
    .select("*, fields:template_field(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // The embedded join doesn't guarantee order; sort by ordinal here.
  const row = data as TemplateRow & { fields: TemplateFieldRow[] };
  row.fields = [...row.fields].sort((a, b) => a.ordinal - b.ordinal);
  return row;
}

export async function createTemplate(
  input: TemplateInsert,
  fields: TemplateFieldInsert[]
): Promise<TemplateWithFields> {
  const db = requireSupabase();
  const { data: u } = await db.auth.getUser();
  const user_id = u.user?.id;
  if (!user_id) throw new Error("Not signed in.");

  const { data: tpl, error } = await db
    .from("template")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;

  const inserted = await replaceFields(tpl.id, fields);
  return { ...(tpl as TemplateRow), fields: inserted };
}

export async function updateTemplate(
  id: string,
  patch: Partial<TemplateInsert>,
  fields: TemplateFieldInsert[]
): Promise<TemplateWithFields> {
  const db = requireSupabase();
  const { data: tpl, error } = await db
    .from("template")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  const inserted = await replaceFields(id, fields);
  return { ...(tpl as TemplateRow), fields: inserted };
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("template").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Duplicate an existing template (and its fields) into a new draft. The
 * "Clone" operation from PRD §4.1 — a starting point for a variant.
 */
export async function cloneTemplate(id: string): Promise<TemplateWithFields> {
  const src = await getTemplate(id);
  if (!src) throw new Error("Template to clone not found.");
  const insert: TemplateInsert = {
    doc_type: src.doc_type,
    name: `${src.name} (copy)`,
    description: src.description,
    structure: src.structure,
    extra_context: src.extra_context,
  };
  const fields: TemplateFieldInsert[] = src.fields.map(
    ({ id: _id, template_id: _tid, created_at: _c, ...rest }) => rest
  );
  return createTemplate(insert, fields);
}

// ----- Fields -------------------------------------------------------------
// Strategy: delete all fields for the template, then insert the supplied
// list. Field rows don't have stable client-side identity beyond their
// position, and nothing (yet) holds references to field ids — document
// field_values keys are *labels*. If references appear later (history,
// audit), switch this to a diff-based update.

async function replaceFields(
  template_id: string,
  fields: TemplateFieldInsert[]
): Promise<TemplateFieldRow[]> {
  const db = requireSupabase();
  const del = await db.from("template_field").delete().eq("template_id", template_id);
  if (del.error) throw del.error;
  if (fields.length === 0) return [];

  const rows = fields.map((f, i) => ({
    ...f,
    template_id,
    ordinal: f.ordinal ?? i,
    // Normalise empties so the DB has nulls, not "".
    profile_key: f.profile_key || null,
  }));
  const { data, error } = await db
    .from("template_field")
    .insert(rows)
    .select();
  if (error) throw error;
  return [...(data ?? [])].sort((a, b) => a.ordinal - b.ordinal);
}
