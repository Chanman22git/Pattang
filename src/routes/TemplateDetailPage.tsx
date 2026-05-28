import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TemplateFieldsEditor from "../components/TemplateFieldsEditor";
import TemplateLearnFromSample from "../components/TemplateLearnFromSample";
import {
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from "../lib/templates";
import { listDocumentsForTemplate } from "../lib/documents";
import { readError } from "../lib/errors";
import type {
  DocumentWithLinks,
  TemplateFieldInsert,
  TemplateFieldRow,
  TemplateInsert,
  TemplateWithFields,
} from "../lib/types";

/**
 * Template Detail (Vakil Chambers).
 *
 * Two modes:
 *   - View (`/templates/:id`): the dossier-style read view from the
 *     prototype (head + metrics + field-group cards + linked docs + rail).
 *   - Edit (`/templates/:id?edit=1` or `/templates/new`): the existing
 *     form-driven editor, restyled to the VC token set.
 *
 * The view mode is the new home; "Edit" promotes the same data into
 * fields without leaving the page. New templates land in edit mode.
 */

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

  const [view, setView] = useState<TemplateWithFields | null>(null);
  const [linkedDocs, setLinkedDocs] = useState<DocumentWithLinks[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(isNew);

  useEffect(() => {
    if (isNew) {
      setEditing(true);
      return;
    }
    let active = true;
    Promise.all([getTemplate(id!), listDocumentsForTemplate(id!)])
      .then(([row, docs]) => {
        if (!active) return;
        if (!row) setError("Template not found.");
        else setView(row);
        setLinkedDocs(docs);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(readError(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isNew]);

  if (loading) return <div className="text-ink-3" style={{ fontSize: 13 }}>Loading…</div>;
  if (error) return <ErrorNotice msg={error} />;

  if (editing || isNew) {
    return (
      <TemplateEditor
        seed={view}
        isNew={isNew}
        onSaved={(saved) => {
          if (isNew) {
            navigate(`/templates/${saved.id}`, { replace: true });
          } else {
            setView(saved);
            setEditing(false);
          }
        }}
        onCancel={() => {
          if (isNew) navigate("/templates");
          else setEditing(false);
        }}
        onDeleted={() => navigate("/templates")}
      />
    );
  }

  if (!view) return null;

  return (
    <TemplateView
      tpl={view}
      linkedDocs={linkedDocs}
      onEdit={() => setEditing(true)}
      onClone={async () => {
        try {
          const cloned = await cloneTemplate(view.id);
          navigate(`/templates/${cloned.id}`);
        } catch (err) {
          setError(readError(err));
        }
      }}
    />
  );
}

// ============================================================================
// View mode
// ============================================================================

function TemplateView({
  tpl,
  linkedDocs,
  onEdit,
  onClone,
}: {
  tpl: TemplateWithFields;
  linkedDocs: DocumentWithLinks[];
  onEdit: () => void;
  onClone: () => void;
}) {
  const grouped = useMemo(() => {
    return {
      basic: tpl.fields.filter((f) => f.category === "basic"),
      prefill: tpl.fields.filter((f) => f.category === "prefill"),
      caseSpecific: tpl.fields.filter((f) => f.category === "case_specific"),
    };
  }, [tpl.fields]);

  const distinctCases = useMemo(
    () => new Set(linkedDocs.map((d) => d.case_id)).size,
    [linkedDocs]
  );

  const lastUsed = useMemo(() => {
    if (linkedDocs.length === 0) return null;
    const sorted = [...linkedDocs].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    return sorted[0].created_at;
  }, [linkedDocs]);

  return (
    <>
      <TemplateHead
        tpl={tpl}
        metrics={{
          generated: linkedDocs.length,
          cases: distinctCases,
          lastUsed,
        }}
        onEdit={onEdit}
        onClone={onClone}
      />

      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 320px",
          gap: 48,
          marginTop: 40,
        }}
      >
        <div>
          <FieldGroupsSection grouped={grouped} />
          <ReferencesSection />
          <LinkedDocsSection docs={linkedDocs} />
        </div>
        <TemplateRail history={[]} updatedAt={tpl.updated_at} />
      </div>
    </>
  );
}

function TemplateHead({
  tpl,
  metrics,
  onEdit,
  onClone,
}: {
  tpl: TemplateWithFields;
  metrics: { generated: number; cases: number; lastUsed: string | null };
  onEdit: () => void;
  onClone: () => void;
}) {
  return (
    <header>
      <div
        className="uppercase font-medium text-ink-3"
        style={{ fontSize: 11, letterSpacing: "0.08em", marginBottom: 12 }}
      >
        Template · {tpl.doc_type} · v{tpl.version}
      </div>
      <h1
        className="font-serif font-medium text-ink m-0"
        style={{ fontSize: 32, lineHeight: 1.3, letterSpacing: "-0.005em" }}
      >
        {tpl.name}
      </h1>
      {tpl.description && (
        <p
          className="text-ink-2"
          style={{
            fontSize: 15,
            marginTop: 14,
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          {tpl.description}
        </p>
      )}

      <div
        className="flex items-end"
        style={{
          gap: 32,
          marginTop: 28,
          borderTop: "0.5px solid rgba(90,58,31,0.18)",
          paddingTop: 22,
        }}
      >
        <Metric label="Documents generated" value={String(metrics.generated)} />
        <Metric label="Cases using this" value={String(metrics.cases)} />
        <Metric
          label="Last used"
          value={metrics.lastUsed ? relativeDate(metrics.lastUsed) : "—"}
          small
        />
        <div
          className="ml-auto flex items-center"
          style={{ gap: 10 }}
        >
          <button className="vc-btn-secondary" onClick={onClone}>
            Clone
          </button>
          <button
            className="vc-btn-secondary"
            disabled
            title="AI-proposed edits land with Phase 1b"
          >
            Suggest edits
          </button>
          <button className="vc-btn-secondary" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <div
        className="uppercase font-medium text-ink-3"
        style={{ fontSize: 10.5, letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div
        className="font-serif font-medium text-ink"
        style={{
          fontSize: small ? 22 : 28,
          lineHeight: 1.2,
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FieldGroupsSection({
  grouped,
}: {
  grouped: {
    basic: TemplateFieldRow[];
    prefill: TemplateFieldRow[];
    caseSpecific: TemplateFieldRow[];
  };
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        title="The form this template asks"
        sub="Three groups, set at creation. Editable per template."
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 20,
        }}
      >
        <FieldGroupCard
          kind="basic"
          label="Basic details"
          sub="Asked each time"
          fields={grouped.basic}
        />
        <FieldGroupCard
          kind="prefill"
          label="Standard details"
          sub="Prefilled from profile · overridable"
          fields={grouped.prefill}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <CaseSpecificCard fields={grouped.caseSpecific} />
      </div>
    </section>
  );
}

function FieldGroupCard({
  kind,
  label,
  sub,
  fields,
}: {
  kind: "basic" | "prefill";
  label: string;
  sub: string;
  fields: TemplateFieldRow[];
}) {
  const dot = kind === "basic" ? "#B8862F" : "#2D4A3E";
  return (
    <div
      style={{
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
        padding: "18px 20px 14px",
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: 10, marginBottom: 4 }}
      >
        <span style={{ width: 6, height: 6, background: dot }} />
        <div
          className="font-serif font-medium text-ink"
          style={{ fontSize: 16 }}
        >
          {label}
        </div>
        <div
          className="font-mono text-ink-3 ml-auto"
          style={{ fontSize: 11, letterSpacing: "0.02em" }}
        >
          {fields.length} field{fields.length === 1 ? "" : "s"}
        </div>
      </div>
      <div
        className="text-ink-2 italic"
        style={{ fontSize: 12.5, marginBottom: 14 }}
      >
        {sub}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {fields.length === 0 && (
          <li
            className="text-ink-3 italic"
            style={{ padding: "9px 0", fontSize: 13 }}
          >
            No {label.toLowerCase()} fields yet.
          </li>
        )}
        {fields.map((f) => (
          <li
            key={f.id}
            className="flex justify-between"
            style={{
              gap: 12,
              padding: "9px 0",
              borderTop: "0.5px solid rgba(90,58,31,0.18)",
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ color: "#1A1F2E" }}>{f.label}</div>
              {f.profile_key && (
                <div
                  className="font-serif italic text-ink-2"
                  style={{ fontSize: 12, marginTop: 3 }}
                >
                  prefill from {f.profile_key.replace(/_/g, " ")}
                </div>
              )}
            </div>
            <div
              className="font-mono uppercase text-ink-3"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.04em",
                alignSelf: "flex-start",
              }}
            >
              {f.input_type}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseSpecificCard({ fields }: { fields: TemplateFieldRow[] }) {
  const summary =
    fields.length === 0
      ? "No case-specific field defined yet"
      : fields.map((f) => f.label).join(" · ");

  return (
    <div
      className="flex items-start"
      style={{
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
        padding: "18px 20px",
        gap: 20,
      }}
    >
      <div className="flex-1">
        <div
          className="flex items-center"
          style={{ gap: 10 }}
        >
          <span style={{ width: 6, height: 6, background: "#4A1818" }} />
          <div
            className="font-serif font-medium text-ink"
            style={{ fontSize: 16 }}
          >
            Case-specific · {summary}
          </div>
        </div>
        <div
          className="text-ink-2"
          style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}
        >
          The substantive content that varies case-to-case. Free text, can be
          long. Citations attached from Research will be available here once
          Phase 3 lands.
        </div>
      </div>
      <div
        className="font-serif italic text-ink-3"
        style={{
          width: 260,
          minHeight: 96,
          border: "0.5px dashed #5A3A1F",
          borderRadius: 2,
          background: "#FFFFFF",
          padding: 12,
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        Free-text area · accepts long prose · pulled context from prior
        documents in the case…
      </div>
    </div>
  );
}

function ReferencesSection() {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        title="What this template refers to"
        sub="Learning inputs refine the structure · standing references inform generation"
        action={
          <button
            className="vc-btn-secondary"
            disabled
            title="Reference attachments land with Phase 1b"
          >
            Attach reference
          </button>
        }
      />
      <div
        className="text-ink-3 italic"
        style={{
          marginTop: 20,
          padding: "20px 18px",
          border: "0.5px dashed rgba(90,58,31,0.18)",
          borderRadius: 2,
          background: "#FAF8F3",
          fontSize: 13,
        }}
      >
        Learning inputs and standing references arrive with Phase 1b — when
        we have a backend to call Claude with sample filings and
        court-specific practice circulars.
      </div>
    </section>
  );
}

function LinkedDocsSection({ docs }: { docs: DocumentWithLinks[] }) {
  return (
    <section>
      <SectionHead
        title="Documents from this template"
        sub={
          docs.length === 0
            ? "Nothing drafted from this template yet."
            : `${docs.length} document${docs.length === 1 ? "" : "s"} across ${
                new Set(docs.map((d) => d.case_id)).size
              } case${
                new Set(docs.map((d) => d.case_id)).size === 1 ? "" : "s"
              } — navigable index`
        }
      />
      <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
        {docs.length === 0 && (
          <li
            className="text-ink-3 italic"
            style={{
              padding: "20px 0",
              fontSize: 13,
              textAlign: "center",
              border: "0.5px dashed rgba(90,58,31,0.18)",
              borderRadius: 2,
              background: "#FAF8F3",
            }}
          >
            Create a document from this template inside a case to populate
            this list.
          </li>
        )}
        {docs.map((d) => (
          <li
            key={d.id}
            className="grid items-baseline"
            style={{
              gridTemplateColumns: "1fr auto",
              gap: 12,
              padding: "13px 0",
              borderBottom: "0.5px solid rgba(90,58,31,0.18)",
            }}
          >
            <div>
              <Link
                to={`/cases/${d.case_id}`}
                className="vc-link font-serif font-medium text-ink"
                style={{ fontSize: 15 }}
              >
                {d.title}
              </Link>
              {d.case_title && (
                <span
                  className="text-ink-2 italic"
                  style={{ marginLeft: 10, fontSize: 13 }}
                >
                  — in {d.case_title}
                </span>
              )}
            </div>
            <div
              className="font-mono text-ink-3"
              style={{ fontSize: 11.5, letterSpacing: "0.02em" }}
            >
              {formatDate(d.created_at)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TemplateRail({
  history,
  updatedAt,
}: {
  history: Array<{ date: string; label: string }>;
  updatedAt: string;
}) {
  const ops = [
    "Add additional details",
    "Refer to a new document",
    "Suggest edits with AI",
    "Clone as variant",
  ];
  return (
    <aside
      style={{
        position: "sticky",
        top: 40,
        alignSelf: "flex-start",
        borderLeft: "0.5px solid rgba(90,58,31,0.18)",
        paddingLeft: 24,
      }}
    >
      <DossierBlockLabel>Anatomy of a document</DossierBlockLabel>
      <div
        className="font-serif text-ink"
        style={{
          background: "#FAF8F3",
          border: "0.5px solid rgba(90,58,31,0.18)",
          borderRadius: 2,
          padding: 14,
          fontSize: 11.5,
          lineHeight: 1.6,
        }}
      >
        <div
          className="text-center font-sans uppercase font-medium text-ink-3"
          style={{ fontSize: 9, letterSpacing: "0.16em", marginBottom: 8 }}
        >
          In the High Court
        </div>
        <div
          className="text-center font-mono text-ink-3"
          style={{ fontSize: 9.5, letterSpacing: "0.02em", marginBottom: 10 }}
        >
          ____ No. ____ / 20__
        </div>
        <div
          style={{
            height: 0.5,
            background: "#5A3A1F",
            opacity: 0.5,
            margin: "10px 0",
          }}
        />
        <div
          style={{
            background: "rgba(184,134,47,0.18)",
            padding: "4px 6px",
            marginBottom: 4,
            fontSize: 10.5,
            color: "#1A1F2E",
          }}
        >
          · Petitioner name
        </div>
        <div
          style={{
            background: "rgba(184,134,47,0.18)",
            padding: "4px 6px",
            marginBottom: 4,
            fontSize: 10.5,
            color: "#1A1F2E",
          }}
        >
          · Petitioner address
        </div>
        <div
          className="text-center italic text-ink-2"
          style={{ fontSize: 11.5, margin: "8px 0" }}
        >
          versus
        </div>
        <div
          style={{
            background: "rgba(184,134,47,0.18)",
            padding: "4px 6px",
            marginBottom: 4,
            fontSize: 10.5,
            color: "#1A1F2E",
          }}
        >
          · Respondent(s)
        </div>
        <div
          style={{
            height: 0.5,
            background: "#5A3A1F",
            opacity: 0.5,
            margin: "10px 0",
          }}
        />
        <div
          className="font-sans uppercase font-medium text-ink-3"
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            marginBottom: 6,
          }}
        >
          Grounds &amp; prayer
        </div>
        <div
          className="italic text-ink-2"
          style={{
            background: "#FFFFFF",
            padding: 10,
            fontSize: 10.5,
            border: "0.5px dashed #5A3A1F",
            borderRadius: 2,
            lineHeight: 1.5,
          }}
        >
          Case-specific free text — pulled-context capable
        </div>
        <div
          className="font-sans italic text-ink-3 text-right"
          style={{ marginTop: 12, fontSize: 9.5 }}
        >
          — prefilled: counsel signature —
        </div>
      </div>
      <div
        className="text-ink-3 italic"
        style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}
      >
        Shaded blocks come from the form. The dashed area is yours to draft,
        case by case.
      </div>

      <RailBlock label="Template history">
        <div style={{ padding: "7px 0", fontSize: 12.5 }}>
          <div
            className="font-mono text-ink-3"
            style={{ fontSize: 11, letterSpacing: "0.02em" }}
          >
            {formatDate(updatedAt)}
          </div>
          <div
            className="font-serif text-ink"
            style={{ fontSize: 13.5, lineHeight: 1.45, marginTop: 2 }}
          >
            Last edited
          </div>
        </div>
        {history.length === 0 && (
          <div
            className="text-ink-3 italic"
            style={{ fontSize: 12.5, marginTop: 6 }}
          >
            Version history begins recording with Phase 1b.
          </div>
        )}
      </RailBlock>

      <RailBlock label="Editable operations">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
          {ops.map((op, i) => (
            <li
              key={op}
              className="vc-row font-serif text-ink"
              style={{
                padding: "8px 6px",
                fontSize: 13.5,
                borderBottom:
                  i === ops.length - 1
                    ? "none"
                    : "0.5px dashed rgba(90,58,31,0.18)",
              }}
            >
              <span
                className="font-mono text-ink-3"
                style={{ marginRight: 8, fontSize: 10 }}
              >
                →
              </span>
              {op}
            </li>
          ))}
        </ul>
      </RailBlock>
    </aside>
  );
}

function DossierBlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="uppercase text-ink font-semibold"
      style={{
        fontSize: 10,
        letterSpacing: "0.1em",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function RailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 24,
        borderTop: "0.5px dashed rgba(90,58,31,0.18)",
      }}
    >
      <DossierBlockLabel>{label}</DossierBlockLabel>
      {children}
    </div>
  );
}

function SectionHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex justify-between items-baseline"
      style={{
        borderBottom: "0.5px solid #5A3A1F",
        paddingBottom: 12,
      }}
    >
      <div>
        <h2
          className="font-serif font-medium text-ink m-0"
          style={{
            fontSize: 20,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
        {sub && (
          <div className="text-ink-2" style={{ fontSize: 13, marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

function ErrorNotice({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: "#EAD9D9",
        border: "0.5px solid #4A1818",
        borderRadius: 2,
        padding: "12px 16px",
        color: "#4A1818",
        fontSize: 13,
      }}
    >
      {msg}
    </div>
  );
}

// ============================================================================
// Edit mode — the existing editor, restyled to VC.
// ============================================================================

function TemplateEditor({
  seed,
  isNew,
  onSaved,
  onCancel,
  onDeleted,
}: {
  seed: TemplateWithFields | null;
  isNew: boolean;
  onSaved: (saved: TemplateWithFields) => void;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [tpl, setTpl] = useState<TemplateInsert>(() =>
    seed
      ? {
          doc_type: seed.doc_type,
          name: seed.name,
          description: seed.description,
          structure: seed.structure,
          extra_context: seed.extra_context,
        }
      : emptyTemplate
  );
  const [fields, setFields] = useState<TemplateFieldInsert[]>(() =>
    seed
      ? seed.fields.map(
          ({ id: _i, template_id: _t, created_at: _c, ...rest }) => rest
        )
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TemplateInsert>(k: K, v: TemplateInsert[K]) =>
    setTpl((t) => ({ ...t, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
        profile_key: f.category === "prefill" ? f.profile_key || null : null,
        ordinal: i,
      }));

      if (isNew) {
        const created = await createTemplate(normalised, cleanFields);
        onSaved(created);
      } else if (seed) {
        const updated = await updateTemplate(seed.id, normalised, cleanFields);
        onSaved(updated);
      }
    } catch (err) {
      setError(readError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!seed) return;
    if (
      !confirm(
        "Delete this template? Documents already created from it will keep their content, but lose the template link."
      )
    )
      return;
    try {
      await deleteTemplate(seed.id);
      onDeleted();
    } catch (err) {
      setError(readError(err));
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-2">
        <Link
          to="/templates"
          className="vc-link text-ink-3"
          style={{ fontSize: 12 }}
        >
          ← Templates
        </Link>
      </div>

      <div
        className="flex justify-between items-end"
        style={{
          borderBottom: "0.5px solid #5A3A1F",
          paddingBottom: 18,
          marginBottom: 32,
          gap: 16,
        }}
      >
        <div>
          <div
            className="uppercase font-medium text-ink-3"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            {isNew ? "New template" : "Editing template"}
          </div>
          <h1
            className="font-serif font-medium text-ink m-0"
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
            }}
          >
            {tpl.name || "Untitled template"}
          </h1>
          <p
            className="text-ink-2"
            style={{
              fontSize: 13.5,
              marginTop: 8,
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            Define the structure once. Each document made from it reuses this
            scaffold and asks the advocate for the case-specific content.
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 10 }}>
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="vc-btn-secondary"
              style={{ color: "#4A1818", borderColor: "rgba(90,58,31,0.18)" }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="vc-btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="vc-btn-primary" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create template" : "Save changes"}
          </button>
        </div>
      </div>

      {error && <ErrorNotice msg={error} />}

      <EditSection title="Basics">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Name" required>
            <input
              type="text"
              required
              value={tpl.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Writ Petition under Article 226"
              className="vc-input"
              style={{ width: "100%" }}
            />
          </Field>
          <Field
            label="Document type"
            required
            hint="Slug — e.g. writ_petition"
          >
            <input
              type="text"
              required
              value={tpl.doc_type}
              onChange={(e) => set("doc_type", e.target.value)}
              placeholder="writ_petition"
              className="vc-input font-mono"
              style={{ width: "100%" }}
            />
          </Field>
        </div>
        <Field label="Description" hint="One line about when to use this">
          <input
            type="text"
            value={tpl.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="vc-input"
            style={{ width: "100%" }}
          />
        </Field>
      </EditSection>

      <TemplateLearnFromSample
        onApply={({ body, fields: newFields }) => {
          // Replace the body with the redacted sample, and merge in any
          // new fields whose labels aren't already taken. Existing
          // hand-authored fields keep their position; new ones append.
          setTpl((t) => ({
            ...t,
            structure: { ...t.structure, body },
          }));
          setFields((current) => {
            const seen = new Set(
              current.map((f) => f.label.trim().toLowerCase())
            );
            const additions = newFields.filter(
              (f) => !seen.has(f.label.trim().toLowerCase())
            );
            return [
              ...current,
              ...additions.map((f, i) => ({
                ...f,
                ordinal: current.length + i,
              })),
            ];
          });
        }}
      />

      <EditSection
        title="Fields"
        sub="Three categories — basic / prefill / case-specific (PRD §4.1)."
      >
        <TemplateFieldsEditor value={fields} onChange={setFields} />
      </EditSection>

      <EditSection
        title="Template body"
        sub="Plain text with {{Field label}} placeholders that match the fields above."
      >
        <textarea
          value={tpl.structure.body ?? ""}
          onChange={(e) =>
            set("structure", { ...tpl.structure, body: e.target.value })
          }
          rows={14}
          className="vc-input font-mono"
          style={{ width: "100%", fontSize: 13, lineHeight: 1.6 }}
          placeholder={`To,\n{{Recipient name}}\n{{Recipient address}}\n\nDear Sir/Madam,\n\nThis notice is being issued on behalf of {{Client name}}…`}
        />
      </EditSection>

      <EditSection
        title="Additional context (optional)"
        sub="Drafting hints, court-specific quirks. Doesn't change the structure."
      >
        <textarea
          value={tpl.extra_context ?? ""}
          onChange={(e) => set("extra_context", e.target.value)}
          rows={4}
          className="vc-input"
          style={{ width: "100%" }}
        />
      </EditSection>
    </form>
  );
}

function EditSection({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        className="font-serif font-medium text-ink m-0"
        style={{
          fontSize: 20,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
          marginBottom: sub ? 4 : 12,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className="text-ink-2 italic"
          style={{ fontSize: 13, marginBottom: 12 }}
        >
          {sub}
        </p>
      )}
      <div className="flex flex-col" style={{ gap: 12 }}>{children}</div>
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
      <span
        className="block text-ink-2"
        style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}
      >
        {label}
        {required && <span style={{ color: "#B8862F", marginLeft: 2 }}>*</span>}
        {hint && (
          <span className="text-ink-3 font-normal ml-2 italic">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

// ----- helpers --------------------------------------------------------------

function relativeDate(iso: string): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return iso;
  const days = Math.round(
    (Date.now() - target.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 60) return "a month ago";
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} year${days < 730 ? "" : "s"} ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
