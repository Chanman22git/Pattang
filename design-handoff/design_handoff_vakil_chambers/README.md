# Handoff: Vakil Chambers — Pattang redesign

## Overview
This handoff documents a complete visual redesign of **Pattang** (a web workspace for solo Indian advocates) under a new design language called **Vakil Chambers**. Three screens are redesigned in this pass:

1. **Cases list** — the index of all matters on file
2. **Case detail** — the dossier hub (history + documents)
3. **Template detail** — the structure of a learnt document template

It also redefines the **universal chrome** (top bar, collapsible left navigation) used by every screen in the app.

## About the design files
The files in `prototype/` are **design references created as standalone HTML/JSX prototypes** running on inline React + Babel. They are not production code to copy directly. The task is to **recreate these designs in the actual Pattang codebase** at `Pattang/` — a Vite + React + TypeScript + Tailwind + Supabase app — using the codebase's existing patterns (React Router, the `Layout` component, page route files in `src/routes/`, etc.).

## Fidelity
**High-fidelity (hifi).** Pixel-perfect with final colors, typography, spacing, hover transitions, and interactions. Recreate the UI faithfully. Component structure and naming in the prototype may differ from the codebase's conventions — preserve the *visual* result and the *behavior*, not the file structure.

## Design system (Vakil Chambers)
The canonical spec lives in `DESIGN_SYSTEM.md`. Read it first. Summary:

### Color tokens
| Token | Hex | Use |
|---|---|---|
| Page bg | `#FFFFFF` | Page background |
| Foolscap cream | `#FAF8F3` | Cards, surfaces, elevated panels |
| Bar coat black | `#1A1F2E` | Headings, primary buttons, formal emphasis |
| Sindoor seal | `#4A1818` | Urgent flags, deadline warnings, hearing banner |
| Court lawn | `#2D4A3E` | Success, active/confirmed states |
| Ashoka brass | `#B8862F` | Accent, logo glyph, hover underlines, learning-input tag |
| Teak bench | `#5A3A1F` | Borders, dividers (used at low opacity for soft rules) |
| Ink wash | `#6B6358` | Body text |
| Twine binding | `#8B6F47` | Generic tags / file labels |
| Court fee stamp | `#A8956F` | Secondary tags, meta text, row hover tint (25%) |

Derived: `ruleSoft` is Teak bench at 18% opacity (`rgba(90,58,31,0.18)`), used for most card and row borders.

### Typography
- **Spectral** (serif) — `font-weight: 400/500/600`. Used for `<h1>`, `<h2>`, case captions, party names, dossier values, document titles, anatomy preview, and dossier list items. Always weight 500 for headings.
- **Inter** (sans) — `font-weight: 300–700`. The UI workhorse: body text, nav, buttons, labels, captions, overlines.
- **JetBrains Mono** — `font-weight: 400/500`. Case numbers, CNRs, dates, statute citations, pagination numbers, breadcrumb.

Load via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap
```

### Type scale
| Role | Size | Weight | Family | Line-height |
|---|---|---|---|---|
| Display / h1 | 32px | 500 | Spectral | 1.3 |
| Section h2 | 20px | 500 | Spectral | 1.3 |
| Card/group title | 16–17px | 500 | Spectral | 1.3–1.4 |
| Body | 15px | 400 | Inter | 1.6 |
| Small | 13–13.5px | 400 | Inter | 1.55 |
| Caption / overline | 10.5–11px, `letter-spacing: 0.08em–0.1em`, UPPERCASE | 500 | Inter | — |
| Case no. / mono meta | 11.5–13px | 400/500 | JetBrains Mono | — |

### Shape language
- Borders **0.5px–1px**, never thicker.
- Radii **2px** (cards, panels, buttons, inputs, tags). 0px for emblems, 4px max for modals.
- **No shadows. No gradients.** Elevation comes from surface contrast (`#FAF8F3` on `#FFFFFF`) and border weight.
- Dividers: Teak bench at 30% opacity for soft separators, full Teak bench at 0.5px for hard section breaks.

### The Hover Principle
At rest, the UI is quiet. On hover, the touched element **wakes up** — color saturates, contrast deepens. All transitions are ease-out:

