import { useMemo, useRef, useState } from "react";
import {
  applyRedactions,
  findCandidates,
  hasAnthropicKey,
  parseDocx,
  refineWithClaude,
  type CandidateKind,
  type CandidateSpan,
} from "../lib/template-extraction";
import type {
  TemplateFieldCategory,
  TemplateFieldInputType,
  TemplateFieldInsert,
} from "../lib/types";
import { readError } from "../lib/errors";

/**
 * Learn-from-sample — upload a DOCX filing, see the system's guesses at
 * which spans are variables, confirm / re-categorise each, then apply the
 * redacted body + fields to the parent template form.
 */

type Props = {
  onApply: (result: { body: string; fields: TemplateFieldInsert[] }) => void;
};

type ParseState = {
  fileName: string;
  text: string;
  warnings: string[];
  candidates: CandidateSpan[];
};

export default function TemplateLearnFromSample({ onApply }: Props) {
  const [state, setState] = useState<ParseState | null>(null);
  const [busy, setBusy] = useState<null | "parsing" | "refining">(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canRefine = hasAnthropicKey();

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setBusy("parsing");
    try {
      const { text, warnings } = await parseDocx(file);
      const candidates = findCandidates(text);
      setState({ fileName: file.name, text, warnings, candidates });
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(null);
    }
  }

  function updateCandidate(id: string, patch: Partial<CandidateSpan>) {
    setState((s) =>
      s
        ? {
            ...s,
            candidates: s.candidates.map((c) =>
              c.id === id ? { ...c, ...patch } : c
            ),
          }
        : s
    );
  }

  async function onRefine() {
    if (!state) return;
    setError(null);
    setBusy("refining");
    try {
      const refined = await refineWithClaude({ text: state.text });
      // Replace the heuristic state with Claude's redacted body + fields.
      // The advocate sees the new body in the preview pane (no candidate
      // spans — Claude already redacted) and can apply or reset.
      setState({
        fileName: state.fileName,
        text: refined.body,
        warnings: [...state.warnings, ...refined.warnings],
        candidates: [],
      });
      // Store the AI fields on a side channel via window so onApplyAI()
      // can pick them up. Avoiding a separate state slot to keep the
      // component small.
      (window as unknown as { __vc_ai_fields?: TemplateFieldInsert[] }).__vc_ai_fields =
        refined.fields;
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(null);
    }
  }

  function onApplyClick() {
    if (!state) return;
    const aiFields = (
      window as unknown as { __vc_ai_fields?: TemplateFieldInsert[] }
    ).__vc_ai_fields;
    if (aiFields && aiFields.length) {
      // After a refine, the text is already the redacted body and no
      // candidate spans are left. Use those stashed fields directly.
      onApply({ body: state.text, fields: aiFields });
      (window as unknown as { __vc_ai_fields?: TemplateFieldInsert[] }).__vc_ai_fields =
        undefined;
    } else {
      onApply(applyRedactions(state.text, state.candidates));
    }
    reset();
  }

  function reset() {
    setState(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        className="font-serif font-medium text-ink m-0"
        style={{
          fontSize: 20,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        Learn from a sample
      </h2>
      <p
        className="text-ink-2 italic"
        style={{ fontSize: 13, marginBottom: 14, maxWidth: 640 }}
      >
        Attach a filed document. The system reads its structure, points out
        the spans that change from case to case, and proposes them as
        fields. Your sample is parsed in the browser — nothing leaves the
        page unless you click <span className="font-medium">Refine with AI</span>.
      </p>

      {!state && (
        <DropZone
          busy={busy === "parsing"}
          onFile={handleFile}
          onOpenPicker={() => inputRef.current?.click()}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <div
          className="text-seal"
          style={{
            marginTop: 12,
            background: "#EAD9D9",
            border: "0.5px solid #4A1818",
            borderRadius: 2,
            padding: "10px 14px",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {state && (
        <ParseResult
          state={state}
          busy={busy}
          canRefine={canRefine}
          onUpdate={updateCandidate}
          onRefine={onRefine}
          onApply={onApplyClick}
          onDiscard={reset}
        />
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────

function DropZone({
  busy,
  onFile,
  onOpenPicker,
}: {
  busy: boolean;
  onFile: (f: File | null | undefined) => void;
  onOpenPicker: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onOpenPicker}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const file = e.dataTransfer.files?.[0];
        onFile(file);
      }}
      style={{
        cursor: busy ? "wait" : "pointer",
        background: hover ? "rgba(184,134,47,0.07)" : "#FAF8F3",
        border: `0.5px dashed ${hover ? "#B8862F" : "#5A3A1F"}`,
        borderRadius: 2,
        padding: "32px 20px",
        textAlign: "center",
        transition: "background 120ms ease-out, border-color 120ms ease-out",
      }}
    >
      <div
        className="font-serif text-ink"
        style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}
      >
        {busy ? "Parsing…" : "Drop a sample filing here"}
      </div>
      <div
        className="text-ink-2"
        style={{ fontSize: 13, marginTop: 6, lineHeight: 1.55 }}
      >
        or <span className="vc-link">click to choose a .docx</span>
      </div>
      <div
        className="text-ink-3 italic"
        style={{ fontSize: 12, marginTop: 10 }}
      >
        Word documents only · scanned PDFs land in a later pass
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────

function ParseResult({
  state,
  busy,
  canRefine,
  onUpdate,
  onRefine,
  onApply,
  onDiscard,
}: {
  state: ParseState;
  busy: null | "parsing" | "refining";
  canRefine: boolean;
  onUpdate: (id: string, patch: Partial<CandidateSpan>) => void;
  onRefine: () => void;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const accepted = state.candidates.filter((c) => c.accepted);
  const grouped = useMemo(
    () => groupByCategory(state.candidates),
    [state.candidates]
  );

  return (
    <div
      style={{
        marginTop: 4,
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
      }}
    >
      <header
        className="flex items-baseline justify-between"
        style={{
          padding: "14px 18px",
          borderBottom: "0.5px solid rgba(90,58,31,0.18)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="uppercase font-medium text-ink-3"
            style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 4 }}
          >
            Parsed
          </div>
          <div
            className="font-serif text-ink truncate"
            style={{ fontSize: 16, fontWeight: 500 }}
            title={state.fileName}
          >
            {state.fileName}
          </div>
          <div
            className="font-mono text-ink-3"
            style={{ fontSize: 11.5, marginTop: 4, letterSpacing: "0.02em" }}
          >
            {state.text.length.toLocaleString()} chars ·{" "}
            {accepted.length}/{state.candidates.length} candidates accepted
            {state.candidates.length === 0 &&
              " · Claude can find spans regex missed"}
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {canRefine && (
            <button
              className="vc-btn-secondary"
              onClick={onRefine}
              disabled={busy !== null}
              title="Send the parsed text to Claude for a cleaner classification"
            >
              {busy === "refining" ? "Refining…" : "Refine with AI"}
            </button>
          )}
          <button
            className="vc-btn-secondary"
            onClick={onDiscard}
            disabled={busy !== null}
          >
            Discard
          </button>
          <button
            className="vc-btn-primary"
            onClick={onApply}
            disabled={busy !== null}
          >
            Apply to template
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 0,
        }}
      >
        <BodyPreview text={state.text} candidates={state.candidates} />
        <CandidateRail
          grouped={grouped}
          onUpdate={onUpdate}
          hint={
            state.candidates.length === 0
              ? "No regex candidates found. Click Refine with AI for a deeper pass."
              : undefined
          }
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────

function BodyPreview({
  text,
  candidates,
}: {
  text: string;
  candidates: CandidateSpan[];
}) {
  // Render the source text with each accepted candidate wrapped in a
  // brass-tinted span. Rejected candidates show with a soft strike-through.
  const sorted = [...candidates].sort((a, b) => a.start - b.start);
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  for (const span of sorted) {
    if (cursor < span.start)
      pieces.push(<span key={`t${cursor}`}>{text.slice(cursor, span.start)}</span>);
    pieces.push(
      <span
        key={span.id}
        title={`${span.suggestedLabel} · ${span.suggestedCategory}`}
        style={{
          background: span.accepted
            ? "rgba(184,134,47,0.18)"
            : "transparent",
          color: span.accepted ? "#1A1F2E" : "#A8956F",
          padding: "0 2px",
          borderRadius: 2,
          textDecoration: span.accepted ? "none" : "line-through",
        }}
      >
        {text.slice(span.start, span.end)}
      </span>
    );
    cursor = span.end;
  }
  if (cursor < text.length)
    pieces.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>);

  return (
    <div
      style={{
        padding: "18px 20px",
        borderRight: "0.5px solid rgba(90,58,31,0.18)",
        maxHeight: 480,
        overflow: "auto",
        fontFamily: "Spectral, Georgia, serif",
        fontSize: 13.5,
        color: "#1A1F2E",
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
      }}
    >
      {pieces.length ? pieces : <span className="text-ink-3 italic">Empty</span>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────

function CandidateRail({
  grouped,
  onUpdate,
  hint,
}: {
  grouped: Record<TemplateFieldCategory, CandidateSpan[]>;
  onUpdate: (id: string, patch: Partial<CandidateSpan>) => void;
  hint?: string;
}) {
  const sections: Array<{
    key: TemplateFieldCategory;
    label: string;
    sub: string;
    dot: string;
  }> = [
    {
      key: "basic",
      label: "Basic",
      sub: "Asked each time",
      dot: "#B8862F",
    },
    {
      key: "prefill",
      label: "Standard · prefilled",
      sub: "From the advocate's profile",
      dot: "#2D4A3E",
    },
    {
      key: "case_specific",
      label: "Case-specific",
      sub: "Per-case facts and identifiers",
      dot: "#4A1818",
    },
  ];

  return (
    <div
      style={{
        padding: "12px 16px 18px",
        maxHeight: 480,
        overflow: "auto",
        background: "#FFFFFF",
      }}
    >
      {hint && (
        <div
          className="text-ink-3 italic"
          style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.55 }}
        >
          {hint}
        </div>
      )}
      {sections.map((s) => (
        <div key={s.key} style={{ marginBottom: 16 }}>
          <div
            className="flex items-center"
            style={{ gap: 8, marginBottom: 6 }}
          >
            <span style={{ width: 6, height: 6, background: s.dot }} />
            <div
              className="font-serif text-ink"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {s.label}
            </div>
            <div
              className="font-mono text-ink-3"
              style={{
                fontSize: 11,
                marginLeft: "auto",
                letterSpacing: "0.02em",
              }}
            >
              {grouped[s.key].length}
            </div>
          </div>
          <div
            className="text-ink-2 italic"
            style={{ fontSize: 11.5, marginBottom: 8 }}
          >
            {s.sub}
          </div>
          {grouped[s.key].length === 0 ? (
            <div className="text-ink-3" style={{ fontSize: 12, fontStyle: "italic" }}>
              None
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {grouped[s.key].map((c) => (
                <CandidateRow key={c.id} c={c} onUpdate={onUpdate} />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function CandidateRow({
  c,
  onUpdate,
}: {
  c: CandidateSpan;
  onUpdate: (id: string, patch: Partial<CandidateSpan>) => void;
}) {
  return (
    <li
      style={{
        padding: "8px 0",
        borderTop: "0.5px dashed rgba(90,58,31,0.18)",
      }}
    >
      <div className="flex items-baseline" style={{ gap: 8 }}>
        <input
          type="checkbox"
          checked={c.accepted}
          onChange={(e) => onUpdate(c.id, { accepted: e.target.checked })}
          style={{ marginTop: 2, accentColor: "#1A1F2E" }}
        />
        <input
          value={c.suggestedLabel}
          onChange={(e) => onUpdate(c.id, { suggestedLabel: e.target.value })}
          className="vc-input"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            padding: "4px 8px",
          }}
        />
      </div>
      <div
        className="flex items-center"
        style={{ gap: 8, marginTop: 6, marginLeft: 24 }}
      >
        <KindTag kind={c.kind} />
        <code
          className="font-mono text-ink-2 truncate"
          style={{
            fontSize: 11,
            color: "#6B6358",
            flex: 1,
            minWidth: 0,
          }}
          title={c.text}
        >
          {c.text}
        </code>
        <select
          value={c.suggestedCategory}
          onChange={(e) =>
            onUpdate(c.id, {
              suggestedCategory: e.target.value as TemplateFieldCategory,
            })
          }
          className="vc-input"
          style={{ fontSize: 11.5, padding: "3px 6px" }}
        >
          <option value="basic">Basic</option>
          <option value="prefill">Prefill</option>
          <option value="case_specific">Case-specific</option>
        </select>
        <select
          value={c.suggestedInputType}
          onChange={(e) =>
            onUpdate(c.id, {
              suggestedInputType: e.target.value as TemplateFieldInputType,
            })
          }
          className="vc-input"
          style={{ fontSize: 11.5, padding: "3px 6px" }}
        >
          <option value="text">text</option>
          <option value="textarea">textarea</option>
          <option value="date">date</option>
          <option value="number">number</option>
        </select>
      </div>
    </li>
  );
}

function KindTag({ kind }: { kind: CandidateKind }) {
  const labels: Record<CandidateKind, string> = {
    date: "DATE",
    case_no: "CASE NO.",
    cnr: "CNR",
    money: "AMOUNT",
    email: "EMAIL",
    phone: "PHONE",
    survey_no: "SY. NO.",
    name: "NAME",
    address: "ADDR.",
    ai_other: "AI",
  };
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 9.5,
        color: "#A8956F",
        letterSpacing: "0.08em",
        padding: "1px 4px",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
      }}
    >
      {labels[kind]}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────

function groupByCategory(
  candidates: CandidateSpan[]
): Record<TemplateFieldCategory, CandidateSpan[]> {
  const out: Record<TemplateFieldCategory, CandidateSpan[]> = {
    basic: [],
    prefill: [],
    case_specific: [],
  };
  for (const c of candidates) out[c.suggestedCategory].push(c);
  return out;
}
