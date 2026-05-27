**Product Requirements Document**

Advocate Workspace Portal

*Document drafting, case context, legal research & court calendar ---
for solo advocates (India)*

**Version:** 0.1 (Draft for review)

**Status:** Scoping --- assumptions pending confirmation

**Date:** 26 May 2026

Contents

1\. Summary

This document specifies a web-based portal for individual advocates
practising in India. The portal helps an advocate (a) generate recurring
legal documents --- petitions, appeals, legal notices and similar ---
from reusable templates whose structure is fixed but whose content
varies by case; (b) keep every document, fact and detail for a case
together so that case context accumulates over time; (c) create and edit
those documents as Google Docs in the advocate\'s own Google Drive, with
native printing and export; (d) surface relevant statutes and case law
on demand from a licensed legal database; (e) maintain a dedicated
research workspace; and (f) view a court calendar populated from the
advocate\'s cause-list / case data.

The first release targets a single advocate (no shared accounts).
Multi-advocate support is an explicit end goal, so the data model and
architecture are designed multi-user-ready from day one --- every record
is owned by a user --- and adding more advocates later is additive
rather than a rewrite.

1.1 Confirmed scope decisions

  -----------------------------------------------------------------------
  **Decision**        **Choice for v1**            **Note**
  ------------------- ---------------------------- ----------------------
  Jurisdiction        India (eCourts ecosystem)    Drives document
                                                   formats and citation
                                                   source

  Legal references    Licensed case-law database   Indian Kanoon API
                                                   proposed as cheapest
                                                   viable source

  Documents & Drive   Google Docs as editor +      No in-app editor;
                      store; portal holds links +  content lives in
                      metadata                     Google Docs

  Users               Solo advocate now;           Built
                      multi-advocate is the        multi-user-ready; more
                      explicit end goal            advocates added
                                                   without rewrite
  -----------------------------------------------------------------------

1.2 The most important thing to get right

Three features in your brief sound small but are where most of the risk
and effort live. Naming them now prevents a painful surprise mid-build:

- **Court calendar / eCourts schedule sync.** There is no official
  government API for eCourts India Services --- the official surfaces
  are the CAPTCHA-protected portal and mobile app, meant for human use.
  However, third-party commercial APIs (e.g. eCourtsIndia, Vakeel360)
  scrape eCourts and re-serve case status, orders and cause lists as
  JSON, with cause-list filtering by advocate name --- exactly what a
  calendar needs. v1 can therefore pull schedules via a paid third-party
  API, with manual import as the always-available fallback. The
  trade-off: these vendors are unofficial intermediaries that inherit
  the portal\'s fragility, and you route case numbers through a third
  party --- see §10.

- **References on the fly.** Useful and feasible via the Indian Kanoon
  API, but it is a paid, pre-paid metered service and search relevance
  must be tuned. Treat AI-generated citations, if added, as draft
  assistance that the advocate must verify --- courts have sanctioned
  lawyers for citing AI-hallucinated cases.

- **"Build context on the case."** This is the genuinely valuable,
  differentiating feature: an auto-refreshing Case History (parties,
  dates, facts) plus pull-context when drafting follow-on documents.
  Mostly a data-model and retrieval problem, not magic. One wrinkle from
  the Google-Docs-as-editor choice: the content to summarise lives in
  Docs, so this feature reads it back via the Docs API --- feasible, but
  it adds API cost and parsing (see §4.2, §4.3).

2\. Goals & non-goals

2.1 Goals (v1)

- Cut the time to draft a standard petition, appeal or legal notice to
  minutes by reusing learned per-type structure while the advocate
  supplies only the case-specific details.

- Give the advocate one place to see every document, fact, party and
  deadline for a case.

- Create documents as Google Docs in the advocate\'s own Drive,
  organised per case, with printing and export handled natively by
  Google.

- Let the advocate search statutes and case law without leaving the
  portal, and attach found citations to a case or document.

- Provide a separate research scratchpad that is not tied to producing a
  single document.

- Show upcoming hearing dates and deadlines in a calendar view.

2.2 Non-goals (explicitly out of scope for v1)

- Multi-user firms, role-based permissions and document sharing between
  users.

- Billing, invoicing, time-tracking or client-facing portals.

- Automated e-filing or direct submission to any court system.

