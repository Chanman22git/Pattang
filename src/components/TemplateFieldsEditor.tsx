import {
  PROFILE_PREFILL_KEYS,
  type TemplateFieldCategory,
  type TemplateFieldInputType,
  type TemplateFieldInsert,
} from "../lib/types";

type Props = {
  value: TemplateFieldInsert[];
  onChange: (next: TemplateFieldInsert[]) => void;
};

const CATEGORIES: { value: TemplateFieldCategory; label: string; hint: string }[] = [
  {
    value: "basic",
    label: "Basic",
    hint: "Per-document facts you'll fill in each time (party names, dates, addresses).",
  },
  {
    value: "prefill",
    label: "Prefill",
    hint: "Defaults from your profile (advocate name, address, default court) — editable when you create the document.",
  },
  {
    value: "case_specific",
    label: "Case-specific",
    hint: "The substantive content that varies heavily case to case — captured as a large free-text area.",
  },
];

const INPUT_TYPES: { value: TemplateFieldInputType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
];

export default function TemplateFieldsEditor({ value, onChange }: Props) {
  function update(i: number, patch: Partial<TemplateFieldInsert>) {
    const next = value.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    onChange(reordinal(next));
  }
  function add() {
    const next = [
      ...value,
      {
        label: "",
        category: "basic" as TemplateFieldCategory,
        input_type: "text" as TemplateFieldInputType,
        profile_key: null,
        ordinal: value.length,
      },
    ];
    onChange(next);
  }
  function remove(i: number) {
    const next = value.filter((_, idx) => idx !== i);
    onChange(reordinal(next));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(reordinal(next));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="border border-dashed border-black/15 rounded-md px-4 py-6 text-center text-sm text-ink-muted">
          No fields yet. Add the per-document facts the template needs.
        </div>
      )}

      {value.map((f, i) => (
        <div
          key={i}
          className="border border-black/10 rounded-md bg-white p-3 space-y-3"
        >
          <div className="flex items-start gap-2">
            <input
              type="text"
              required
              value={f.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Field label (e.g. Party name)"
              className="flex-1 min-w-0 px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <div className="flex shrink-0 gap-0.5 mt-0.5">
              <IconButton
                title="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </IconButton>
              <IconButton
                title="Move down"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </IconButton>
              <IconButton title="Remove field" onClick={() => remove(i)}>
                ×
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Category"
              value={f.category}
              options={CATEGORIES.map(({ value, label }) => ({ value, label }))}
              onChange={(v) =>
                update(i, {
                  category: v as TemplateFieldCategory,
                  // case_specific defaults to textarea; reset profile_key when leaving prefill
                  input_type:
                    v === "case_specific"
                      ? "textarea"
                      : f.input_type === "textarea" && v === "basic"
                      ? "text"
                      : f.input_type,
                  profile_key: v === "prefill" ? f.profile_key : null,
                })
              }
            />
            <Select
              label="Input type"
              value={f.input_type}
              options={INPUT_TYPES}
              onChange={(v) =>
                update(i, { input_type: v as TemplateFieldInputType })
              }
            />
            {f.category === "prefill" ? (
              <Select
                label="Prefill from"
                value={f.profile_key ?? ""}
                options={[
                  { value: "", label: "— none —" },
                  ...PROFILE_PREFILL_KEYS.map((k) => ({
                    value: k,
                    label: k.replace(/_/g, " "),
                  })),
                ]}
                onChange={(v) => update(i, { profile_key: v || null })}
              />
            ) : (
              <div /> /* spacer to keep the 3-col grid stable */
            )}
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            {CATEGORIES.find((c) => c.value === f.category)?.hint}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-sm font-medium text-accent hover:underline underline-offset-2"
      >
        + Add field
      </button>
    </div>
  );
}

function reordinal(fields: TemplateFieldInsert[]): TemplateFieldInsert[] {
  return fields.map((f, i) => ({ ...f, ordinal: i }));
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-7 h-7 rounded text-sm text-ink-muted hover:bg-black/5 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 border border-black/15 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
