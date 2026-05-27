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
