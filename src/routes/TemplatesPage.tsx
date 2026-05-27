import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { listTemplates } from "../lib/templates";
import type { TemplateRow } from "../lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const rows = await listTemplates();
      setTemplates(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const metrics = computeMetrics(templates);

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8 border-b border-black/10 pb-5">
        <PageHeader
          title="Templates"
          subtitle="Reusable document types — petitions, appeals, legal notices. Structure stays fixed; content varies by case."
        />
        <button
          onClick={() => navigate("/templates/new")}
          className="shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent/90"
        >
          New template
        </button>
      </div>

      {/* Metrics banner — per PRD §4.1 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Metric
          label="Templates"
          value={metrics.total}
          loading={templates === null}
        />
        <Metric
          label="Document types covered"
          value={metrics.distinctTypes}
          loading={templates === null}
        />
        <Metric
          label="Documents generated"
          value={metrics.linkedDocs}
          loading={templates === null}
          hint="Available in Phase 1a chunk 3"
        />
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          Couldn&rsquo;t load templates: {error}
        </div>
      )}

      {templates === null && !error && <TemplatesSkeleton />}

      {templates && templates.length === 0 && (
        <EmptyState
          title="No templates yet"
          body="Templates capture the structure of a document type once, so the case-specific content is all you fill in next time. Start with one — e.g. a Legal Notice or a Writ Petition."
          cta="Create your first template"
          onClick={() => navigate("/templates/new")}
        />
      )}

      {templates && templates.length > 0 && (
        <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
          {templates.map((t) => (
            <li key={t.id} className="border-b border-black/10 last:border-b-0">
              <Link
                to={`/templates/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-paper transition-colors"
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
                <div className="shrink-0 text-xs text-ink-muted">
                  {t.linked_doc_count} doc
                  {t.linked_doc_count === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  loading,
  hint,
}: {
  label: string;
  value: number;
  loading: boolean;
  hint?: string;
}) {
  return (
    <div className="border border-black/10 rounded-lg bg-white px-5 py-4">
      <div className="text-xs font-medium text-ink-muted uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 font-serif text-3xl font-semibold">
        {loading ? (
          <span className="inline-block w-10 h-7 bg-black/5 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-ink-muted">{hint}</div>}
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
      {[0, 1].map((i) => (
        <li
          key={i}
          className="border-b border-black/10 last:border-b-0 px-5 py-4"
        >
          <div className="h-4 w-1/3 bg-black/5 rounded mb-2 animate-pulse" />
          <div className="h-3 w-1/4 bg-black/5 rounded animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function computeMetrics(rows: TemplateRow[] | null) {
  if (!rows) return { total: 0, distinctTypes: 0, linkedDocs: 0 };
  const distinctTypes = new Set(rows.map((r) => r.doc_type)).size;
  const linkedDocs = rows.reduce((sum, r) => sum + (r.linked_doc_count ?? 0), 0);
  return { total: rows.length, distinctTypes, linkedDocs };
}
