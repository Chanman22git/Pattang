// Live document generation — draft a document from an optional source file
// (.docx / PDF / image) plus the advocate's free-text instructions, with no
// template. The source file is handed to Claude natively: .docx is extracted
// to text (the API can't read .docx), while PDFs and images go as base64
// document/image content blocks. Browser fetch only, same pilot key + direct-
// access header as template-extraction; production should proxy this through
// a Supabase Edge Function so the key isn't shipped.

import mammoth from "mammoth";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

/** For the file <input accept> attribute and drag-drop validation. */
export const ACCEPTED_FILE_ACCEPT =
  ".docx,.pdf,.png,.jpg,.jpeg,.webp,.gif," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/pdf,image/png,image/jpeg,image/webp,image/gif";

// Anthropic accepts these image media types as base64 blocks.
const IMAGE_MEDIA_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Chunked so we don't blow the argument limit on String.fromCharCode for
  // large files.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Turn an attached file into a Claude content block. */
export async function fileToContentBlock(file: File): Promise<ContentBlock> {
  const ext = extOf(file.name);
  const isDocx =
    ext === "docx" || file.type.includes("wordprocessingml");
  const isPdf = ext === "pdf" || file.type === "application/pdf";
  const imageMedia =
    IMAGE_MEDIA_TYPES[ext] ??
    (file.type.startsWith("image/") ? file.type : null);

  if (isDocx) {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return {
      type: "text",
      text: `Reference document "${file.name}" (extracted text):\n\n${value ?? ""}`,
    };
  }
  if (isPdf) {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: await fileToBase64(file),
      },
    };
  }
  if (imageMedia) {
    return {
      type: "image",
      source: { type: "base64", media_type: imageMedia, data: await fileToBase64(file) },
    };
  }
  throw new Error(
    `Can't read "${file.name}" — attach a .docx, PDF, or image (PNG/JPG/WebP/GIF).`
  );
}

const SYSTEM_PROMPT = [
  "You are drafting a legal document for an Indian advocate's case file.",
  "Use any attached reference document or image as source material and context.",
  "Follow the advocate's instructions precisely and produce a complete, filing-ready document.",
  "When the document type calls for it, match the formal register and structure of Indian court filings — court caption, parties, numbered body paragraphs, prayer, and signature block.",
  "Output ONLY the document text. No preamble, no explanation, no markdown code fences. Separate paragraphs with a blank line.",
].join("\n");

export async function generateLiveDocument(args: {
  context: string;
  file?: File | null;
  caseRow?: { title: string; court: string | null; case_no: string | null } | null;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured — set VITE_ANTHROPIC_API_KEY in .env.local to generate live documents. Pilot keys are exposed to the browser; production should proxy through a Supabase Edge Function."
    );
  }

  const content: ContentBlock[] = [];
  if (args.file) content.push(await fileToContentBlock(args.file));

  const caseLines: string[] = [];
  if (args.caseRow) {
    if (args.caseRow.title) caseLines.push(`Case: ${args.caseRow.title}`);
    if (args.caseRow.court) caseLines.push(`Court: ${args.caseRow.court}`);
    if (args.caseRow.case_no) caseLines.push(`Case number: ${args.caseRow.case_no}`);
  }
  const caseBlock = caseLines.length
    ? `Case details:\n${caseLines.join("\n")}\n\n`
    : "";

  content.push({
    type: "text",
    text: `${caseBlock}Instructions for the document to draft:\n\n${args.context}`,
  });

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
    signal: args.signal,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = json.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned an empty document.");
  return text;
}
