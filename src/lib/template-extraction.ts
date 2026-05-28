// Template extraction — given an uploaded sample document, find the
// variable parts (dates, parties, case numbers, addresses, etc.), classify
// each as basic / prefill / case-specific, and rebuild the body as a
// template with {{Placeholder}} spans where the variables used to be.
//
// Two engines stacked:
//   1. parseDocx + findCandidates — runs in the browser, no API key. Picks
//      up obvious patterns. Fast, blunt; fine to confirm/reject by hand.
//   2. refineWithClaude — optional. Sends the parsed text to Claude with a
//      strict tool schema and gets back a redacted body + classified fields.
//      Requires VITE_ANTHROPIC_API_KEY at build/dev time.

import mammoth from "mammoth";
import type {
  TemplateFieldCategory,
  TemplateFieldInputType,
  TemplateFieldInsert,
} from "./types";

// ── Minimal Claude client — fetch only, no SDK ─────────────────────────
// The official @anthropic-ai/sdk pulls in node:fs / node:path through its
// agent-toolset, which doesn't bundle for the browser. The three calls we
// make all follow the same tool-use shape, so this tiny helper keeps the
// bundle thin and the deploy unblocked. Browser key + a user gesture only.
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

interface ClaudeToolCall<T> {
  apiKey: string;
  system: string;
  userContent: string;
  toolName: string;
  toolDescription: string;
  toolSchema: Record<string, unknown>;
  maxTokens?: number;
  signal?: AbortSignal;
  __resultType?: T; // phantom, for type inference at call sites
}

async function callClaudeTool<T>(args: ClaudeToolCall<T>): Promise<T> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      // Acknowledge browser-side usage. Pilot only — production should
      // proxy through a Supabase Edge Function so the key isn't shipped.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: args.maxTokens ?? 4096,
      system: args.system,
      tools: [
        {
          name: args.toolName,
          description: args.toolDescription,
          input_schema: args.toolSchema,
        },
      ],
      tool_choice: { type: "tool", name: args.toolName },
      messages: [{ role: "user", content: args.userContent }],
    }),
    signal: args.signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    content: Array<
      | { type: "text"; text: string }
      | { type: "tool_use"; name: string; input: unknown }
    >;
  };
  const tool = json.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") {
    throw new Error("Claude did not return a tool call.");
  }
  return tool.input as T;
}

export type CandidateKind =
  | "date"
  | "case_no"
  | "cnr"
  | "money"
  | "email"
  | "phone"
  | "survey_no"
  | "name"
  | "address"
  | "ai_other";

export interface CandidateSpan {
  /** Stable across one parse session — used as React key. */
  id: string;
  /** Inclusive offset into the source text. */
  start: number;
  /** Exclusive end offset. */
  end: number;
  /** Verbatim matched substring. */
  text: string;
  kind: CandidateKind;
  suggestedLabel: string;
  suggestedCategory: TemplateFieldCategory;
  suggestedInputType: TemplateFieldInputType;
  /** Toggled by the user; only accepted spans become template placeholders. */
  accepted: boolean;
}

export async function parseDocx(
  file: File
): Promise<{ text: string; warnings: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return {
    text: normaliseWhitespace(result.value ?? ""),
    warnings: (result.messages ?? []).map((m: { message: string }) => m.message),
  };
}