- Acting as a system of legal record or guaranteeing legal correctness
  of generated documents --- the advocate remains responsible for all
  output.

- Mobile native apps (the web app should be responsive, but native is
  later).

2.3 Success metrics

  -----------------------------------------------------------------------
  **Metric**                            **Target (first 90 days of use)**
  ------------------------------------- ---------------------------------
  Time to produce a standard document   Under 10 minutes from start to
                                        created Google Doc

  Documents created from a template vs  \> 70% via template
  from scratch                          

  Cases with at least 3 linked          \> 50% (indicates context is
  documents                             accumulating)

  Citation searches that get attached   \> 30% (indicates research is
  to a case                             useful, not just browsing)

  Drive sync errors per 100 exports     \< 2
  -----------------------------------------------------------------------

3\. Users & key scenarios

3.1 Primary user

A solo advocate or a lawyer working independently, comfortable with
everyday software (Word, Gmail, Drive) but not technical. Handles a few
dozen active matters at a time. Values speed, not losing track of
documents, and not being embarrassed in front of a court by a formatting
or citation error.

3.2 Representative scenarios

Scenario A --- First-time setup (onboarding)

On first use, the portal asks the advocate to share 1--2 sample
documents for each type they work with (petition, appeal, legal notice).
It learns the structure of each. The advocate supplies petitions and
notices now and skips appeals for later; appeals will be learned the
first time they create one. After this, the relevant document types work
without further setup.

Scenario B --- Draft a legal notice

The advocate opens a case, chooses to create a "Legal Notice", fills in
the case details (parties, facts, demand, timeline), optionally pulls in
a statute reference, and the document is generated as a Google Doc in
the case\'s Drive folder from the Legal Notice template, with standard
details prefilled.

Scenario C --- Build the file for an appeal

Over several weeks the advocate adds the impugned order, drafts grounds
of appeal, attaches two precedents found via research, and writes case
notes. When drafting the appeal document, the portal offers these linked
items as context to pull from.

Scenario D --- Check the week ahead

The advocate imports the latest cause-list / case status and the
calendar shows which cases have hearings this week, with one click back
to each case.

4\. Feature specification

Features are sequenced by build-order priority P1--P4, reflecting the
order in which they will be built and their importance to the product.
All four tiers are in scope for the product; the numbering is the
sequence, not a cut line. Within each tier, supporting capabilities
(e.g. .docx export) are noted. Each feature lists its main risks.

  ---------------------------------------------------------------------------
  **Tier**   **Theme**                                 **New external
                                                       dependency**
  ---------- ----------------------------------------- ----------------------
  P1         Document creation from templates + Google Google Drive (OAuth +
             Docs                                      sync)

  P2         Case context & follow-on documents        None --- the
                                                       advocate\'s own data

  P3         Legal research & references               Indian Kanoon API

  P4         Calendaring & court-schedule sync         Third-party eCourts
                                                       API
  ---------------------------------------------------------------------------

