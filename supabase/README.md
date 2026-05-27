# Supabase

This directory holds Pattang's database migrations and (later) edge function code.

## Phase 0 status

- `migrations/0001_init.sql` defines the §6 data model from `docs/PRD.md`.
- Every table carries `user_id` and has RLS enabled with a self-owned policy,
  so the schema is already multi-user-ready (PRD §1.0, §6, §10).
- The app's `src/lib/supabase.ts` is wired to read
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`. Until
  those are set, the client is null and pages render in their empty state.

## To apply when you spin up the project

```sh
# Option A — Supabase CLI (recommended, gives versioned migrations):
supabase login
supabase link --project-ref <your-ref>
supabase db push

# Option B — paste the SQL into the Supabase dashboard SQL editor.
```

After that, copy the project URL and `anon` key into `.env.local` (see
`.env.example` at the repo root) and `npm run dev` will start talking to it.

## Why a backend appears later

Phase 0 + early Phase 1 run fine against Supabase from the browser — the
anon key is meant to be public and RLS is the real protection. The moment we
need to call **Google APIs**, **Indian Kanoon**, or **Claude**, we need a
server-side surface (Cloudflare Worker / Supabase Edge Function / Vercel
function) to hold those secrets. See PRD §7.2 and §8.