function normaliseWhitespace(s: string): string {
  // Mammoth puts paragraphs on separate lines already. Collapse 3+ blank
  // lines to keep the preview compact without flattening structure.
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

// ────────────────────────────────────────────────────────────────────────
// Heuristic candidate finder
// ────────────────────────────────────────────────────────────────────────

interface Pattern {
  kind: CandidateKind;
  regex: RegExp;
  label: string;
  category: TemplateFieldCategory;
  inputType: TemplateFieldInputType;
}

const PATTERNS: Pattern[] = [
  // Indian court case numbers — covers W.P., Crl.P., S.C., O.S., O.P., etc.
  // Pattern: <abbrev> No. <digits> (/ | of) <year>. The number and year are
  // separated by either "/" ("W.P. No. 4521/2023") or "of"
  // ("O.S. No. 167 of 2024") — both are common in Indian filings.
  {
    kind: "case_no",
    regex:
      /\b(?:W\.P|Crl\.P|Crl\.M|S\.C|O\.S|O\.P|C\.C|M\.C|R\.F\.A|I\.T\.A|O\.A|E\.P|P\.C\.R|Misc)\.?\s*No\.?\s*\d+\s*(?:\/|of)\s*(?:19|20)\d{2}/g,
    label: "Case number",
    category: "case_specific",
    inputType: "text",
  },
  // CNR — 16-character alphanumeric, usually all caps
  {
    kind: "cnr",
    regex: /\b[A-Z]{4}\d{2}\d{10}\b/g,
    label: "CNR",
    category: "case_specific",
    inputType: "text",
  },
  // Dates — various Indian formats: 12 January 2024, 12-01-2024, 12.01.2024
  {
    kind: "date",
    regex:
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(?:19|20)\d{2}|\d{1,2}[-./]\d{1,2}[-./](?:19|20)?\d{2})\b/gi,
    label: "Date",
    category: "case_specific",
    inputType: "date",
  },
  // Survey number (Karnataka / many Indian states)
  {
    kind: "survey_no",
    regex: /\bSy\.?\s*No\.?\s*\d+(?:\/\d+)?(?:[a-z])?\b/gi,
    label: "Survey number",
    category: "case_specific",
    inputType: "text",
  },
  // Money — ₹14.2 lakh, Rs. 4,60,000, Rs. 14.2 lakh, INR 50,000
  {
    kind: "money",
    regex:
      /(?:₹|Rs\.?|INR)\s*\d[\d,]*(?:\.\d+)?\s*(?:lakh|lakhs|crore|crores|thousand|hundred)?/gi,
    label: "Amount",
    category: "case_specific",
    inputType: "text",
  },
  // Email
  {
    kind: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    label: "Email",
    category: "prefill",
    inputType: "text",
  },
  // Indian phone — +91 prefix optional, 10 digits
  {
    kind: "phone",
    regex: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g,
    label: "Phone",
    category: "prefill",
    inputType: "text",
  },
];

// Party caption lines in an Indian filing: "<Name>  … Plaintiff",
// "<Name> ... Defendant". The name sits at the start of its own line, then an
// ellipsis (or a run of dots) and a role word follow. We capture only the
// name so the "… Plaintiff" label stays as literal text. The role decides the
// field label (Plaintiff → "Plaintiff name"), so this can't be expressed as a
// single fixed-label PATTERN entry.
const PARTY_NAME_RE =
  /^[ \t]*([A-Z][A-Za-z.&'-]*(?:[ \t]+[A-Za-z.&'()-]+)*?)[ \t]+(?:…|\.{2,})[ \t]*(Plaintiffs?|Defendants?|Petitioners?|Respondents?|Appellants?|Complainants?|Applicants?|Accused|Opponents?)\b/gm;

function findPartyNames(text: string, startSeq: number): CandidateSpan[] {
  const out: CandidateSpan[] = [];
  let seq = startSeq;
  for (const match of text.matchAll(PARTY_NAME_RE)) {
    if (match.index == null) continue;
    const name = match[1];
    // Name offset = match start + where the name begins within the match
    // (after any leading whitespace). indexOf is safe: the leading run is
    // whitespace only, so the first occurrence of the name is its position.
    const start = match.index + match[0].indexOf(name);
    const role = match[2].replace(/s$/i, ""); // singularise "Defendants" etc.
    const label =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() + " name";
    out.push({
      id: `n${seq++}`,
      start,
      end: start + name.length,
      text: name,
      kind: "name",
      suggestedLabel: label,
      suggestedCategory: "basic",
      suggestedInputType: "text",
      accepted: true,
    });
  }
  return out;
}

export function findCandidates(text: string): CandidateSpan[] {
  const spans: CandidateSpan[] = [];
  let seq = 0;

  for (const p of PATTERNS) {
    // Use matchAll for offsets
    for (const match of text.matchAll(p.regex)) {
      const start = match.index;
      if (start == null) continue;
      const matched = match[0];
      spans.push({
        id: `c${seq++}`,
        start,
        end: start + matched.length,
        text: matched,
        kind: p.kind,
        suggestedLabel: p.label,
        suggestedCategory: p.category,
        suggestedInputType: p.inputType,
        accepted: true,
      });
    }
  }

  spans.push(...findPartyNames(text, seq));

  // Sort by start, then drop overlaps (longer / earlier wins)
  spans.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const accepted: CandidateSpan[] = [];
  let lastEnd = -1;
  for (const span of spans) {
    if (span.start < lastEnd) continue;
    accepted.push(span);
    lastEnd = span.end;
  }
  return accepted;
}

// ────────────────────────────────────────────────────────────────────────
// Stitch the redacted body together
// ────────────────────────────────────────────────────────────────────────