| Element | Rest | Hover | Duration |
|---|---|---|---|
| Primary button | bg `#1A1F2E`, text `#FAF8F3` | bg shifts to Sindoor seal `#4A1818` | 180ms |
| Primary button (active) | — | bg `#1A1F2E` + 2px inset Ashoka brass border | — |
| Secondary button | 1px Teak border, transparent fill, Ink wash text | fill becomes Foolscap cream, border + text become Bar coat black | 150ms |
| Card | 0.5px Teak @ 30%, no accent | border full Teak; 2px Ashoka brass slides in on left edge | border 120ms, accent 200ms |
| Nav link | Ink wash, no underline | shifts to Bar coat black; thin 1px Ashoka brass underline appears | 100ms |
| Nav link (active) | full Bar coat black, persistent Ashoka brass left border | — | — |
| Tag/chip | Twine binding @ 20% bg, Twine binding text | full Twine binding bg, Foolscap cream text | 150ms |
| Brass tag | Ashoka brass @ tint, brass text | full brass bg, cream text | 150ms |
| Seal tag | Sindoor seal @ tint, seal text | full seal bg, cream text | 150ms |
| Urgent indicator | Sindoor seal @ 70%, cream text | full Sindoor seal, 1px brass outline | 150ms |
| Table row | white | Court fee stamp @ 15–25% tint | 100ms |

**Never** use bounce, spring, or elastic easing.

The prototype implements these via a global `<style>` block injected from `prototype/chamber.jsx`. Read the `VC_CSS` constant in that file for the exact class definitions (`.vc-btn-primary`, `.vc-btn-secondary`, `.vc-tag`, `.vc-tag-brass`, `.vc-tag-seal`, `.vc-tag-lawn`, `.vc-card`, `.vc-row`, `.vc-nav-link`, `.vc-input`, `.vc-iconbtn`, `.vc-link`) — port these into `src/index.css` or build matching Tailwind utility classes.

### Layout
- 8px baseline grid.
- 12-column page grid, 24px gutters.
- Max content width: **1240px** dashboards, **720px** reading views.
- Generous whitespace.

## Screens

### Universal chrome (Layout)

Replaces `src/components/Layout.tsx`.

**Top bar** (`height: 64px`, white bg, 0.5px Teak @ 18% bottom border, sticky)
- **Left zone:** hamburger toggle (3 staggered bars, 1.5px stroke; bars are 16px/12px/16px when nav open, swap on close) · **Pattang** wordmark in Spectral 26px/500 with a brass `।` (Devanagari purnaviram) flourish · the overline "Advocate's briefcase" in Inter 10.5px/500, letter-spacing 0.12em, uppercase, Court fee stamp `#A8956F`.
- **Middle zone:** breadcrumb in JetBrains Mono 12px, Court fee stamp color, e.g. `Cases · Plaintiff A v. KIADB & Anr.`
- **Right zone:** search input (280px wide, placeholder `Find a case, template or citation`, `.vc-input` styling) and a `⌘K` keycap (mono 11px, 0.5px border, Foolscap cream bg).

**Left sidebar** (collapsible, 220px expanded → 56px collapsed; transitions on width 180ms ease, padding 180ms ease)
- White bg, 0.5px Teak @ 18% right border. Absolute-positioned beneath the top bar.
- Nav items: **Cases (17)**, **Templates (8)**, **Translate (Soon)**, **Research (Soon)**, **Calendar (Soon)**.
- Each item is a `.vc-nav-link`: 14px Inter, 9px vertical padding, 12px left padding, 2px transparent left border at rest. Active state: weight 500, Bar coat black text, Foolscap cream bg, **2px Ashoka brass** left border. Soon state: Court fee stamp text, a small "Soon" overline on the right.
- Counts are JetBrains Mono 11.5px, right-aligned; brass tinted when item is active.
- **Footer** (only when expanded): "Counsel C" in Inter 13/500, then "KAR/1234/2009" in JetBrains Mono 11/Court fee stamp.
- **Collapsed mode:** each item becomes a 36×36 square showing only the first letter in Spectral 17. Active item keeps Foolscap cream bg + 2px brass left border.

The toggle button persists collapse state to a single `useState` on the shell; in the real codebase persist to localStorage or context.

### Screen 1 — Cases list

Replaces `src/routes/CasesPage.tsx`.

**Layout:** vertical stack inside the main column, max-width 1240px.

