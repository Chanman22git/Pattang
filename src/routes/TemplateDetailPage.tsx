import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TemplateFieldsEditor from "../components/TemplateFieldsEditor";
import DocumentsList from "../components/DocumentsList";
import {
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from "../lib/templates";
import type {
  TemplateFieldInsert,
  TemplateInsert,
  TemplateWithFields,
} from "../lib/types";

const emptyTemplate: TemplateInsert = {
  doc_type: "",
  name: "",
  description: null,
  structure: { body: "" },
  extra_context: null,
};

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [tpl, setTpl] = useState<TemplateInsert>(emptyTemplate);
  const [fields, setFields] = useState<TemplateFieldInsert[]>([]);
  const [linkedCount, setLinkedCount] = useState(0);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing template
  useEffect(() => {
    if (isNew) return;
    let active = true;
    getTemplate(id!)
      .then((row) => {
        if (!active) return;
        if (!row) {
          setError("Template not found.");
        } else {
          hydrate(row);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isNew]);

  function hydrate(row: TemplateWithFields) {
    setTpl({
      doc_type: row.doc_type,
      name: row.name,
      description: row.description,
      structure: row.structure,
      extra_context: row.extra_context,
    });
    setFields(
      row.fields.map(({ id: _i, template_id: _t, created_at: _c, ...rest }) => rest)
    );
    setLinkedCount(row.linked_doc_count);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Light validation: every field needs a non-empty label.
    if (fields.some((f) => !f.label.trim())) {
      setError("Every field needs a label.");
      return;
    }
    if (!tpl.name.trim() || !tpl.doc_type.trim()) {
      setError("Name and document type are required.");
      return;
    }

    setSaving(true);
    try {
      const normalised: TemplateInsert = {
        ...tpl,
        name: tpl.name.trim(),
        doc_type: tpl.doc_type.trim().toLowerCase().replace(/\s+/g, "_"),
        description: tpl.description?.trim() || null,
        extra_context: tpl.extra_context?.trim() || null,
      };
      const cleanFields: TemplateFieldInsert[] = fields.map((f, i) => ({
        ...f,
        label: f.label.trim(),
        profile_key:
          f.category === "prefill" ? f.profile_key || null : null,
        ordinal: i,
      }));

      if (isNew) {
        const created = await createTemplate(normalised, cleanFields);
        navigate(`/templates/${created.id}`, { replace: true });
      } else {
        const updated = await updateTemplate(id!, normalised, cleanFields);
        hydrate(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!id || isNew) return;
    if (
      !confirm(
        "Delete this template? Documents already created from it will keep their content, but lose the template link."
      )
    )
      return;
    try {
      await deleteTemplate(id);
      navigate("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onClone() {
    if (!id || isNew) return;
    try {
      const cloned = await cloneTemplate(id);
      navigate(`/templates/${cloned.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Loading...</div>;

  const set = <K extends keyof TemplateInsert>(k: K, v: TemplateInsert[K]) =>
    setTpl((t) => ({ ...t, [k]: v }));

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-2">
        <Link to="/templates" className="text-xs text-ink-muted hover:text-ink">
          ← Templates
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8 border-b border-black/10 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {isNew ? "New template" : tpl.name || "Untitled template"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            A generic, reusable definition — applied to a case at
            document-creation time.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={onClone}
                className="text-sm text-ink-muted hover:text-ink px-3 py-1.5 rounded-md hover:bg-black/5"
              >
                Clone
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md"
              >
                Delete
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-white disabled:bg-black/10 disabled:text-ink-muted"
          >
            {saving ? "Saving..." : isNew ? "Create template" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <Section title="Basics">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" required>
            <input
              type="text"
              required
              value={tpl.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Legal Notice"
              className={inputCls}
            />
          </Field>
          <Field
            label="Document type"
            required
            hint="Slug used internally — e.g. legal_notice"
          >
            <input
              type="text"
              required
              value={tpl.doc_type}
              onChange={(e) => set("doc_type", e.target.value)}
              placeholder="legal_notice"
              className={`${inputCls} font-mono`}
            />
          </Field>
        </div>
        <Field label="Description" hint="One line describing when to use this">
          <input
            type="text"
            value={tpl.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Pre-litigation demand notice under §80 CPC"
            className={inputCls}
          />
        </Field>
      </Section>

      <Section
        title="Fields"
        subtitle="Three categories, per PRD §4.1. Basic = ask each time. Prefill = default from your profile. Case-specific = the heavy free-text body."
      >
        <TemplateFieldsEditor value={fields} onChange={setFields} />
      </Section>

      <Section
        title="Template body"
        subtitle="The actual document text. Use {{Field label}} placeholders that match the fields above. Phase 1a chunk 3 turns this into a downloadable .docx."
      >
        <textarea
          value={tpl.structure.body ?? ""}
          onChange={(e) =>
            set("structure", { ...tpl.structure, body: e.target.value })
          }
          rows={14}
          placeholder={`Example:

To,
{{Recipient name}}
{{Recipient address}}

Dear Sir/Madam,

This notice is being issued on behalf of {{Client name}}...

{{Case-specific facts}}

Sincerely,
{{Advocate name}}`}
            className={`${inputCls} font-mono text-[13px] leading-relaxed`}
        />
      </Section>

      <Section
        title="Additional context (optional)"
        subtitle="Notes carried alongside the template — drafting hints, court-specific quirks. Doesn't change the structure."
      >
        <textarea
          value={tpl.extra_context ?? ""}
          onChange={(e) => set("extra_context", e.target.value)}
          rows={4}
          className={inputCls}
        />
      </Section>

      {!isNew && id && (
        <Section
          title="Linked documents"
          subtitle="Documents created from this template, annotated with the case they belong to (PRD §4.1 — a navigable index, not just a count)."
        >
          <DocumentsList
            mode={{ kind: "template", templateId: id }}
            showCaseTitle={true}
            showTemplateName={false}
            emptyHint={
              linkedCount > 0
                ? "(Refreshing...)"
                : "No documents have been created from this template yet."
            }
          />
        </Section>
      )}
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-black/15 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-xl font-semibold mb-1">{title}</h2>
      {subtitle && (
        <p className="text-xs text-ink-muted mb-3 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="space-y-3">{children}</div>
    </section>
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
