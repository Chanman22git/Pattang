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

/**
 * The view-model the Cases list renders against. Some fields are derived
 * at fetch time (docs / facts / unconfirmed counts), some are derived at
 * render time (parties, nextRel) since they depend on `title` and `notes`
 * and on the wall clock respectively. We build this once in the data
 * layer so the page component stays presentation-only.
 */
export interface CaseRowEnriched extends CaseRow {
  /** Derived from `cases.title` — splits on " v. " (case-insensitive) when present. */
  parties: { p: string; r: string };
  /** Currently equal to `notes` until we have a richer summary field. */
  gist: string | null;
  /** Free-form stage label (e.g. "Arguments part-heard"). Pulled from
   *  notes for now; will move to a dedicated column later. */
  stage: string | null;
  /** Next hearing date (ISO) — null until calendar wiring lands in P4. */
  next: string | null;
  /** Aggregate counts — joined from related tables. */
  docs: number;
  facts: number;
  unconfirmed: number;
  /** Soft "pin to top" for the case the advocate cares about most.
   *  Until we have an explicit column, we treat the most recently
   *  updated active case as the pinned one. */
  pinned: boolean;
}

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