1. **Header block (~28px bottom margin)**
   - Overline `Cause list · 28 May 2026` (Inter 11/500, 0.08em tracking, uppercase, Court fee stamp).
   - **h1 "Cases"** — Spectral 32/500, Bar coat black, line-height 1.3.
   - Description paragraph (Inter 15/400, Ink wash, max-width 620px): *"Every matter on your file, ordered by next hearing. Each row drills into its dossier — parties, history, documents and the next thing to prepare."*
   - Counts strip (JetBrains Mono 12, 18px gaps): `17 matters · 14 active · 1 on hold · 2 closed`. Numbers tinted per status — total in Bar coat black, active in Court lawn, on hold in Twine binding, closed in Court fee stamp.
   - Action buttons (top-right of the row): `Import cause-list` (.vc-btn-secondary) + `New case` (.vc-btn-primary).

2. **Filters bar (sticky-style, 0.5px Teak top + Teak @ 18% bottom, 12px padding)**
   - Segmented chips: `All (17)`, `Active`, `On hold`, `Closed`. Active chip = Bar coat black bg + cream text + 1px Bar coat black border. Inactive chips = transparent + Ink wash text. 13px Inter 500, count in mono.
   - Right side: `Sort` label (uppercase overline), `Next hearing ↓` active link (.vc-link, Bar coat black), then `Group by court` and `Filter…` input (160px, smaller `.vc-input` variant).

3. **Cases table** — a card-style container (`background: #FAF8F3, border: 0.5px solid ruleSoft, radius: 2px`)
   - **Column header row:** uppercase overlines `Matter` / `Forum` / `Next hearing` / (empty). Grid: `1fr 200px 150px 30px`, 22px horizontal padding, 11px borderBottom.
   - **Rows** (`.vc-row` for the hover snap). Each row is grid `1fr 200px 150px 30px`, 20px vertical / 22px horizontal padding.
   - **Pinned/Next-up row** (currently the first): adds a 2px Ashoka brass left border, subtle brass bg tint `rgba(184,134,47,0.07)`.
   - **Matter cell (top to bottom):**
     - Meta row (8px gap, 8px below): type tag (`.vc-tag`, e.g. "Writ Petition"), stage in italic Inter 11.5/Ink wash, "Next up" tag (`.vc-tag-seal`, with a tiny 5px dot of `currentColor`) if pinned, "N facts to confirm" tag (`.vc-tag-brass`) if `unconfirmed > 0`.
     - Case caption — Spectral 22/500, line-height 1.3, with the **"v."** in italic Ink wash 400.
     - Gist (1–2 lines) — Inter 13.5/Ink wash, line-height 1.6, max-width 720px, 6px below.
     - Meta row — JetBrains Mono 11.5/Court fee stamp, 0.02em tracking: case no. · CNR · then in Inter `· N docs · M facts`.
   - **Forum cell:** Spectral 15.5/500 Bar coat black ("Karnataka HC"), then 12px Ink wash bench ("Bengaluru"). Top-padded 28px to align with caption.
   - **Next hearing cell:** mono 13/500 Bar coat black date, italic 12/Ink wash relative phrase below.
   - **Chevron cell:** Spectral 18/Court fee stamp `›`, right-aligned.
   - Closed cases use Court fee stamp for ink and ink2.

4. **Pagination footer** (inside the table card, 0.5px Teak @ 18% top border, 12/22px padding)
   - Left: `Showing 1–6 of 17` (JetBrains Mono 11.5, Court fee stamp; the numbers in Bar coat black).
   - Right: `‹ Prev`, page number buttons (active = Bar coat black bg + cream text, others = Foolscap cream + 1px Teak @ 18% border), `Next ›`. All 12.5px mono, 30px min-width, 2px radius.
   - 6 cases per page, currently 17 cases → 3 pages.

**Mock data shape:** see `prototype/mockdata.jsx`, `MOCK_CASES`. Each row needs `parties.{p,r}`, `gist`, `court`, `bench`, `caseNo`, `cnr`, `type`, `stage`, `next`, `nextRel`, `status` (`active`/`on_hold`/`closed`), `docs`, `facts`, `unconfirmed`, optional `pinned: true`. In the codebase, derive these from the Supabase `cases` and `documents` tables (`Pattang/src/lib/cases.ts`).

### Screen 2 — Case Detail

Replaces `src/routes/CaseDetailPage.tsx`.

**Layout:** the main column is split `1fr 320px` with a 48px gap. Left = primary content. Right = sticky dossier rail.

