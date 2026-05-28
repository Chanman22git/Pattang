import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDocument } from "../lib/documents";
import {
  generateDocxFromText,
  safeFilename,
  triggerDownload,
} from "../lib/docx-generator";
import {
  ACCEPTED_FILE_ACCEPT,
  generateLiveDocument,
} from "../lib/live-document";
import { hasAnthropicKey } from "../lib/template-extraction";
import { readError } from "../lib/errors";
import type { CaseRow } from "../lib/types";

/**
 * Live document — draft without a template.
 *   1. (optional) attach a source file: .docx / PDF / image
 *   2. write the instructions / body for what to draft
 *   3. generate → preview → save to the case + download .docx
 *
 * Inline editing of the generated draft is backlogged; for now the advocate
 * edits the downloaded .docx in Word.
 */

type Phase = "compose" | "generating" | "preview";

export default function LiveDocumentForm({
  caseRow,
  onBack,
}: {
  caseRow: CaseRow;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const aiAvailable = hasAnthropicKey();

  const [title, setTitle] = useState(`Live document — ${caseRow.title}`);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canGenerate = aiAvailable && context.trim().length > 0;

  async function onGenerate() {
    if (!canGenerate) return;
    setError(null);
    setPhase("generating");
    try {
      const text = await generateLiveDocument({
        context: context.trim(),
        file,
        caseRow,
      });
      setDraft(text);
      setPhase("preview");
    } catch (err) {
      setError(readError(err));
      setPhase("compose");
    }
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const finalTitle = title.trim() || `Live document — ${caseRow.title}`;
      await createDocument({
        case_id: caseRow.id,
        template_id: null,
        title: finalTitle,
        gdoc_id: null,
        gdoc_url: null,
        status: "draft",
        field_values: {
          kind: "live",
          context: context.trim(),
          source_file_name: file?.name ?? "",
          body: draft,
        },
      });
      const blob = await generateDocxFromText(finalTitle, draft);
      triggerDownload(blob, safeFilename(finalTitle, "docx"));
      navigate(`/cases/${caseRow.id}`);
    } catch (err) {
      setError(readError(err));
      setSaving(false);
    }
  }

  return (
    <section style={{ maxWidth: 820 }}>
      <button
        type="button"
        className="vc-link"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 12.5,
          color: "#6B6358",
          marginBottom: 14,
        }}
      >
        ← Choose a different method
      </button>

      {!aiAvailable && (
        <Notice tone="warn">
          Live generation needs an Anthropic key. Set{" "}
          <span className="font-mono">VITE_ANTHROPIC_API_KEY</span> in{" "}
          <span className="font-mono">.env.local</span> and restart the dev
          server. (Pilot keys run in the browser; production should proxy
          through a Supabase Edge Function.)
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      {phase !== "preview" && (
        <>
          <Field
            label="Source document"
            hint="Optional · .docx, PDF, or image — used as reference"
          >
            <FileDrop file={file} onFile={setFile} disabled={phase === "generating"} />
          </Field>

          <Field
            label="What should this document say?"
            hint="Instructions, facts, parties, tone — the more specific, the better"
          >
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={10}
              disabled={phase === "generating"}
              className="vc-input"
              style={{
                width: "100%",
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              placeholder={`e.g. Draft a memo of "not pressing" the suit, stating the parties have settled and the plaintiff has received the settlement amount in full. Plaintiff: …  Defendant: …  Amount: …`}
            />
          </Field>

          <Field label="Title" hint="Used as the .docx filename">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={phase === "generating"}
              className="vc-input"
              style={{ width: "100%", fontSize: 14 }}
            />
          </Field>

          <Footer>
            <button type="button" className="vc-btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button
              type="button"
              className="vc-btn-primary"
              onClick={onGenerate}
              disabled={!canGenerate || phase === "generating"}
              title={
                !aiAvailable
                  ? "Set VITE_ANTHROPIC_API_KEY to enable generation"
                  : !context.trim()
                  ? "Write the instructions first"
                  : undefined
              }
            >
              {phase === "generating" ? "Generating…" : "Generate draft"}
            </button>
          </Footer>
        </>
      )}

      {phase === "preview" && (
        <>
          <div
            className="uppercase font-medium text-ink-3"
            style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 8 }}
          >
            Generated draft · review before saving
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "0.5px solid rgba(90,58,31,0.18)",
              borderRadius: 2,
              padding: "20px 24px",
              maxHeight: 460,
              overflow: "auto",
            }}
          >
            <pre
              className="font-serif text-ink"
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "Spectral, Georgia, serif",
              }}
            >
              {draft}
            </pre>
          </div>
          <p
            className="text-ink-3 italic"
            style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.55 }}
          >
            Inline editing is coming — for now, fine-tune the wording in Word
            after downloading.
          </p>

          <Footer>
            <button
              type="button"
              className="vc-btn-secondary"
              onClick={() => setPhase("compose")}
              disabled={saving}
            >
              ← Edit instructions
            </button>
            <div className="flex items-center" style={{ gap: 10 }}>
              <button
                type="button"
                className="vc-btn-secondary"
                onClick={onGenerate}
                disabled={saving}
              >
                Regenerate
              </button>
              <button
                type="button"
                className="vc-btn-primary"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save & download .docx"}
              </button>
            </div>
          </Footer>
        </>
      )}
    </section>
  );
}

// ── pieces ────────────────────────────────────────────────────────────────

function FileDrop({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  if (file) {
    return (
      <div
        className="flex items-center justify-between"
        style={{
          background: "#FAF8F3",
          border: "0.5px solid rgba(90,58,31,0.18)",
          borderRadius: 2,
          padding: "10px 14px",
        }}
      >
        <span
          className="font-serif text-ink truncate"
          style={{ fontSize: 13.5, fontWeight: 500 }}
          title={file.name}
        >
          {file.name}
        </span>
        <button
          type="button"
          className="vc-iconbtn font-mono text-seal"
          style={{ fontSize: 13, padding: "4px 8px", color: "#4A1818" }}
          onClick={() => onFile(null)}
          disabled={disabled}
          title="Remove file"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          if (!disabled) onFile(e.dataTransfer.files?.[0] ?? null);
        }}
        style={{
          cursor: disabled ? "default" : "pointer",
          background: hover ? "rgba(184,134,47,0.07)" : "#FAF8F3",
          border: `0.5px dashed ${hover ? "#B8862F" : "#5A3A1F"}`,
          borderRadius: 2,
          padding: "18px 20px",
          textAlign: "center",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div className="text-ink-2" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Drop a file or <span className="vc-link">choose one</span>
        </div>
        <div className="text-ink-3 italic" style={{ fontSize: 11.5, marginTop: 4 }}>
          .docx, PDF, or image · optional
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        className="font-medium text-ink"
        style={{ fontSize: 13, marginBottom: 6 }}
      >
        {label}
        {hint && (
          <span className="text-ink-3 font-normal" style={{ marginLeft: 8, fontSize: 12 }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        marginTop: 18,
        paddingTop: 14,
        borderTop: "0.5px solid rgba(90,58,31,0.18)",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warn" | "error";
  children: React.ReactNode;
}) {
  const style =
    tone === "error"
      ? { background: "#EAD9D9", border: "0.5px solid #4A1818", color: "#4A1818" }
      : { background: "#FAF3E3", border: "0.5px solid #B8862F", color: "#6B5326" };
  return (
    <div
      style={{
        ...style,
        borderRadius: 2,
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.55,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}
