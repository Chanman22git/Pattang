// Shared row types. Hand-written for now; once the schema settles we can
// generate these with `supabase gen types typescript`.

export type CaseStatus = "active" | "closed" | "on_hold";

export interface CaseRow {
  id: string;
  user_id: string;
  title: string;
  court: string | null;
  case_no: string | null;
  cnr: string | null;
  type: string | null;
  status: CaseStatus;
  drive_folder_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CaseInsert = Omit<
  CaseRow,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface ProfileRow {
  user_id: string;
  name: string | null;
  email: string | null;
  advocate_name: string | null;
  address: string | null;
  default_court: string | null;
  prefs: Record<string, unknown>;
  google_tokens: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Subset of profile that's eligible as a prefill source.
export const PROFILE_PREFILL_KEYS = [
  "advocate_name",
  "address",
  "default_court",
  "name",
  "email",
] as const;
export type ProfilePrefillKey = (typeof PROFILE_PREFILL_KEYS)[number];

// ---------- Template -------------------------------------------------------

export type TemplateFieldCategory = "basic" | "prefill" | "case_specific";
export type TemplateFieldInputType =
  | "text"
  | "textarea"
  | "date"
  | "number";

export interface TemplateFieldRow {
  id: string;
  template_id: string;
  label: string;
  category: TemplateFieldCategory;
  input_type: TemplateFieldInputType;
  profile_key: string | null;
  ordinal: number;
  created_at: string;
}

// Insert shape — id, template_id, created_at filled by the API/DB.
export type TemplateFieldInsert = Omit<
  TemplateFieldRow,
  "id" | "template_id" | "created_at"
>;

/**
 * The "structure" jsonb is intentionally loose — Phase 1a stores the template
 * body as plain text under `body`; Phase 1b can layer AI-detected structure
 * (sections, anchors) alongside without a migration.
 */
export interface TemplateStructure {
  body?: string;
  // future: sections, anchors, layout hints from AI learning
  [key: string]: unknown;
}

export interface TemplateRow {
  id: string;
  user_id: string;
  doc_type: string;
  name: string;
  description: string | null;
  structure: TemplateStructure;
  extra_context: string | null;
  version: number;
  linked_doc_count: number;
  created_at: string;
  updated_at: string;
}

export type TemplateInsert = Omit<
  TemplateRow,
  | "id"
  | "user_id"
  | "version"
  | "linked_doc_count"
  | "created_at"
  | "updated_at"
>;

/** A template plus its ordered fields — what the editor and document-creation
 *  forms both consume. */
export interface TemplateWithFields extends TemplateRow {
  fields: TemplateFieldRow[];
}

// ---------- Document ------------------------------------------------------

export type DocumentStatus = "draft" | "finalized" | "archived";

/** What the form submits and what we serialise into document.field_values.
 *  Keyed by *label* (not field id) so a template can rename fields without
 *  breaking older docs. */
export type FieldValues = Record<string, string>;

export interface DocumentRow {
  id: string;
  user_id: string;
  case_id: string;
  template_id: string | null;
  title: string;
  gdoc_id: string | null;
  gdoc_url: string | null;
  status: DocumentStatus;
  field_values: FieldValues;
  created_at: string;
  updated_at: string;
}

export type DocumentInsert = Omit<
  DocumentRow,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/** A document row joined with its (optional) template name + the case
 *  title. Used by the linked-documents index on templates (PRD §4.1) and
 *  the case documents list. */
export interface DocumentWithLinks extends DocumentRow {
  template_name: string | null;
  case_title: string;
}
