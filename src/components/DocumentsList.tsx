import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteDocument,
  getDocument,
  listDocumentsForCase,
  listDocumentsForTemplate,
} from "../lib/documents";
import { getTemplate } from "../lib/templates";
import {
  generateDocxBlob,
  safeFilename,
  triggerDownload,
} from "../lib/docx-generator";
import type { DocumentWithLinks } from "../lib/types";

type Mode =
  | { kind: "case"; caseId: string }
  | { kind: "template"; templateId: string };

type Props = {
  mode: Mode;
  /** Whether to show the case title on each row. False on the case detail page
   *  (redundant); true on the template detail page (helpful index). */
  showCaseTitle: boolean;
  /** Whether to show the template name on each row. */
  showTemplateName: boolean;
  emptyHint?: string;
};

export default function DocumentsList({
  mode,
  showCaseTitle,
  showTemplateName,
  emptyHint,
}: Props) {
  const [rows, setRows] = useState<DocumentWithLinks[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data =
        mode.kind === "case"
          ? await listDocumentsForCase(mode.caseId)
          : await listDocumentsForTemplate(mode.templateId);
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [mode.kind, mode.kind === "case" ? mode.caseId : mode.templateId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onReDownload(doc: DocumentWithLinks) {
    setBusyId(doc.id);
    try {
      // Re-fetch the document + template fresh, so a template edit since
      // creation gets reflected in the regenerated .docx.
      if (!doc.template_id) {
        throw new Error(
          "This document wasn't created from a template, so it can't be regenerated."
        );
      }
      const [d, t] = await Promise.all([
        getDocument(doc.id),
        getTemplate(doc.template_id),
      ]);
      if (!d || !t) throw new Error("Document or template not found.");
      const blob = await generateDocxBlob(t, d.field_values, d.title);
      triggerDownload(blob, safeFilename(d.title, "docx"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(doc: DocumentWithLinks) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setBusyId(doc.id);
    try {
      await deleteDocument(doc);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
        {error}
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="border border-black/10 rounded-lg overflow-hidden bg-white">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border-b border-black/10 last:border-b-0 px-5 py-4"
          >
            <div className="h-4 w-1/3 bg-black/5 rounded mb-2 animate-pulse" />
            <div className="h-3 w-1/4 bg-black/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-black/15 rounded-md px-4 py-6 text-sm text-ink-muted text-center">
        {emptyHint ?? "No documents yet."}
      </div>
    );
  }

  return (
    <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
      {rows.map((d) => (
        <li
          key={d.id}
          className="border-b border-black/10 last:border-b-0 px-5 py-3.5 flex items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{d.title}</div>
            <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap gap-x-3">
              {showTemplateName && d.template_name && (
                <span>{d.template_name}</span>
              )}
              {showCaseTitle && d.case_title && (
                <Link
                  to={`/cases/${d.case_id}`}
                  className="hover:text-ink underline-offset-2 hover:underline"
                >
                  {d.case_title}
                </Link>
              )}
              <span>{formatDate(d.updated_at)}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReDownload(d)}
              disabled={busyId === d.id}
              className="text-xs text-ink-muted hover:text-ink px-2.5 py-1 rounded hover:bg-black/5 disabled:opacity-50"
              title="Regenerate the .docx from the saved field values"
            >
              {busyId === d.id ? "..." : "Download"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(d)}
              disabled={busyId === d.id}
              className="text-xs text-red-700 hover:bg-red-50 px-2.5 py-1 rounded disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
