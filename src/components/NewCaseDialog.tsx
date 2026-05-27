import { FormEvent, useEffect, useRef, useState } from "react";
import { createCase } from "../lib/cases";
import type { CaseInsert } from "../lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const emptyForm: CaseInsert = {
  title: "",
  court: null,
  case_no: null,
  cnr: null,
  type: null,
  status: "active",
  drive_folder_id: null,
  notes: null,
};

export default function NewCaseDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CaseInsert>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Reset form whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError(null);
      // focus title once the dialog mounts
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await createCase({
        ...form,
        title: form.title.trim(),
        // Empty strings → null so we don't pollute the DB with "".
        court: form.court?.trim() || null,
        case_no: form.case_no?.trim() || null,
        cnr: form.cnr?.trim() || null,
        type: form.type?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const set = <K extends keyof CaseInsert>(k: K, v: CaseInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">New case</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              You can edit any of this later.
            </p>
          </div>

          <Field label="Title" required>
            <input
              ref={titleRef}
              type="text"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Mehra vs. State of Maharashtra"
              className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Court">
              <input
                type="text"
                value={form.court ?? ""}
                onChange={(e) => set("court", e.target.value)}
                placeholder="e.g. Bombay High Court"
                className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </Field>
            <Field label="Type">
              <input
                type="text"
                value={form.type ?? ""}
                onChange={(e) => set("type", e.target.value)}
                placeholder="e.g. civil / writ / appeal"
                className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Case number">
              <input
                type="text"
                value={form.case_no ?? ""}
                onChange={(e) => set("case_no", e.target.value)}
                placeholder="e.g. WP/123/2025"
                className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </Field>
            <Field label="CNR" hint="eCourts identifier (16 chars)">
              <input
                type="text"
                value={form.cnr ?? ""}
                onChange={(e) => set("cnr", e.target.value)}
                placeholder="e.g. MHCC010012342025"
                className="w-full px-3 py-2 border border-black/15 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Anything you want to remember about this matter."
              className="w-full px-3 py-2 border border-black/15 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </Field>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-ink hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-white disabled:bg-black/10 disabled:text-ink-muted disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
        {hint && (
          <span className="text-ink-muted font-normal ml-2">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}
