-- Pattang — Phase 0 initial schema
--
-- Maps to §6 of docs/PRD.md. Every business table carries user_id from day one
-- so a future move to multi-user is additive, not a rewrite (§1, §6, §10).
--
-- Conventions:
--   * UUIDs everywhere; gen_random_uuid() from pgcrypto.
--   * timestamptz for all time fields; updated_at via trigger.
--   * Soft references to auth.users via user_id (Supabase auth provides it).
--   * Row-Level Security ON for every table; policies enforce per-user access.
--   * jsonb for free-form structure (template structure, field values, profile).
--   * Enums kept narrow and only where the set is genuinely closed.

create extension if not exists "pgcrypto";

-- ---------- enums ----------------------------------------------------------

create type document_status as enum ('draft', 'finalized', 'archived');
create type case_status     as enum ('active', 'closed', 'on_hold');
create type template_field_category as enum ('basic', 'prefill', 'case_specific');
create type template_reference_role as enum ('learning_input', 'standing_reference');
create type case_fact_kind  as enum ('party', 'date', 'fact');
create type calendar_source as enum ('manual', 'import', 'ecourts_api');
create type research_item_type as enum ('note', 'clip', 'search', 'citation_collection');

-- ---------- updated_at trigger --------------------------------------------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- profile (one-per-auth-user) -----------------------------------
-- Supabase ships an auth.users table. We don't recreate it; we hang our own
-- per-user data off it. profile holds the advocate's prefill defaults
-- (advocate name, address, default court, Google OAuth tokens later).