1. **Caption header (no card, just type on bg)**
   - Overline `In the High Court of Karnataka · at Bengaluru`.
   - Mono row: `W.P. No. 23456/2024 · CNR KAHC010012342024 · WRIT PETITION (ART. 226)` (the last segment is sans-uppercase 10.5px).
   - **h1 case title** — Spectral 32/500, line-height 1.3, max-width 820px. The **v.** is italic Ink wash 400, and ` & Anr.` is in Court fee stamp.
   - Status strip: `.vc-tag-lawn` "Active · part-heard" with a 5px dot, then mono "Filed 14 March 2024", then "5 documents".

2. **Hearing banner (urgent strip, 40px below)**
   - `background: #FAF8F3, border: 0.5px solid Sindoor seal, border-left: 2px solid Sindoor seal, padding: 16/20, radius: 2`.
   - Overline `Next hearing — in 5 days` (Sindoor seal, uppercase 11/500).
   - Spectral 22/500 date.
   - Italic Ink wash 13: `Listed for orders · Hon'ble Mr. Justice S.K., Single Bench`.

3. **Case history section (collapsible, default collapsed)**
   - Header is a click target with a `›` chevron (rotates 90° when open, 120ms ease).
   - When collapsed: a Foolscap cream card showing two columns — **Last event** (mono date + Spectral 15.5 label) and **Next event** (date + label in Sindoor seal). Plus a `Refresh from documents` secondary button on the right of the header.
   - When expanded: a vertical timeline with a 0.5px Teak @ 40% vertical rule.
   - Each event row is a 3-col grid `90px 18px 1fr`. Mono date on the left (Sindoor seal if upcoming, weight 500). Square 9×9 marker (filled black for hearings, filled Sindoor seal for upcoming, hollow for filings, all with a 1px border matching the bg/seal). Spectral 15.5 label on the right. If `event.doc` is present, show a `.vc-link` to the doc beneath the label.
   - Upcoming events get a `synced from cause-list (manual)` italic caption.

4. **Documents section**
   - Section head (`Documents` h2 + sub + `New document` primary button on right). Bottom border is 0.5px solid Teak.
   - Card container (`#FAF8F3`, 0.5px ruleSoft, radius 2), grid `1fr 180px 80px 90px`, header row uppercase overlines.
   - Each row (`.vc-row`): a 2px-radius mono `DOC` chip with a 0.5px ruleSoft border, Spectral 15.5/500 doc title, Inter 12.5 template name, Mono pages count, Mono date.

5. **Dossier sidebar** (`.position: sticky, top: 40px`, 0.5px ruleSoft left border, 24px left padding)
   - Overline `Dossier`.
   - Block headers (`Parties`, `Reliefs sought`, `Key facts`, `At a glance`) are Inter 10/600/0.1em uppercase, in Bar coat black. Each block has a 0.5px dashed Teak @ 18% bottom rule + 28px margin / 24px padding-bottom.
   - **Parties:** each party = role overline (Court fee stamp 10/0.08em uppercase) → Spectral 17/500 name → italic 12 caption (e.g. "through Chief Secretary").
   - **Reliefs:** body Spectral 14/400 paragraph, line-height 1.6.
   - **Key facts:** caption header right side `3/5 confirmed` in mono. Then a vertical stack of facts, each with a 2px left border — full Court lawn if confirmed, dashed Sindoor seal if not. Inside: Spectral 13.5 fact text, mono 11 source. Unconfirmed entries get a ` · confirm` suffix in Sindoor seal.
   - **At a glance:** key/value rows (Court fee stamp label / Bar coat black value), monospaced for case no., CNR.

### Screen 3 — Template Detail

Replaces `src/routes/TemplateDetailPage.tsx`.

**Layout:** same `1fr 320px` split as Case Detail.

1. **Template head**
   - Overline `Template · writ_petition · v3`.
   - **h1 template name** (Spectral 32/500).
   - Description paragraph (Inter 15/Ink wash, max-width 640).
   - Metrics row (0.5px ruleSoft top border, 22px padding-top): three `Metric` blocks — uppercase overline + Spectral 28/500 number ("14", "9") or "small" Spectral 22 ("12 days ago"). Action buttons aligned to the right: `Clone`, `Suggest edits` (both .vc-btn-secondary), `Use this template` (.vc-btn-primary).

