# Pattang

A web workspace for solo advocates practising in India.

Pattang helps an advocate:

- Generate recurring legal documents (petitions, appeals, legal notices) from
  reusable, learnable templates whose structure is fixed but whose content
  varies by case.
- Keep every document, fact, party and deadline for a case together, so
  context accumulates as the matter progresses.
- Author and edit documents as Google Docs in the advocate's own Drive —
  printing and export handled by Google natively.
- Search statutes and case law on demand from a licensed legal database
  (Indian Kanoon).
- Maintain a separate research workspace not tied to any single document.
- See upcoming hearings and deadlines in a calendar populated from the
  advocate's cause-list / case data.

v1 targets a single advocate; the data model is built multi-user-ready from
day one so adding more advocates later is additive, not a rewrite.

See [`docs/PRD.md`](docs/PRD.md) for the full product spec.

## Where we are

**Phase 0 — Foundations.** The scaffolding that everything later sits on:
the SPA shell, the data model, and the deploy pipeline.

| Tier | Theme | Status |
| ---- | ----- | ------ |
| Phase 0 | Foundations & spikes | **in progress** |
| Phase 1 (P1) | Templates + Google Docs document creation | not started |
| Phase 2 (P2) | Case History + Case Documents + pull-context | not started |
| Phase 3 (P3) | Indian Kanoon research + research workspace | not started |
| Phase 4 (P4) | Calendar + court-schedule sync | not started |

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS, with HashRouter
  so GitHub Pages doesn't need any server-side URL rewrites.
- **Database:** Supabase (Postgres + auth). Schema lives in
  [`supabase/migrations/`](supabase/migrations/). Every table has RLS on,
  scoped to `auth.uid()`.
- **Hosting (Phase 0):** GitHub Pages, deployed from `main` via
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- **Hosting (later phases):** a tiny backend will appear once we wire
  Google OAuth / Indian Kanoon / Claude — those keys cannot live in the
  browser. Cloudflare Workers is the working assumption. See PRD §7.2.

## Running locally

```sh
npm install
cp .env.example .env.local   # fill in Supabase values once you have a project
npm run dev                  # http://localhost:5173
```

`.env.local` is optional in Phase 0 — the app renders an empty-state shell
without a Supabase project.

### Useful scripts

```sh
npm run dev         # vite dev server
npm run build       # tsc -b && vite build (production bundle in dist/)
npm run preview     # serve dist/ locally
npm run typecheck   # tsc --noEmit
```

## Repo layout

```
.
├── docs/
│   └── PRD.md                  ← the spec we are building from
├── src/
│   ├── components/             ← Layout, PageHeader, EmptyState
│   ├── routes/                 ← Cases / Templates / Research / Calendar pages
│   ├── lib/
│   │   └── supabase.ts         ← typed client; null until env is set
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── README.md
│   └── migrations/
│       └── 0001_init.sql       ← §6 data model, RLS, indexes
├── .github/workflows/
│   └── deploy.yml              ← Pages deploy
├── vite.config.ts              ← base="/Pattang/" in production
├── tailwind.config.js
└── package.json
```

## GitHub Pages — what to do once

After the first push to `main`:

1. In the GitHub repo, go to **Settings → Pages**.
2. Set **Source = GitHub Actions** (not the legacy "Deploy from a branch").
3. (Optional) under **Settings → Secrets and variables → Actions → Variables**,
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so production builds
   talk to Supabase. The anon key is public-safe (RLS protects data); we
   still use *variables* not *secrets* so the build can read them.

The site will appear at `https://<your-github-username>.github.io/Pattang/`.

## Honest caveats

- **GitHub Pages is the right home for now**, but not forever. The moment
  Phase 1 needs Google OAuth, or Phase 3 needs Indian Kanoon, or any phase
  needs Claude, we need a server somewhere to hold those secrets. See
  PRD §7.2 and §8.
- **Templates and Case History rely on AI extraction**, which is wrong
  sometimes. The product design (per PRD §4.1, §4.3) always shows the
  extracted values for the advocate to confirm or correct — never as
  unverified ground truth.
- **Court formats vary state-to-state.** Templates are learned from the
  advocate's own samples; quality of the output is bounded by the quality
  of those samples.