/**
 * Walks the source text, swapping each *accepted* span for a
 * `{{Field label}}` placeholder. Returns the new body plus a deduplicated,
 * ordinal-correct list of fields ready to feed into createTemplate.
 *
 * Spans that share a label collapse to one field — the second occurrence
 * of "Petitioner name" becomes the same placeholder, not a new one.
 */
export function applyRedactions(
  source: string,
  candidates: CandidateSpan[]
): { body: string; fields: TemplateFieldInsert[] } {
  const accepted = candidates
    .filter((c) => c.accepted)
    .sort((a, b) => a.start - b.start);

  // Deduplicate by label; preserve first-seen order for ordinals.
  const labelToField = new Map<string, TemplateFieldInsert>();
  for (const c of accepted) {
    if (labelToField.has(c.suggestedLabel)) continue;
    labelToField.set(c.suggestedLabel, {
      label: c.suggestedLabel,
      category: c.suggestedCategory,
      input_type: c.suggestedInputType,
      profile_key: null,
      ordinal: labelToField.size,
    });
  }

  let body = "";
  let cursor = 0;
  for (const span of accepted) {
    body += source.slice(cursor, span.start);
    body += `{{${span.suggestedLabel}}}`;
    cursor = span.end;
  }
  body += source.slice(cursor);

  return {
    body,
    fields: [...labelToField.values()],
  };
}

// ────────────────────────────────────────────────────────────────────────
// Claude refinement — call from a user gesture only.
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns a Claude-cleaned redacted body + classified fields. Throws if
 * the API key isn't configured so callers can degrade to the heuristic
 * result.
 */
export async function refineWithClaude(args: {
  text: string;
  signal?: AbortSignal;
}): Promise<{
  body: string;
  fields: TemplateFieldInsert[];
  warnings: string[];
}> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured — set VITE_ANTHROPIC_API_KEY in .env.local. Pilot keys are exposed to the browser; production should proxy through a Supabase Edge Function."
    );
  }

  const systemPrompt = [
    "You convert a sample legal document (an Indian advocate's filing) into a reusable template.",
    "Identify every span that would change from case to case and replace it with a `{{Field label}}` placeholder.",
    "Group the placeholders into three categories:",
    " - basic         : asked of the advocate each time (e.g. party names, impugned notification, cause-of-action date).",
    " - prefill       : known about the advocate herself (e.g. counsel name, chambers address, enrolment number, email).",
    " - case_specific : long free-text body content (e.g. grounds and prayer, written submissions).",
    "Preserve the structure, punctuation and formal language of the original — only redact identifiers and per-case facts.",
    "Pick an input_type per field: 'text', 'textarea', 'date', or 'number'. Use 'date' only for actual dates.",
  ].join("\n");

  const input = await callClaudeTool<{
    body: string;
    fields: Array<{
      label: string;
      category: TemplateFieldCategory;
      input_type: TemplateFieldInputType;
      profile_key?: string | null;
    }>;
  }>({
    apiKey,
    system: systemPrompt,
    userContent: `Here is the sample document:\n\n${args.text}`,
    toolName: "submit_template",
    toolDescription:
      "Submit the redacted template body plus the list of fields to ask the advocate.",
    toolSchema: {
      type: "object",
      properties: {
        body: {
          type: "string",
          description:
            "The original document text with every variable span swapped for a `{{Field label}}` placeholder. Preserve line breaks.",
        },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              category: {
                type: "string",
                enum: ["basic", "prefill", "case_specific"],
              },
              input_type: {
                type: "string",
                enum: ["text", "textarea", "date", "number"],
              },
              profile_key: {
                type: ["string", "null"],
                description:
                  "If category is prefill and this maps to a known profile key (advocate_name, address, default_court, name, email), set it. Otherwise null.",
              },
            },
            required: ["label", "category", "input_type"],
          },
        },
      },
      required: ["body", "fields"],
    },
    signal: args.signal,
  });

  return {
    body: input.body,
    fields: input.fields.map((f, i) => ({
      label: f.label,
      category: f.category,
      input_type: f.input_type,
      profile_key: f.profile_key ?? null,
      ordinal: i,
    })),
    warnings: [],
  };
}

// ────────────────────────────────────────────────────────────────────────
// Structural sectioning — splits an Indian filing into the named blocks
// the advocate thinks in: header, parties (from / to), facts, prayer, etc.
// ────────────────────────────────────────────────────────────────────────

export interface Section {
  /** Stable id for editing across re-orders. */
  id: string;
  /** e.g. "Header", "Petitioner — on behalf of", "Prayer". */
  label: string;
  /** The slice of the source text this section covers (no overlap). */
  content: string;
}