Note the sequencing: P1 takes on the Google Drive dependency (OAuth +
sync) because saving documents to the advocate\'s own Drive is
considered essential to the product being usable. To avoid the first
working build waiting on Google\'s OAuth consent-screen approval, P1 is
split internally --- local .docx download ships first as an early
checkpoint, then Drive sync completes the tier. P2 adds no new external
dependency at all (it is retrieval over the advocate\'s own data), which
is why case-context --- the product\'s main differentiator --- is also
one of the lowest-risk tiers to build.

4.1 Document creation (P1)

**What a template is:** a generic, reusable definition of a document
type --- its structure plus the form the advocate fills when creating a
document of that type. Templates are first-class, manageable objects.
They are generic across cases (there is no per-case version of a
template), but they are visible and editable.

Template management

- The templates screen opens with high-level metrics on top (e.g. total
  templates, total documents generated, most-used types).

- Each template lists the documents linked to it as hyperlinks, every
  link annotated with a short description of the case it belongs to ---
  a navigable index, not just a count.

- Templates do not display a case-specific instance --- they are
  generic; the case-specific substance is supplied at document-creation
  time.

Editing a template is a set of operations, not a single text field:

- Add additional details --- supplementary content or instructions
  layered onto the template.

- Refer to newer or external documents --- attach other documents to the
  template, each marked as either a learning input (the system re-learns
  / refines the template\'s structure from it) or a standing reference
  (carried as context that informs generation without changing the
  structure, e.g. "follow the format in this circular"). The advocate
  chooses which per reference.

- Suggest edits to the existing template --- the advocate requests
  changes; the system proposes a revised version which the advocate
  accepts, rejects or further edits (human confirms all structural
  change).

- Clone the template --- duplicate it as a starting point for a variant.

Template creation --- defines structure AND the form

- Built from 1--2 sample documents (collected at onboarding, §3.2 / §4
  onboarding). From the samples the system proposes both the structure
  and a categorisation of the detected fields into three groups; the
  advocate reviews and adjusts (hybrid).

- Basic details --- per-document facts asked each time the document is
  created: e.g. party names, address, age. Plain form fields.

- Prefill / standard details --- values usually constant for this
  advocate: e.g. advocate name, advocate address, court name. Defaulted
  from the advocate\'s profile (set at onboarding) and overridable per
  template; offered prefilled and still editable at creation.

- Case-specific details --- the substantive content that varies heavily
  case to case. Captured as a free-text area that can hold large text.

- These three groups are defined during template creation, not at
  document time.

Creating a document from a template

- Inside a case, the advocate picks a document type/template (or starts
  from scratch).

- The system presents the form defined by the template: basic details as
  straightforward fields; standard details prefilled and editable; a
  free-text box for case-specific details.

- Interaction style: only the case-specific free-text is
  open-ended/large; basic and prefill details are plain form-filling,
  NOT conversational --- the advocate fills fields, they don\'t chat.

- On submit, the system generates the document by applying the
  template\'s structure to the supplied details, creating it as a Google
  Doc in the case\'s Drive folder (§4.2). The advocate then edits freely
  in Google Docs.

How structure is learned

- One template/structure per document type, refined as more documents
  are created and as the advocate adds textual context.

- Primary flow --- up-front onboarding: on first setup the portal asks
  for 1--2 samples per document type and learns each, so types work from
  day one.

- Skippable/resumable per type: a skipped type falls back to
  learn-on-first-encounter (asked the first time that type is created).

- A from-scratch document can optionally seed/refine a type ("templatise
  this").

**Risks:** (1) Court/state-specific formatting varies --- structure and
field categorisation learned from the advocate\'s own samples is what
makes output credible, so sample quality matters. (2) Field
mis-categorisation (basic vs prefill vs case-specific) --- the review
step at template creation is the mitigation. (3) Onboarding friction
from requiring samples up front --- keep it skippable/resumable. (4)
Learned-structure quality from 1--2 samples is variable; the user edits
the generated Doc in Google Docs anyway, so mistakes are correctable,
but detection accuracy should be tracked. (5) Scope: the full
template-editing set (versioning, learning-input vs standing-reference
documents, AI-proposed revisions, clone) is substantial for P1 ---
consider shipping a thin first cut (create + use + add-context + clone)
and deferring AI-proposed structural revisions if P1 gets heavy.

4.2 Google Docs as editor & store, printable output (P1)

- Documents live as Google Docs in the advocate\'s own Google Drive. The
  portal stores a link and metadata (which case, which document type,
  status), not the document body.

- Editing happens in Google Docs --- the portal does not build its own
  rich-text editor. This removes a large build and gives the advocate a
  familiar, capable editor with native printing and .docx/PDF export.

- "Create a document" generates a Google Doc by applying the learned
  structure for the chosen type to the case details, then places it in
  the case\'s Drive folder. (Implementation may use a maintained base
  Doc per template or programmatic Docs-API construction.)

- Each case maps to a folder in Drive; its documents are created there.
  The portal\'s database remains the source of truth for structure,
  links and relationships; Google Drive/Docs holds the document content.

- Access via Google OAuth, scoped as narrowly as the feature allows.
  Note: creating and editing Docs (generating content and writing it)
  needs broader Docs/Drive scope than write-only file creation --- see
  the scope note in §10.

**Consequence to design for:** because content lives in Google Docs
rather than the portal\'s database, the Case History (§4.3) and "pull
context from prior documents" features must read document content back
out via the Google Docs API. This is feasible but adds API calls and
parsing; it is the main cost of the Docs-as-editor choice.

**Sequencing:** Drive/Docs integration requires a backend for the OAuth
secret and tokens (cannot run on a static-only host, see §8) and Google
app verification, which has lead time. Begin verification in Phase 0. A
purely local document-generation path can serve as an early, no-OAuth
checkpoint to prove the structure-apply logic before Docs integration
lands.

4.3 Cases: Case History & Case Documents (P2)

The advocate opens a case and sees two areas: Case History (an
at-a-glance graphical summary) and Case Documents (the document store
for the case).

Case History

- A graphical representation of the case\'s key details: involved
  parties, important dates/deadlines, and key facts.

- Auto-refreshing: as documents are created or added to the case, the
  history updates to reflect new parties, dates and facts found in them.

- Data is extracted by the model from the case\'s documents when
  documents exist, then surfaced for the advocate to confirm or correct
  (hybrid). When the case has no documents yet, the tool prompts the
  advocate to supply the key details directly, so Case History is never
  empty-and-stuck.

- Pure auto-extraction would mis-read names/dates often enough to erode
  trust in exactly the screen meant to be the reliable overview; the
  confirm step keeps the auto-refresh convenience while guaranteeing
  correctness.

Case Documents

- Lists all documents belonging to the case, each linked to its Google
  Doc.

- "Create a new document" from here, either from a template or from
  scratch (a from-scratch document can be templatised afterwards).

- When drafting a follow-on document, the advocate can pull context from
  the case\'s prior documents --- i.e. retrieval over the case\'s own
  content (read back from Google Docs, per §4.2).

**Dependency:** both Case History extraction and pull-context read
document content out of Google Docs via API. This is the practical cost
of the Docs-as-editor decision and should be load- and cost-tested.

4.4 Statute & case-law references on demand (P3)

**Source:** Indian Kanoon API (proposed). Confirmed characteristics from
their published materials:

- **Prepaid, metered.** Roughly Rs 500 free credit on signup for
  development/testing; a separate free monthly allowance is offered for
  verified non-commercial use. Commercial pricing is pay-as-you-go and
  subject to change --- you must confirm current rates with them
  directly.

- **Backend-only key.** Their API key must never be exposed in client
  code; all requests must be proxied through your own server.

- **Richer paid tiers** offer per-paragraph judgment classification
  (facts, issues, arguments, precedent analysis) and citation extraction
  --- a strong later enhancement to the P2 "build context" goal once
  research is in place.

Feature behaviour:

- Search box returns matching statutes/judgments; results open in a
  reader pane styled by us.

- A result can be attached to a case or inserted as a citation into a
  document.

- Later option: Manupatra / SCC Online as a premium enterprise source if
  a customer requires it (negotiated, expensive).

4.5 Research workspace (P3)

- A space separate from any single document: saved searches, clipped
  passages, free-form notes, and collections of citations.

- Items here can be promoted into a case when they become relevant.

4.6 Calendar & court-schedule sync (P4)

- Calendar view of hearings and user-created deadlines, each linkable to
  a case.

- Always-available fallback: the advocate uploads/pastes a cause-list or
  case-status export (or the eCourts app\'s backup file), and the portal
  parses it into events.

- Preferred auto-populate: query a third-party eCourts API (e.g.
  eCourtsIndia or Vakeel360) for the advocate\'s cause-list entries by
  advocate name / CNR number, and turn matching hearings into calendar
  events. Refresh on demand or on a schedule.

- The advocate links each case to its CNR/case number once, so future
  syncs map hearings to the right case automatically.

**Reality check:** No official government API exists; these third-party
providers scrape the eCourts portal and re-serve it. They inherit the
portal\'s quirks (state-by-state variation, inconsistent case-type
naming, some tribunals excluded) and mean routing client case numbers
through a third party. Treat the official portal as the source of truth
and the API as a convenience layer. Confirm each vendor\'s pricing,
reliability and data-handling terms before committing --- pricing is
quote-based, not published.

5\. Feature priority at a glance

Priorities below are build-order tiers P1--P4 as ranked by the product
owner. All tiers are in scope; lower numbers ship first.

  ---------------------------------------------------------------------------
  **Tier**   **Feature**                            **Main risk**
  ---------- -------------------------------------- -------------------------
  P1         Templates (generic, managed) +         Court formats; field
             document creation form                 categorisation; template
                                                    quality

  P1         Template management UI (metrics,       Scope; refinement UX;
             linked-doc index, edit/refer/clone)    versioning

  P1         Google Docs as editor/store +          OAuth scope, token
             printable output                       security, app
                                                    verification

  P2         Case History (auto-refresh,            Extraction accuracy;
             AI-extracted, user-confirmed)          reading content from Docs

  P2         Case Documents + follow-on docs using  Retrieval/UX; Docs API
             case context                           cost

  P2         AI draft/summary assist (optional)     Hallucinated citations

  P3         Case-law / statute search (Indian      Cost control, relevance
             Kanoon)                                

  P3         Research workspace                     Scope creep

  P4         Calendar + manual import               Parsing varied formats

  P4         Court sync via 3rd-party eCourts API   Unofficial; quirks;
                                                    vendor terms

  Later      Chamber multi-user                     Permissions, sharing
  ---------------------------------------------------------------------------

6\. Data model (initial)

Designed single-user now, multi-user later: every row carries an
owner/user id from day one even though only one user exists, so adding
more advocates later is additive rather than a rewrite. Document content
lives in Google Docs; the database stores links and structured metadata.

  ----------------------------------------------------------------------------------------
  **Entity**          **Key fields**                             **Notes**
  ------------------- ------------------------------------------ -------------------------
  User / Profile      id, name, email, google_tokens,            Profile supplies prefill
                      profile{advocate_name, address,            defaults; tokens
                      default_court, ...}                        server-side, encrypted;
                                                                 multi-user-ready

  Case                id, user_id, title, court, case_no/CNR,    The hub everything links
                      type, status, drive_folder_id              to

  Document            id, case_id, template_id, title, gdoc_id,  Content in the Google
                      gdoc_url, status, field_values             Doc; portal stores link,
                                                                 metadata + submitted
                                                                 field values

  Template            id, user_id, doc_type, name, structure,    Generic, managed object;
                      extra_context, version,                    versioned (edits/clones);
                      sample_doc_refs\[\], linked_doc_count      editable via the
                                                                 operations in §4.1

  TemplateReference   id, template_id, ref_doc_id/url,           Documents a template
                      role(learning_input\|standing_reference)   refers to; learning
                                                                 inputs refine structure,
                                                                 standing references
                                                                 inform generation

  TemplateField       id, template_id, label,                    Categorisation set at
                      category(basic\|prefill\|case_specific),   template creation;
                      input_type, profile_key?                   prefill maps to a profile
                                                                 key

  CaseFact            id, case_id, kind(party\|date\|fact),      Powers Case History;
                      value, source_doc_id, confirmed            AI-extracted,
                                                                 user-confirmed; refreshes
                                                                 on new docs

  Citation            id, case_id, source, ext_ref, snippet      From Indian Kanoon (P3);
                                                                 attachable to docs

  ResearchItem        id, user_id, case_id?, type, content       Research space (P3),
                                                                 optional case link

  CalendarEvent       id, user_id, case_id?, title, datetime,    P4; source = manual \|
                      source                                     import \| ecourts_api
  ----------------------------------------------------------------------------------------

7\. Architecture overview

A single-page web app talking to a thin backend. The backend exists
because several things cannot live in client-only code: the Google OAuth
secret/tokens, the Indian Kanoon API key, and the AI API key. Document
content lives in Google Docs, not in the portal.

7.1 Components

- Client SPA --- the UI: templates (management + creation),
  document-creation form, cases (Case History + Case Documents),
  research, calendar. No in-app document editor --- editing is delegated
  to Google Docs.

- Backend / serverless functions --- holds secrets; proxies Google
  (Docs + Drive), Indian Kanoon and AI calls; runs structure-learning
  (per document type) and Case-History extraction; serves the database.

- Database --- structured metadata and links (the entities in §6).

- Google Docs + Drive --- the documents themselves (generated by
  applying the learned per-type structure to case details) and per-case
  folders. Content is read back via the Docs API for Case History and
  pull-context.

- AI (Claude API) --- template structure/field detection from samples;
  Case-History fact extraction; optional draft assist.

- Indian Kanoon API (P3) and third-party eCourts API (P4) --- external,
  backend-only.

7.2 Why a static-only host is not enough

You asked about GitHub-based UI hosting and cheaper APIs. GitHub Pages
serves static files only --- it cannot keep an API key secret or run
server logic. The good news: you can keep a GitHub-centric workflow and
still get a backend, by deploying from your GitHub repo to a platform
that offers serverless functions on a free tier. The UI stays "hosted
from GitHub" in spirit; the secrets stay safe.

8\. Recommended tech stack

Chosen for low cost (mostly free tiers until there are real users), a
GitHub-driven deploy workflow, and not painting you into the "static
site can\'t do the job" corner.

  -----------------------------------------------------------------------
  **Layer**      **Recommendation**          **Why / cost**
  -------------- --------------------------- ----------------------------
  Frontend       React + Vite + TypeScript,  Fast, modern, great
                 Tailwind CSS, shadcn/ui     component library; free

  Hosting (UI)   Cloudflare Pages or Vercel  Keeps GitHub workflow;
                 (deploy from GitHub)        generous free tier; gives
                                             serverless functions too

  Backend        Serverless functions        Holds secrets, proxies APIs;
                 (Cloudflare Workers /       no server to manage; free
                 Vercel Functions)           tier

  Database +     Supabase (free tier)        Postgres + auth + file
  auth + storage                             storage in one; collapses
                                             plumbing

  Document store Google Docs + Drive API via Docs is the editor (no
  & editor       OAuth                       editor to build); content +
                                             printing handled by Google

  Document       Google Docs API             Apply learned per-type
  generation     (programmatic build /       structure to case details
                 base-Doc fill)              

  Optional local docx npm library            No-OAuth early checkpoint to
  export         (programmatic)              prove fill logic before Docs
                                             integration

  AI (Claude     Haiku for                   Route cheap extraction to
  API)           structure-learning &        Haiku to control cost
                 Case-History extraction;    
                 Sonnet for draft assist     

  Legal search   Indian Kanoon API           Cheapest real source;
  (P3)           (backend-proxied)           prepaid metered

  Court data     Third-party eCourts API     No official API; these
  (P4)           (eCourtsIndia / Vakeel360), scrape & re-serve;
                 backend-proxied             quote-based pricing
  -----------------------------------------------------------------------

**A note on "pure GitHub Pages":** if you genuinely want only GitHub
Pages, the only safe way to use the Drive and Kanoon keys is to still
run a tiny backend elsewhere (e.g. Cloudflare Workers). Pages can host
the UI and call that Worker. There is no secure way to put those keys in
the browser.

9\. Phased delivery plan

The phases map directly onto the P1--P4 priority tiers: Phase 1 delivers
P1 (document creation, with per-type structure learned invisibly,
documents created as Google Docs), Phase 2 delivers P2 (Case History +
Case Documents), Phase 3 delivers P3 (research), Phase 4 delivers P4
(calendar). Phase 0 lays foundations and starts the long-lead and
de-risking work --- including Google app verification and the P3/P4
dependency spikes --- so they don\'t block the milestones that depend on
them. An optional local .docx generation path can prove the
structure-apply logic early, before the Google Docs integration lands.

Phase 0 --- Foundations & spikes

- Repo, CI/CD from GitHub to chosen host, auth, empty cases workspace.

- Start early (long lead time): register the Google Cloud project and
  begin OAuth consent-screen / app verification for the Docs + Drive
  scopes needed to copy and edit documents, so Phase 1 isn\'t gated by
  Google\'s review.

- Spike: Indian Kanoon API --- sign up, confirm current pricing/terms,
  test search relevance with real queries.

- Spike: court data --- trial a third-party eCourts API (eCourtsIndia /
  Vakeel360): confirm pricing, reliability, advocate-name cause-list
  coverage for your target courts, and data-handling terms. Decide
  vendor + manual-import fallback format.

Phase 1 --- P1: Document creation (the first thing worth using)

- Templates: management UI (metrics banner, per-template linked-document
  index with case descriptions, and edit operations --- add details,
  refer to learning-input/standing-reference documents, suggest edits
  with accept/reject, clone) plus template creation from samples that
  also defines the three field groups (basic / prefill / case-specific).

- Document creation: inside a case, pick a template → fill the form
  (basic fields; prefilled standard details; case-specific free-text) →
  generate a Google Doc. Only the case-specific box is free-text; the
  rest is plain form-filling.

- Onboarding: asks for 1--2 samples per document type up front
  (skippable/resumable per type) to create templates; skipped types fall
  back to learn-on-first-encounter.

- Google Docs integration: create documents by copying/generating into a
  Google Doc and placing it in the case\'s Drive folder; store link +
  metadata.

- Optional early checkpoint (no OAuth): local document generation to
  prove the structure-apply logic before Docs integration is wired up.

Phase 2 --- P2: Cases (Case History + Case Documents)

- Cases section with two areas: Case History (AI-extracted
  parties/dates/facts, user-confirmed, auto-refreshing as documents are
  added) and Case Documents (all the case\'s Google Docs, with
  create-new by document type or from scratch).

- Pull-context: when drafting a follow-on document, surface relevant
  content from the case\'s prior documents (read back via the Docs API).
  Optional AI summarise/draft-assist, clearly labelled. No new external
  dependency.

Phase 3 --- P3: Research & references

- Indian Kanoon search UI, reader pane, attach-citation-to-case;
  standalone research workspace.

Phase 4 --- P4: Calendar

- Calendar view; manual-import events linked to cases; integrate chosen
  third-party eCourts API to auto-populate hearings by advocate/CNR.

Phase 5 --- Polish & hardening

- Templates expanded for additional target courts; performance,
  error-handling and security hardening; groundwork for chamber
  multi-user if pursued.

10\. Risk register

  ---------------------------------------------------------------------------
  **Risk**                  **Impact**       **Mitigation**
  ------------------------- ---------------- --------------------------------
  No official eCourts API;  Medium-High      Manual import always available
  3rd-party scrapers                         as fallback; treat portal as
  inherit portal fragility                   source of truth; vet vendor
  & route client data                        terms & data-handling; cache;
  externally                                 design source as swappable

  AI-suggested citations    High             Label as draft; require advocate
  may be hallucinated       (professional)   verification; prefer real Kanoon
                                             results over generated cites

  Indian Kanoon             Medium           Prepaid; cache results; design
  pricing/terms change or                    source as swappable; confirm
  service down                               terms before build

  Court-specific document   Medium           Gather real samples per target
  formats vary                               court; learn structure per type
                                             and refine it over time

  Google scope is broader   High             Use the narrowest Docs/Drive
  than write-only (Docs                      scope that supports copy+edit
  editing needs read/write                   (ideally limited to app-created
  to created docs); heavier                  files); begin Google
  verification & more data                   verification in Phase 0; encrypt
  access                                     tokens; document data flows;
                                             review bar/confidentiality
                                             duties

  Content lives in Google   Medium           Cache extracted facts in
  Docs, so Case History &                    CaseFact; batch/throttle Docs
  pull-context depend on                     reads; re-extract only on
  Docs API reads                             document change; load-test API
                                             cost

  Scope creep (firm         Medium           Hold the line on v1 non-goals;
  features, billing)                         keep multi-user additive in data
                                             model

  Static-host limitation    Medium           Decided now: backend via
  discovered late                            serverless from the start
  ---------------------------------------------------------------------------

11\. Open questions for you

Answering these will let the design move from draft to buildable:

1.  Which specific courts/states will the first templates target? (We
    need 2--3 real sample documents per type to make templates
    credible.)

2.  Is the intended use commercial? This determines whether Indian
    Kanoon\'s free non-commercial allowance applies or you pay per
    query.

3.  For court data, are you comfortable routing client case/CNR numbers
    through a third-party eCourts API (eCourtsIndia / Vakeel360), or
    should v1 stay manual-import only until you vet a vendor?

4.  Do you have any bar-council or client-confidentiality obligations
    that constrain where client data may be stored?

5.  For v1 references, is real database search (no AI authoring)
    acceptable, or do you also want AI drafting with the verification
    caveats?

6.  Roughly how many active matters and documents per month, so we can
    size cost (especially Kanoon queries and any AI usage)?

**Next step:** Confirm the open questions in §11 (especially the target
courts and whether a third-party eCourts API is acceptable). With sample
documents in hand, the templates (structure + field categorisation) and
the data model can be finalised and Phase 0 can start.