2. **Field groups section**
   - Section head `The form this template asks` + sub `Three groups, set at creation. Editable per template.`
   - 2-col grid of `FieldGroupCard`s for **Basic** (dot in Ashoka brass) and **Standard / prefilled** (dot in Court lawn). Card is Foolscap cream + 0.5px ruleSoft + 18/20 padding. Header has a 6×6 square dot + Spectral 16/500 label + mono `N fields` count on the right. Italic sub caption. Then a list of fields — each row has its label in Bar coat black, italic Spectral 12 value if `value` is present, and a mono uppercase type tag aligned to top-right (`TEXT`, `TEXTAREA`, `REPEATABLE`, `DATE`).
   - Below: `CaseSpecificCard` (full-width, `bgDeep #FAF8F3` background, 0.5px ruleSoft). Header has a Sindoor seal dot + Spectral 16/500 "Case-specific · Grounds and prayer", a body description, and an inset placeholder card (260px, dashed Teak border) with the line *"Free-text area · accepts long prose · pulled context from prior documents in the case…"*.

3. **References section** (`What this template refers to`)
   - List items — each is a `.vc-row` with a leading tag — `Learning input` uses `.vc-tag-brass`, `Standing ref.` uses `.vc-tag-lawn`. Then Spectral 16/500 title and italic Inter 13 note. Trailing `↗` glyph.

4. **Linked documents** (`Documents from this template`)
   - Long list, each row grid `1fr auto`: title is a `.vc-link` styled as Spectral 15/500, then italic `— in {case name}`. Date is mono 11.5 / Court fee stamp on the right.

5. **Right rail**
   - `Anatomy of a document` — a stylized petition preview inside a Foolscap cream card. Center-aligned overline `IN THE HIGH COURT OF KARNATAKA`, mono case-no placeholder, dividers in Teak @ 50% opacity, three brass-tinted blocks for Petitioner / Petitioner address / Respondent(s), a center italic `versus`, then a "Grounds & prayer" label and a dashed-border placeholder for free text. Caption underneath: *"Shaded blocks come from the form. The dashed area is yours to draft, case by case."*
   - `Template history` — version log list, each entry = mono date + Spectral 13.5 label.
   - `Editable operations` — bulleted list of operations in Spectral 13.5 (`Add additional details`, `Refer to a new document`, `Suggest edits with AI`, `Clone as variant`), each a hoverable `.vc-row`.

## Interactions & behavior

- **Sidebar toggle:** click the hamburger to collapse the sidebar to 56px (icon-only first-letter rail). Main content shifts left smoothly (`margin-left` transition 180ms). Persist state to localStorage.
- **Filter chips (Cases list):** click sets the active chip; the rows update accordingly. Use the `status` field.
- **Pagination:** Prev / Next buttons disable at the ends. Direct page-number click jumps. 6 per page.
- **Row hover:** subtle Court fee stamp tint, 100ms ease-out. Whole row is the click target → `/cases/:id`.
- **Case history collapse/expand:** default collapsed; click the header (or chevron) to toggle. Refresh button is only shown while collapsed (header utility).
- **Hover on buttons / tags / nav / cards / inputs:** strictly follow the Hover Principle above. Timings: 100–150ms for utility, 180ms for buttons, 200ms for card accents.
- **Selection color:** `::selection` is `accentSoft` (`#EDDFBE`) bg, Bar coat black text.

## State management

- Sidebar collapsed/open — global UI state, localStorage-backed.
- Filter chip + sort selection — URL params on `/cases` so the state is shareable.
- Pagination current page — URL param (`?page=2`).
- Case history collapse — local to the page (default closed).

Data hooks already exist in `Pattang/src/lib/cases.ts`, `templates.ts`, `documents.ts`. Extend the case row return type with the new `gist`, `unconfirmed`, `stage`, `nextRel` fields if they aren't there yet — they're shown on the Cases list. `nextRel` ("in 5 days", "next month") should be derived in JS from `next` on render, not stored.

## Assets
- No images or icons are required for this pass. The hamburger toggle is drawn with `<span>` bars. The `›` chevrons are typed glyphs.
- **Fonts:** Spectral, Inter, JetBrains Mono — load via Google Fonts CSS link, or self-host.
- One Devanagari glyph: `।` (purnaviram, U+0964) used as a brass flourish next to the Pattang wordmark in the top bar.

## Integration notes for the Pattang codebase

The target codebase is at `Pattang/` (Vite + React 18 + TypeScript + Tailwind + Supabase). The right way to apply this design:

