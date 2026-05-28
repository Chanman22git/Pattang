import { useRef, useState } from "react";
import {
  applyRedactions,
  extractSections,
  findCandidates,
  hasAnthropicKey,
  parseDocx,
  singleSection,
  standardiseDirections,
  type Section,
  type StandardisedDirections,
} from "../lib/template-extraction";
import type { TemplateFieldInsert } from "../lib/types";
import { readError } from "../lib/errors";

/**
 * Learn from a sample — four-step wizard.
 *
 *   1. Attach .docx
 *   2. Confirm document structure (AI proposes sections; advocate edits)
 *   3. Write directions (lineage of sections at top; free text below)
 *   4. Confirm standardised directions (AI rewrite; advocate confirms)
 *
 * On confirm: pushes body + fields + sections + directions to the parent.
 * Heuristic field extraction still runs silently so the existing Fields
 * editor populates without a separate confirmation step.
 */

type ApplyPayload = {
  body: string;
  fields: TemplateFieldInsert[];
  sections: Section[];
  /** Standardised by Claude if available, otherwise the raw text. */
  directions: string;
};

type Props = {
  onApply: (result: ApplyPayload) => void;
};

type WizardState =
  | { step: "upload" }
  | {
      step: "sectioning";
      fileName: string;
      text: string;
      sections: Section[];
      busy: boolean;
      aiUsed: boolean;
    }
  | {
      step: "directions";
      fileName: string;
      text: string;
      sections: Section[];
      directions: string;
      aiUsed: boolean;
    }
  | {
      step: "confirm";
      fileName: string;
      text: string;
      sections: Section[];
      directions: string;
      standardised: StandardisedDirections | null;
      busy: boolean;
      aiUsed: boolean;
    };

const STEPS = [
  { key: "upload", label: "Attach" },
  { key: "sectioning", label: "Structure" },
  { key: "directions", label: "Directions" },
  { key: "confirm", label: "Confirm" },
] as const;

