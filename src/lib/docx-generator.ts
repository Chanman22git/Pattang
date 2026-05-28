import type { FieldValues, TemplateWithFields } from "./types";

/**
 * Phase 1a chunk 3: the PRD's no-OAuth checkpoint (§4.1, §4.2).
 *
 * Takes a template's body — plain text with `{{label}}` placeholders — and
 * the form values the advocate just submitted, and produces a .docx Blob.
 * Substitution is literal: `{{Recipient name}}` is replaced with whatever
 * was entered under that label. If a placeholder has no matching value we
 * leave a visible `[Recipient name]` marker so the advocate spots it before
 * filing.
 *
 * Formatting is intentionally minimal — paragraphs and simple line breaks.
 * The advocate edits the rich version in Word / Google Docs. Phase 1b
 * replaces this with a Google Doc created via the Docs API.
 *
 * The `docx` library is ~250 KB minified, and it's only used here. We
 * dynamic-import it so the rest of the app — sign-in, cases list, template
 * editing — doesn't pay for it on first load.
 */

const PLACEHOLDER_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

export async function generateDocxBlob(
  template: TemplateWithFields,
  values: FieldValues,
  title: string
): Promise<Blob> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
  } = docx;

  const body = template.structure?.body ?? "";

  const children = [
    titleParagraph(title, { Paragraph, TextRun, HeadingLevel, AlignmentType }),
    new Paragraph({ children: [new TextRun("")] }), // spacer
    ...renderBody(body, values, { Paragraph, TextRun }),
  ];

  return packDocx(
    { Document, Packer },
    title,
    `Generated from template "${template.name}" (${template.doc_type})`,
    children
  );
}

/**
 * Live documents: the body is free text produced by the model rather than a
 * placeholder template. Same page shell as the template path — title heading
 * plus one paragraph per line — so both flows yield consistent .docx files.
 */
export async function generateDocxFromText(
  title: string,
  body: string
): Promise<Blob> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    docx;

  const children = [
    titleParagraph(title, { Paragraph, TextRun, HeadingLevel, AlignmentType }),
    new Paragraph({ children: [new TextRun("")] }), // spacer
    ...textToParagraphs(body, { Paragraph, TextRun }),
  ];

  return packDocx({ Document, Packer }, title, "Live document", children);
}

function titleParagraph(
  title: string,
  ctor: {
    Paragraph: typeof import("docx").Paragraph;
    TextRun: typeof import("docx").TextRun;
    HeadingLevel: typeof import("docx").HeadingLevel;
    AlignmentType: typeof import("docx").AlignmentType;
  }
) {
  return new ctor.Paragraph({
    heading: ctor.HeadingLevel.HEADING_1,
    alignment: ctor.AlignmentType.CENTER,
    children: [new ctor.TextRun({ text: title, bold: true })],
  });
}

function packDocx(
  ctor: { Document: typeof import("docx").Document; Packer: typeof import("docx").Packer },
  title: string,
  description: string,
  children: import("docx").Paragraph[]
): Promise<Blob> {
  const doc = new ctor.Document({
    creator: "Pattang",
    title,
    description,
    sections: [
      {
        properties: {
          page: {
            // US Letter; advocates working in India often see A4 — Word
            // resizes happily either way. Picking one and being explicit
            // matters more than which.
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  return ctor.Packer.toBlob(doc);
}

/** Split free text into Paragraphs — one per line, blank lines preserved. */
function textToParagraphs(
  body: string,
  ctor: {
    Paragraph: typeof import("docx").Paragraph;
    TextRun: typeof import("docx").TextRun;
  }
) {
  return body
    .split(/\r?\n/)
    .map((line) => new ctor.Paragraph({ children: [new ctor.TextRun(line)] }));
}

/** Split the body into Paragraphs, substituting `{{label}}` placeholders.
 *  Each newline starts a new Paragraph; blank lines become empty
 *  paragraphs so vertical spacing roughly matches the source. */
function renderBody(
  body: string,
  values: FieldValues,
  ctor: {
    Paragraph: typeof import("docx").Paragraph;
    TextRun: typeof import("docx").TextRun;
  }
) {
  const lines = body.split(/\r?\n/);
  return lines.map((line) => {
    const substituted = line.replace(PLACEHOLDER_RE, (_, raw) => {
      const label = String(raw).trim();
      const v = values[label];
      if (v == null || v === "") return `[${label}]`;
      return v;
    });
    return new ctor.Paragraph({ children: [new ctor.TextRun(substituted)] });
  });
}

/** Trigger a browser download for a Blob. Works inside Vite + GitHub Pages
 *  with no extra plumbing. */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the click handler a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Safe filename — no slashes, no double quotes, trimmed length. */
export function safeFilename(title: string, ext: string): string {
  const base =
    title
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "document";
  return `${base}.${ext}`;
}