1. **Tokens** — add Vakil Chambers colors to `Pattang/tailwind.config.js` under `theme.extend.colors`:
   ```js
   colors: {
     ink: { DEFAULT: '#1A1F2E', 2: '#6B6358', 3: '#A8956F' },
     paper: '#FFFFFF',
     foolscap: '#FAF8F3',
     teak: '#5A3A1F',
     brass: '#B8862F',
     seal: '#4A1818',
     lawn: '#2D4A3E',
     twine: '#8B6F47',
   },
   borderRadius: { sm: '2px', DEFAULT: '2px', lg: '4px' },
   ```

2. **Fonts** — add the Google Fonts link to `Pattang/index.html` and extend `theme.fontFamily` with `serif: ['Spectral', 'Source Serif 4', 'Georgia']`, `sans: ['Inter', 'system-ui']`, `mono: ['JetBrains Mono', 'ui-monospace']`.

3. **Global hover utilities** — port the contents of the `VC_CSS` constant in `prototype/chamber.jsx` into `Pattang/src/index.css` (under `@layer components`) so the `.vc-*` classes work app-wide. Alternatively, build matching small components — but the global-CSS approach is simpler given how many places use these classes.

4. **Layout component** — rewrite `Pattang/src/components/Layout.tsx` to match the prototype's `ChamberShell` + `ChamberTopbar` + `ChamberSidebar`. Keep the React Router `<Outlet />` inside the main column. The collapse state should live in a `useState` (persisted to localStorage). Active nav state derives from `useLocation`.

5. **Per-route rewrites:**
   - `src/routes/CasesPage.tsx` ← prototype `ChamberCasesList` (and its sub-components in `prototype/chamber-cases.jsx`).
   - `src/routes/CaseDetailPage.tsx` ← prototype `ChamberCaseDetail` + `ChamberHearingBanner` + `ChamberTimeline` + `ChamberDocuments` + `ChamberDossier` (across `chamber-case.jsx`, `chamber-case-2.jsx`, `chamber-dossier.jsx`).
   - `src/routes/TemplateDetailPage.tsx` ← prototype `ChamberTemplateDetail` + sub-components in `chamber-template.jsx` and `chamber-template-2.jsx`.

6. **Replace `PageHeader.tsx`** — the prototype has section-specific headers (each screen owns its own heading layout). The current shared `PageHeader` is now redundant for the redesigned screens.

7. **Update `EmptyState.tsx`** to match the cream-on-white / dashed-Teak-border vocabulary.

8. **Out of scope for this pass** — Templates list (`TemplatesPage.tsx`), New Document flow (`NewDocumentPage.tsx`), Calendar, Research, Translate, Onboarding, Sign In. These remain on the old Phase 0 styling for now; redesign them in a follow-up but ensure the new global chrome (Layout) wraps them so they sit inside the new top bar + sidebar.

## Files in this bundle

```
design_handoff_vakil_chambers/
├── README.md                    ← you are here
├── DESIGN_SYSTEM.md             ← canonical Vakil Chambers spec
└── prototype/
    ├── index.html               ← entry: loads Google Fonts + React + Babel + all jsx
    ├── app.jsx                  ← canvas wrapper with three artboards + tweaks panel
    ├── chamber.jsx              ← tokens, VC_CSS, Shell / Topbar / Sidebar
    ├── chamber-cases.jsx        ← Cases list (hero, filters, table, pagination)
    ├── chamber-case.jsx         ← Case detail caption + hearing banner
    ├── chamber-case-2.jsx       ← Case detail timeline + documents + section heads
    ├── chamber-dossier.jsx      ← Case detail right sidebar
    ├── chamber-template.jsx     ← Template detail head + field groups
    ├── chamber-template-2.jsx   ← Template detail references + linked docs + rail
    ├── mockdata.jsx             ← MOCK_CASE, MOCK_TEMPLATE, MOCK_CASES
    ├── design-canvas.jsx        ← starter component: the canvas wrapper (not needed in app)
    └── tweaks-panel.jsx         ← starter component: tweaks UI (not needed in app)
```

To preview the prototype standalone: `cd prototype/ && python3 -m http.server` then open `http://localhost:8000/`.

The `design-canvas.jsx` and `tweaks-panel.jsx` files are scaffolding for presenting variations side-by-side during design — they should NOT be ported into the production app. Only the `chamber-*.jsx` files and the design system are deliverables.