export default function TemplateLearnFromSample({ onApply }: Props) {
  const [state, setState] = useState<WizardState>({ step: "upload" });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = hasAnthropicKey();

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    try {
      const { text } = await parseDocx(file);
      // Enter sectioning step in busy mode — kick off AI sectioning if
      // available, else start with a single Body section the advocate can split.
      if (aiAvailable) {
        setState({
          step: "sectioning",
          fileName: file.name,
          text,
          sections: [],
          busy: true,
          aiUsed: true,
        });
        try {
          const { sections } = await extractSections({ text });
          setState((s) =>
            s.step === "sectioning"
              ? { ...s, sections, busy: false }
              : s
          );
        } catch (err) {
          setError(readError(err));
          setState({
            step: "sectioning",
            fileName: file.name,
            text,
            sections: singleSection(text),
            busy: false,
            aiUsed: false,
          });
        }
      } else {
        setState({
          step: "sectioning",
          fileName: file.name,
          text,
          sections: singleSection(text),
          busy: false,
          aiUsed: false,
        });
      }
    } catch (err) {
      setError(readError(err));
    }
  }

  function reset() {
    setError(null);
    setState({ step: "upload" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function goBack() {
    setError(null);
    if (state.step === "sectioning") return reset();
    if (state.step === "directions") {
      setState({
        step: "sectioning",
        fileName: state.fileName,
        text: state.text,
        sections: state.sections,
        busy: false,
        aiUsed: state.aiUsed,
      });
      return;
    }
    if (state.step === "confirm") {
      setState({
        step: "directions",
        fileName: state.fileName,
        text: state.text,
        sections: state.sections,
        directions: state.directions,
        aiUsed: state.aiUsed,
      });
      return;
    }
  }

  function goNextFromSectioning() {
    if (state.step !== "sectioning") return;
    if (state.sections.length === 0) {
      setError("At least one section is needed.");
      return;
    }
    setState({
      step: "directions",
      fileName: state.fileName,
      text: state.text,
      sections: state.sections,
      directions: "",
      aiUsed: state.aiUsed,
    });
  }

  async function goNextFromDirections() {
    if (state.step !== "directions") return;
    setError(null);
    const directions = state.directions.trim();
    if (!directions) {
      // No instructions written — skip the AI confirmation and apply directly.
      finalise({
        sections: state.sections,
        directions: "",
        text: state.text,
      });
      return;
    }
    if (!aiAvailable) {
      // No key — save the raw directions and apply.
      finalise({
        sections: state.sections,
        directions,
        text: state.text,
      });
      return;
    }
    // Enter confirm step in busy mode while Claude standardises.
    setState({
      step: "confirm",
      fileName: state.fileName,
      text: state.text,
      sections: state.sections,
      directions,
      standardised: null,
      busy: true,
      aiUsed: state.aiUsed,
    });
    try {
      const standardised = await standardiseDirections({
        rawDirections: directions,
        sections: state.sections,
      });
      setState((s) =>
        s.step === "confirm"
          ? { ...s, standardised, busy: false }
          : s
      );
    } catch (err) {
      setError(readError(err));
      setState((s) =>
        s.step === "confirm" ? { ...s, busy: false } : s
      );
    }
  }

  function finalise(input: {
    sections: Section[];
    directions: string;
    text: string;
  }) {
    const candidates = findCandidates(input.text);
    const { body, fields } = applyRedactions(input.text, candidates);
    onApply({
      body,
      fields,
      sections: input.sections,
      directions: input.directions,
    });
    reset();
  }

  function onConfirmStandardised() {
    if (state.step !== "confirm") return;
    finalise({
      sections: state.sections,
      directions: state.standardised?.standardised ?? state.directions,
      text: state.text,
    });
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
        Attach a filed document. The system reads its structure, lets you
        confirm or edit the sections, and turns your free-text notes into a
        clean brief for how this template should be used.
      </p>

      <Stepper current={state.step} />

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

      {state.step === "upload" && (
        <UploadStep
          aiAvailable={aiAvailable}
          onOpenPicker={() => inputRef.current?.click()}
          onFile={handleFile}
        />
      )}

      {state.step === "sectioning" && (
        <SectionStep
          state={state}
          onChangeSections={(sections) =>
            setState((s) => (s.step === "sectioning" ? { ...s, sections } : s))
          }
          onBack={goBack}
          onNext={goNextFromSectioning}
          aiAvailable={aiAvailable}
        />
      )}

      {state.step === "directions" && (
        <DirectionsStep
          state={state}
          onChange={(directions) =>
            setState((s) =>
              s.step === "directions" ? { ...s, directions } : s
            )
          }
          onBack={goBack}
          onNext={goNextFromDirections}
          aiAvailable={aiAvailable}
        />
      )}

      {state.step === "confirm" && (
        <ConfirmStep
          state={state}
          onBack={goBack}
          onConfirm={onConfirmStandardised}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Stepper
// ────────────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: WizardState["step"] }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol
      className="flex items-center"
      style={{
        listStyle: "none",
        padding: 0,
        margin: "0 0 18px",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {STEPS.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        const ink = isActive ? "#FAF8F3" : isDone ? "#1A1F2E" : "#A8956F";
        const bg = isActive ? "#1A1F2E" : "transparent";
        const border = isActive
          ? "1px solid #1A1F2E"
          : isDone
          ? "1px solid rgba(90,58,31,0.4)"
          : "1px dashed rgba(90,58,31,0.4)";
        return (
          <li key={s.key} className="flex items-center" style={{ gap: 6 }}>
            <span
              className="flex items-center"
              style={{
                gap: 8,
                padding: "5px 12px",
                borderRadius: 2,
                background: bg,
                border,
                color: ink,
                fontSize: 12.5,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 10.5,
                  opacity: 0.7,
                  letterSpacing: "0.02em",
                }}
              >
                {i + 1}
              </span>
              <span>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span
                className="text-ink-3"
                style={{ fontSize: 14, fontFamily: "Spectral, Georgia, serif" }}
              >
                ›
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Step 1 — Upload
// ────────────────────────────────────────────────────────────────────────

function UploadStep({
  aiAvailable,
  onOpenPicker,
  onFile,
}: {
  aiAvailable: boolean;
  onOpenPicker: () => void;
  onFile: (f: File | null | undefined) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <>
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
          onFile(e.dataTransfer.files?.[0]);
        }}
        style={{
          cursor: "pointer",
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
          Drop a sample filing here
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
      {!aiAvailable && (
        <div
          className="text-ink-3 italic"
          style={{
            marginTop: 10,
            fontSize: 12.5,
            lineHeight: 1.55,
          }}
        >
          Anthropic key not set. The wizard still works, but you'll define
          sections yourself and the final standardisation step is skipped.
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Step 2 — Sectioning
// ────────────────────────────────────────────────────────────────────────

function SectionStep({
  state,
  onChangeSections,
  onBack,
  onNext,
  aiAvailable,
}: {
  state: Extract<WizardState, { step: "sectioning" }>;
  onChangeSections: (sections: Section[]) => void;
  onBack: () => void;
  onNext: () => void;
  aiAvailable: boolean;
}) {
  function rename(id: string, label: string) {
    onChangeSections(
      state.sections.map((s) => (s.id === id ? { ...s, label } : s))
    );
  }
  function remove(id: string) {
    onChangeSections(state.sections.filter((s) => s.id !== id));
  }
  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...state.sections];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChangeSections(next);
  }
  function moveDown(idx: number) {
    if (idx >= state.sections.length - 1) return;
    const next = [...state.sections];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChangeSections(next);
  }
  function splitFromCaret(id: string, splitOffset: number) {
    const idx = state.sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const s = state.sections[idx];
    if (splitOffset <= 0 || splitOffset >= s.content.length) return;
    const a = { ...s, content: s.content.slice(0, splitOffset) };
    const b: Section = {
      id: `s${Date.now()}`,
      label: "New section",
      content: s.content.slice(splitOffset),
    };
    const next = [...state.sections];
    next.splice(idx, 1, a, b);
    onChangeSections(next);
  }

  return (
    <>
      <div
        style={{
          marginTop: 4,
          background: "#FAF8F3",
          border: "0.5px solid rgba(90,58,31,0.18)",
          borderRadius: 2,
          padding: "14px 18px",
          marginBottom: 14,
        }}
      >
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
          {state.text.length.toLocaleString()} chars · {state.sections.length}{" "}
          section{state.sections.length === 1 ? "" : "s"}
          {state.aiUsed ? " · proposed by AI" : " · manual"}
        </div>
      </div>

      {state.busy ? (
        <BusyCard label="Reading the document structure…" />
      ) : (
        <>
          {!aiAvailable && (
            <div
              className="text-ink-3 italic"
              style={{
                fontSize: 12.5,
                marginBottom: 12,
                lineHeight: 1.55,
              }}
            >
              No AI key — sectioning began with a single Body block. Use
              <span style={{ fontStyle: "normal" }}> Split here </span>
              to break it where you want, then label each piece.
            </div>
          )}
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {state.sections.map((s, i) => (
              <SectionRow
                key={s.id}
                section={s}
                index={i}
                last={i === state.sections.length - 1}
                onRename={(label) => rename(s.id, label)}
                onRemove={() => remove(s.id)}
                onUp={() => moveUp(i)}
                onDown={() => moveDown(i)}
                onSplit={(offset) => splitFromCaret(s.id, offset)}
              />
            ))}
          </ol>
        </>
      )}

      <WizardFooter
        leftLabel="Back"
        onLeft={onBack}
        rightLabel="Next"
        onRight={onNext}
        rightDisabled={state.busy || state.sections.length === 0}
      />
    </>
  );
}

function SectionRow({
  section,
  index,
  last,
  onRename,
  onRemove,
  onUp,
  onDown,
  onSplit,
}: {
  section: Section;
  index: number;
  last: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  onSplit: (offset: number) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  function splitAtCaret() {
    const el = textareaRef.current;
    if (!el) return;
    onSplit(el.selectionStart);
  }
  return (
    <li
      style={{
        padding: "12px 0",
        borderTop: index === 0 ? "0.5px solid rgba(90,58,31,0.18)" : "none",
        borderBottom: last ? "none" : "0.5px solid rgba(90,58,31,0.18)",
      }}
    >
      <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
        <span
          className="font-mono text-ink-3"
          style={{ fontSize: 11, width: 24, letterSpacing: "0.02em" }}
        >
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <input
          value={section.label}
          onChange={(e) => onRename(e.target.value)}
          className="vc-input"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 14,
            fontFamily: "Spectral, Georgia, serif",
            fontWeight: 500,
            padding: "5px 10px",
          }}
        />
        <button
          type="button"
          className="vc-iconbtn font-mono"
          style={{ fontSize: 12, padding: "4px 8px" }}
          onClick={onUp}
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="vc-iconbtn font-mono"
          style={{ fontSize: 12, padding: "4px 8px" }}
          onClick={onDown}
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          className="vc-iconbtn font-mono text-seal"
          style={{ fontSize: 13, padding: "4px 8px", color: "#4A1818" }}
          onClick={onRemove}
          title="Remove section"
        >
          ×
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={section.content}
        readOnly
        rows={Math.min(8, Math.max(2, section.content.split("\n").length))}
        className="vc-input font-serif"
        style={{
          width: "100%",
          fontSize: 13,
          lineHeight: 1.55,
          background: "#FFFFFF",
          color: "#1A1F2E",
        }}
        title="Click into the text and choose 'Split here' at the caret position"
      />
      <div
        className="flex items-center"
        style={{ gap: 12, marginTop: 6, fontSize: 11.5 }}
      >
        <button
          type="button"
          className="vc-link"
          style={{ fontSize: 11.5, background: "none", border: "none", padding: 0, cursor: "pointer", color: "#6B6358" }}
          onClick={splitAtCaret}
        >
          Split here
        </button>
        <span
          className="font-mono text-ink-3"
          style={{ fontSize: 11, letterSpacing: "0.02em" }}
        >
          {section.content.length} chars
        </span>
      </div>
    </li>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Step 3 — Directions
// ────────────────────────────────────────────────────────────────────────

function DirectionsStep({
  state,
  onChange,
  onBack,
  onNext,
  aiAvailable,
}: {
  state: Extract<WizardState, { step: "directions" }>;
  onChange: (directions: string) => void;
  onBack: () => void;
  onNext: () => void;
  aiAvailable: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertReference(label: string) {
    const el = textareaRef.current;
    const ref = `§${label}`;
    if (!el) {
      onChange(state.directions + (state.directions.endsWith(" ") ? "" : " ") + ref);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = state.directions.slice(0, start);
    const after = state.directions.slice(end);
    const insert =
      (before && !before.endsWith(" ") ? " " : "") +
      ref +
      (after && !after.startsWith(" ") ? " " : "");
    const next = before + insert + after;
    onChange(next);
    // restore caret right after the inserted reference
    requestAnimationFrame(() => {
      el.focus();
      const pos = (before + insert).length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <>
      <SectionLineage sections={state.sections} onPick={insertReference} />
      <p
        className="text-ink-3 italic"
        style={{ fontSize: 12, marginTop: 4, marginBottom: 10, lineHeight: 1.55 }}
      >
        Click any pill above to drop a <span style={{ fontStyle: "normal" }}>§Section</span>{" "}
        reference into your notes at the caret.
      </p>
      <textarea
        ref={textareaRef}
        value={state.directions}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="vc-input"
        style={{
          width: "100%",
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
        placeholder={`How should this template behave when used in a case?\n\nExamples:\n- In §Prayer, always include a request for costs.\n- §Statement of facts should be a single paragraph drawn from the case's confirmed facts.\n- Use the petitioner's address from the case profile when available.`}
      />
      {!aiAvailable && (
        <div
          className="text-ink-3 italic"
          style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55 }}
        >
          Without an Anthropic key, your notes are saved verbatim — the AI
          confirmation step is skipped.
        </div>
      )}
      <WizardFooter
        leftLabel="Back"
        onLeft={onBack}
        rightLabel={
          state.directions.trim()
            ? aiAvailable
              ? "Create template"
              : "Save & finish"
            : "Skip directions"
        }
        onRight={onNext}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Step 4 — Confirm standardised directions
// ────────────────────────────────────────────────────────────────────────

function ConfirmStep({
  state,
  onBack,
  onConfirm,
}: {
  state: Extract<WizardState, { step: "confirm" }>;
  onBack: () => void;
  onConfirm: () => void;
}) {
  if (state.busy)
    return (
      <>
        <BusyCard label="Reading your directions…" />
        <WizardFooter leftLabel="Back" onLeft={onBack} rightDisabled />
      </>
    );
  if (!state.standardised) {
    return (
      <>
        <div
          className="text-seal"
          style={{
            background: "#EAD9D9",
            border: "0.5px solid #4A1818",
            borderRadius: 2,
            padding: "12px 14px",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Couldn't standardise the directions. Go back and try again, or save
          the raw notes by clicking Confirm.
        </div>
        <WizardFooter
          leftLabel="Back"
          onLeft={onBack}
          rightLabel="Save raw"
          onRight={onConfirm}
        />
      </>
    );
  }
  return (
    <>
      <div
        style={{
          marginTop: 4,
          background: "#FAF8F3",
          border: "0.5px solid rgba(90,58,31,0.18)",
          borderRadius: 2,
          padding: "16px 20px",
          marginBottom: 12,
        }}
      >
        <div
          className="uppercase font-medium text-ink-3"
          style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 8 }}
        >
          What I understood
        </div>
        <div
          className="font-serif text-ink"
          style={{ fontSize: 14, lineHeight: 1.6 }}
        >
          {state.standardised.summary}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <SidePane label="Your notes" mono content={state.directions} />
        <SidePane
          label="Standardised brief"
          markdown
          content={state.standardised.standardised}
        />
      </div>

      <WizardFooter
        leftLabel="Back · edit notes"
        onLeft={onBack}
        rightLabel="Looks right · create template"
        onRight={onConfirm}
      />
    </>
  );
}

function SidePane({
  label,
  content,
  mono,
  markdown,
}: {
  label: string;
  content: string;
  mono?: boolean;
  markdown?: boolean;
}) {
  return (
    <div
      style={{
        background: markdown ? "#FAF8F3" : "#FFFFFF",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
        padding: "14px 18px",
      }}
    >
      <div
        className="uppercase font-medium text-ink-3"
        style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 8 }}
      >
        {label}
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          margin: 0,
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: mono
            ? "JetBrains Mono, ui-monospace, monospace"
            : "Inter, system-ui, sans-serif",
          color: "#1A1F2E",
          maxHeight: 420,
          overflow: "auto",
        }}
      >
        {content}
      </pre>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Lineage diagram
// ────────────────────────────────────────────────────────────────────────

function SectionLineage({
  sections,
  onPick,
}: {
  sections: Section[];
  onPick: (label: string) => void;
}) {
  return (
    <div
      style={{
        marginTop: 4,
        padding: "14px 18px",
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
      }}
    >
      <div
        className="uppercase font-medium text-ink-3"
        style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 10 }}
      >
        Document structure
      </div>
      <div
        className="flex items-center"
        style={{ gap: 8, flexWrap: "wrap" }}
      >
        {sections.map((s, i) => (
          <span key={s.id} className="flex items-center" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={() => onPick(s.label)}
              title={`Insert §${s.label} into directions`}
              className="font-serif"
              style={{
                background: "#FFFFFF",
                color: "#1A1F2E",
                border: "0.5px solid rgba(90,58,31,0.4)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition:
                  "background 120ms ease-out, border-color 120ms ease-out, color 120ms ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(184,134,47,0.18)";
                e.currentTarget.style.borderColor = "#B8862F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.borderColor = "rgba(90,58,31,0.4)";
              }}
            >
              {s.label}
            </button>
            {i < sections.length - 1 && (
              <span
                className="font-serif text-ink-3"
                style={{ fontSize: 16, lineHeight: 1 }}
              >
                →
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────

function WizardFooter({
  leftLabel,
  onLeft,
  rightLabel,
  onRight,
  rightDisabled,
}: {
  leftLabel: string;
  onLeft: () => void;
  rightLabel?: string;
  onRight?: () => void;
  rightDisabled?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: "0.5px solid rgba(90,58,31,0.18)",
        gap: 10,
      }}
    >
      <button type="button" className="vc-btn-secondary" onClick={onLeft}>
        {leftLabel}
      </button>
      {rightLabel && (
        <button
          type="button"
          className="vc-btn-primary"
          onClick={onRight}
          disabled={rightDisabled}
        >
          {rightLabel}
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Busy card
// ────────────────────────────────────────────────────────────────────────

function BusyCard({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <div
        className="font-serif text-ink"
        style={{ fontSize: 15, fontWeight: 500 }}
      >
        {label}
      </div>
      <div
        className="font-mono text-ink-3"
        style={{ fontSize: 11, marginTop: 6, letterSpacing: "0.04em" }}
      >
        WORKING…
      </div>
    </div>
  );
}