create table profile (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  advocate_name text,
  address     text,
  default_court text,
  prefs       jsonb not null default '{}'::jsonb,
  -- Google OAuth tokens land here in Phase 1. Encrypted at rest (pgsodium)
  -- when we wire that up; left null for now.
  google_tokens jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profile_set_updated_at before update on profile
  for each row execute function set_updated_at();

-- ---------- case ----------------------------------------------------------

create table cases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  court       text,
  case_no     text,           -- court case number
  cnr         text,           -- CNR (Case Number Record) — eCourts identifier
  type        text,           -- e.g. civil / criminal / writ / appeal
  status      case_status not null default 'active',
  drive_folder_id text,       -- Google Drive folder for this case's docs
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index cases_user_id_idx on cases(user_id);
create index cases_cnr_idx     on cases(cnr) where cnr is not null;
create trigger cases_set_updated_at before update on cases
  for each row execute function set_updated_at();

-- ---------- template ------------------------------------------------------
-- Generic, managed object. There is no per-case template instance — the
-- case-specific substance is supplied at document-creation time (§4.1).

create table template (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  doc_type     text not null,                       -- e.g. 'legal_notice'
  name         text not null,
  description  text,
  structure    jsonb not null default '{}'::jsonb,  -- learned structure
  extra_context text,                               -- "additional details"
  version      int not null default 1,
  -- denormalised for the templates index screen (§4.1):
  linked_doc_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index template_user_id_idx on template(user_id);
create trigger template_set_updated_at before update on template
  for each row execute function set_updated_at();

-- ---------- template_field ------------------------------------------------
-- Field definitions, categorised at template creation (§4.1).

create table template_field (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references template(id) on delete cascade,
  label       text not null,
  category    template_field_category not null,
  input_type  text not null default 'text',  -- text | textarea | date | number
  profile_key text,                          -- prefill: which profile field to default from
  ordinal     int not null default 0,
  created_at  timestamptz not null default now()
);
create index template_field_template_idx on template_field(template_id);

-- ---------- template_reference --------------------------------------------
-- Documents a template refers to (§4.1):
--   learning_input    → re-learns / refines structure
--   standing_reference → carried as context, doesn't change structure

create table template_reference (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references template(id) on delete cascade,
  -- Either a pointer to an in-system document, OR a free-form url. One of them.
  ref_doc_id   uuid,    -- FK added after document table exists (see below)
  ref_url      text,
  role         template_reference_role not null,
  note         text,
  created_at   timestamptz not null default now(),
  check (ref_doc_id is not null or ref_url is not null)
);
create index template_reference_template_idx on template_reference(template_id);

-- ---------- document ------------------------------------------------------
-- Content lives in the Google Doc; we store the link + metadata + the field
-- values the advocate supplied at creation time (§4.2).

create table document (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  case_id      uuid not null references cases(id) on delete cascade,
  template_id  uuid references template(id) on delete set null,
  title        text not null,
  gdoc_id      text,
  gdoc_url     text,
  status       document_status not null default 'draft',
  field_values jsonb not null default '{}'::jsonb,  -- submitted form values
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index document_user_id_idx     on document(user_id);
create index document_case_id_idx     on document(case_id);
create index document_template_id_idx on document(template_id);
create trigger document_set_updated_at before update on document
  for each row execute function set_updated_at();

-- now we can wire template_reference.ref_doc_id → document.id
alter table template_reference
  add constraint template_reference_ref_doc_fk
  foreign key (ref_doc_id) references document(id) on delete set null;

-- ---------- case_fact -----------------------------------------------------
-- Powers Case History (§4.3). AI-extracted, user-confirmed.

create table case_fact (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  case_id       uuid not null references cases(id) on delete cascade,
  kind          case_fact_kind not null,
  value         text not null,
  source_doc_id uuid references document(id) on delete set null,
  confirmed     boolean not null default false,
  extracted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index case_fact_case_id_idx on case_fact(case_id);
create trigger case_fact_set_updated_at before update on case_fact
  for each row execute function set_updated_at();

-- ---------- citation ------------------------------------------------------
-- From Indian Kanoon (P3). Attachable to a case or a document.

create table citation (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  case_id     uuid references cases(id) on delete cascade,
  document_id uuid references document(id) on delete cascade,
  source      text not null,            -- e.g. 'indian_kanoon'
  ext_ref     text not null,            -- vendor's id / url
  title       text,
  snippet     text,
  created_at  timestamptz not null default now()
);
create index citation_user_id_idx     on citation(user_id);
create index citation_case_id_idx     on citation(case_id);
create index citation_document_id_idx on citation(document_id);

-- ---------- research_item -------------------------------------------------
-- Standalone research space (P3). Optionally linked to a case.

create table research_item (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  case_id    uuid references cases(id) on delete set null,
  type       research_item_type not null,
  title      text,
  content    text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_item_user_id_idx on research_item(user_id);
create trigger research_item_set_updated_at before update on research_item
  for each row execute function set_updated_at();

-- ---------- calendar_event ------------------------------------------------
-- P4. Source = manual | import | ecourts_api.

create table calendar_event (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  case_id    uuid references cases(id) on delete set null,
  title      text not null,
  datetime   timestamptz not null,
  end_datetime timestamptz,
  location   text,
  source     calendar_source not null default 'manual',
  external_ref text,                  -- e.g. eCourts hearing id, for dedupe on resync
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calendar_event_user_id_idx on calendar_event(user_id);
create index calendar_event_datetime_idx on calendar_event(datetime);
create trigger calendar_event_set_updated_at before update on calendar_event
  for each row execute function set_updated_at();

-- ---------- row-level security -------------------------------------------
-- Everything is owned by user_id. RLS denies cross-user access at the
-- database boundary even if the client is compromised.

alter table profile           enable row level security;
alter table cases             enable row level security;
alter table template          enable row level security;
alter table template_field    enable row level security;
alter table template_reference enable row level security;
alter table document          enable row level security;
alter table case_fact         enable row level security;
alter table citation          enable row level security;
alter table research_item     enable row level security;
alter table calendar_event    enable row level security;

-- Helper: most tables follow the same "owned by auth.uid()" pattern.

create policy profile_self on profile
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cases_self on cases
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy template_self on template
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- template_field doesn't have user_id directly; reach through template.
create policy template_field_self on template_field
  using (exists (
    select 1 from template t
    where t.id = template_field.template_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from template t
    where t.id = template_field.template_id and t.user_id = auth.uid()
  ));

create policy template_reference_self on template_reference
  using (exists (
    select 1 from template t
    where t.id = template_reference.template_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from template t
    where t.id = template_reference.template_id and t.user_id = auth.uid()
  ));

create policy document_self on document
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy case_fact_self on case_fact
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy citation_self on citation
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy research_item_self on research_item
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy calendar_event_self on calendar_event
  using (user_id = auth.uid()) with check (user_id = auth.uid());