/**
 * Asks Claude to read the parsed text and divide it into semantically
 * meaningful sections, preserving order and content exactly. Returns the
 * sections in document order. Throws if the key isn't configured so the
 * caller can fall back to a manual / single-section path.
 */
export async function extractSections(args: {
  text: string;
  signal?: AbortSignal;
}): Promise<{ sections: Section[]; warnings: string[] }> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY to use AI sectioning, or define sections manually."
    );
  }

  const systemPrompt = [
    "You read an Indian advocate's filed document and break it into the canonical sections that filing structure usually carries.",
    "Common labels — pick what actually applies; do not invent sections that aren't there:",
    " - Header (court name, case number line, CNR)",
    " - Petitioner / Complainant / Appellant — and 'on behalf of' if represented",
    " - Respondent / Accused / Opponent — and 'on behalf of' if represented",
    " - Statement of facts",
    " - Grounds",
    " - Prayer / Reliefs sought",
    " - Verification",
    " - Annexures index",
    " - Signature block",
    "Rules:",
    " 1. The sections, joined in order, must reproduce the input text verbatim — no rewriting, no summarising.",
    " 2. Order matters: preserve document order.",
    " 3. Label each section with a concise human-readable name (Title Case, 2–6 words).",
  ].join("\n");

  const input = await callClaudeTool<{
    sections: Array<{ label: string; content: string }>;
  }>({
    apiKey,
    system: systemPrompt,
    userContent: `Document:\n\n${args.text}`,
    toolName: "submit_sections",
    toolDescription:
      "Submit the document split into ordered, labelled sections.",
    toolSchema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              content: {
                type: "string",
                description:
                  "The contiguous slice of the document this section covers. Verbatim.",
              },
            },
            required: ["label", "content"],
          },
        },
      },
      required: ["sections"],
    },
    signal: args.signal,
  });

  return {
    sections: input.sections.map((s, i) => ({
      id: `s${i}`,
      label: s.label.trim(),
      content: s.content,
    })),
    warnings: [],
  };
}

/** Drop-dead-simple manual fallback: one section, the whole text. The
 *  advocate can split it by editing. Useful when the API key isn't set. */
export function singleSection(text: string): Section[] {
  return [{ id: "s0", label: "Body", content: text }];
}

// ────────────────────────────────────────────────────────────────────────
// Standardise the advocate's free-text directions into a structured
// template brief that downstream document generation can rely on.
// ────────────────────────────────────────────────────────────────────────

export interface StandardisedDirections {
  /** Markdown text in a normalised house style — per-section bullet lists. */
  standardised: string;
  /** Short summary of what Claude understood, shown for confirmation. */
  summary: string;
}

export async function standardiseDirections(args: {
  rawDirections: string;
  sections: Section[];
  signal?: AbortSignal;
}): Promise<StandardisedDirections> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured. The wizard will save your raw directions verbatim."
    );
  }
  const sectionList = args.sections
    .map((s, i) => `${i + 1}. ${s.label}`)
    .join("\n");

  const systemPrompt = [
    "You are turning an advocate's informal notes about how a template should behave into a clean, structured brief that a document-generation step can follow.",
    "House style:",
    " - Use markdown.",
    " - Group instructions by section heading (## Section name). One section per ## heading; use the exact section labels supplied by the user.",
    " - Each instruction is a one-line bullet under its section. Imperative voice ('Include a paragraph that…', 'Pull the impugned notification from the case file…').",
    " - If the advocate referenced a section as `§Section name`, treat that as a normal section reference and group the instruction there.",
    " - Add a 'General' section at the top only for instructions that apply across the whole template.",
    " - Do not invent instructions the advocate didn't give. Do not omit anything.",
    "Return the standardised brief plus a one-paragraph summary of what you understood, in the advocate's own register.",
  ].join("\n");

  const input = await callClaudeTool<{
    standardised: string;
    summary: string;
  }>({
    apiKey,
    system: systemPrompt,
    userContent: `Sections of the template (in order):\n${sectionList}\n\nAdvocate's notes:\n\n${args.rawDirections}`,
    toolName: "submit_directions",
    toolDescription:
      "Submit the standardised directions plus a comprehension summary.",
    toolSchema: {
      type: "object",
      properties: {
        standardised: { type: "string" },
        summary: { type: "string" },
      },
      required: ["standardised", "summary"],
    },
    maxTokens: 2048,
    signal: args.signal,
  });

  return {
    standardised: input.standardised,
    summary: input.summary,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

export function hasAnthropicKey(): boolean {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);
}
