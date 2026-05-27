import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getCase } from "../lib/cases";
import { getTemplate, listTemplates } from "../lib/templates";
import { createDocument } from "../lib/documents";
import { ensureProfile } from "../lib/profile";
import {
  generateDocxBlob,
  safeFilename,
  triggerDownload,
} from "../lib/docx-generator";
import type {
  CaseRow,
  FieldValues,
  ProfileRow,
  TemplateFieldRow,
  TemplateRow,
  TemplateWithFields,
} from "../lib/types";

export default function NewDocumentPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [params, setParams] = useSearchParams();
  const templateId = params.get("template");

  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [template, setTemplate] = useState<TemplateWithFields | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load case + (later) templates list. Always needed.
  useEffect(() => {
    if (!caseId) return;
    let active = true;
    Promise.all([getCase(caseId), listTemplates(), ensureProfile()])
      .then(([c, ts, p]) => {
        if (!active) return;
        setCaseRow(c);
        setTemplates(ts);
        setProfile(p);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  // Load the chosen template's fields once a template is picked.
  useEffect(() => {
    if (!templateId) {
      setTemplate(null);
      return;
    }
    let active = true;
    getTemplate(templateId)
      .then((t) => active && setTemplate(t))
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [templateId]);

  if (error) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
        {error}
      </div>
    );
  }
  if (!caseRow || templates === null) {
    return <div className="text-sm text-ink-muted">Loading...</div>;
  }

  return (
    <>
      <div className="mb-2">
        <Link
          to={`/cases/${caseId}`}
          className="text-xs text-ink-muted hover:text-ink"
        >
          ← {caseRow.title}
        </Link>
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight mb-8 border-b border-black/10 pb-5">
        New document
      </h1>

      {!templateId && (
        <TemplatePicker
          templates={templates}
          onPick={(id) => setParams({ template: id })}
        />
      )}

      {templateId && template && profile && (
        <DocumentForm
          caseRow={caseRow}
          template={template}
          profile={profile}
          onCancel={() => setParams({})}
        />
      )}

      {templateId && !template && (
        <div className="text-sm text-ink-muted">Loading template...</div>
      )}
    </>
  );
}

// ============================================================================
// Step 1: Template picker
// ============================================================================

function TemplatePicker({
  templates,
  onPick,
}: {
  templates: TemplateRow[];
  onPick: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="border border-dashed border-black/15 rounded-lg p-10 text-center bg-white/50">
        <div className="font-serif text-xl font-semibold mb-2">
          No templates yet
        </div>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed mb-6">
          You need a template before you can generate a document. Create one
          first — petition, appeal, legal notice, whatever you draft most.
        </p>
        <Link
          to="/templates/new"
          className="inline-flex px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent/90"
        >
          Create a template
        </Link>
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold mb-3">
        Pick a template
      </h2>
      <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
        {templates.map((t) => (
          <li key={t.id} className="border-b border-black/10 last:border-b-0">
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-paper transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap gap-x-3">
                  <span className="font-mono">{t.doc_type}</span>
                  {t.description && (
                    <span className="truncate max-w-md">{t.description}</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-ink-muted">
                {t.linked_doc_count} doc
                {t.linked_doc_count === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================================
// Step 2: Document form
// ============================================================================

function DocumentForm({
  caseRow,
  template,
  profile,
  onCancel,
}: {
  caseRow: CaseRow;
  template: TemplateWithFields;
  profile: ProfileRow;
  onCancel: () => void;
}) {
  const navigate = useNavigate();

  // Default title — "Legal Notice — Mehra vs State of Maharashtra"
  const [title, setTitle] = useState(`${template.name} — ${caseRow.title}`);
  const [values, setValues] = useState<FieldValues>(() =>
    initialValues(template.fields, profile)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      basic: template.fields.filter((f) => f.category === "basic"),
      prefill: template.fields.filter((f) => f.category === "prefill"),
      case_specific: template.fields.filter(
        (f) => f.category === "case_specific"
      ),
    };
  }, [template.fields]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Save the row first so the document lives in DB before we trigger
      // the download. If the .docx fails to build we still have the row,
      // and the user can re-download later.
      const row = await createDocument({
        case_id: caseRow.id,
        template_id: template.id,
        title: title.trim() || `${template.name} — ${caseRow.title}`,
        gdoc_id: null,
        gdoc_url: null,
        status: "draft",
        field_values: values,
      });

      const blob = await generateDocxBlob(template, values, row.title);
      triggerDownload(blob, safeFilename(row.title, "docx"));

      navigate(`/cases/${caseRow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Section title="Document">
        <Field label="Title" hint="Used as the .docx filename" required>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="text-xs text-ink-muted">
          From template{" "}
          <Link
            to={`/templates/${template.id}`}
            className="text-accent hover:underline"
          >
            {template.name}
          </Link>{" "}
          ·{" "}
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-ink underline-offset-2 hover:underline"
          >
            Change template
          </button>
        </div>
      </Section>

      {grouped.basic.length > 0 && (
        <Section
          title="Basic details"
          subtitle="Per-document facts. The advocate fills these each time."
        >
          {grouped.basic.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={values[f.label] ?? ""}
              onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))}
            />
          ))}
        </Section>
      )}

      {grouped.prefill.length > 0 && (
        <Section
          title="Standard details"
          subtitle="Prefilled from your profile — edit if this matter is an exception."
        >
          {grouped.prefill.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={values[f.label] ?? ""}
              onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))}
            />
          ))}
        </Section>
      )}

      {grouped.case_specific.length > 0 && (
        <Section
          title="Case-specific content"
          subtitle="The substantive body — what actually changes from matter to matter."
        >
          {grouped.case_specific.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={values[f.label] ?? ""}
              onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))}
              forceTextarea
            />
          ))}
        </Section>
      )}

      {template.fields.length === 0 && (
        <div className="border border-dashed border-black/15 rounded-md px-4 py-6 text-sm text-ink-muted text-center mb-6">
          This template has no fields. The body will be generated as-is.{" "}
          <Link
            to={`/templates/${template.id}`}
            className="text-accent hover:underline"
          >
            Add fields →
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
        <button
          type="button"
          onClick={() => navigate(`/cases/${caseRow.id}`)}
          className="px-4 py-2 rounded-md text-sm font-medium text-ink hover:bg-black/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-white disabled:bg-black/10 disabled:text-ink-muted"
        >
          {submitting ? "Generating..." : "Create & download .docx"}
        </button>
      </div>
    </form>
  );
}

function initialValues(
  fields: TemplateFieldRow[],
  profile: ProfileRow
): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) {
    if (f.category === "prefill" && f.profile_key) {
      const v = (profile as unknown as Record<string, unknown>)[f.profile_key];
      if (typeof v === "string") out[f.label] = v;
    }
  }
  return out;
}

function FieldInput({
  field,
  value,
  onChange,
  forceTextarea,
}: {
  field: TemplateFieldRow;
  value: string;
  onChange: (v: string) => void;
  forceTextarea?: boolean;
}) {
  const useTextarea = forceTextarea || field.input_type === "textarea";

  return (
    <Field label={field.label}>
      {useTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={field.category === "case_specific" ? 8 : 3}
          className={inputCls}
        />
      ) : (
        <input
          type={field.input_type === "number" ? "number" : field.input_type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </Field>
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
    <section className="mb-8">
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
