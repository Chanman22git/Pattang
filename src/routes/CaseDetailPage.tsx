import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteCase, getCase } from "../lib/cases";
import type { CaseRow } from "../lib/types";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<CaseRow | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCase(id)
      .then((row) => {
        if (active) setC(row);
      })
      .catch((err) => {
        if (active) setError(err.message ?? String(err));
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (c === undefined && !error) {
    return <div className="text-sm text-ink-muted">Loading...</div>;
  }
  if (error) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
        {error}
      </div>
    );
  }
  if (c === null) {
    return (
      <div className="space-y-3">
        <div className="font-serif text-2xl">Case not found</div>
        <Link to="/cases" className="text-sm text-accent hover:underline">
          ← Back to cases
        </Link>
      </div>
    );
  }
  if (!c) return null;

  async function onDelete() {
    if (!id) return;
    if (
      !confirm(
        "Delete this case? Its documents, citations and calendar events go with it. This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteCase(id);
      navigate("/cases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-2">
        <Link to="/cases" className="text-xs text-ink-muted hover:text-ink">
          ← Cases
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4 mb-8 border-b border-black/10 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {c.title}
          </h1>
          <div className="mt-2 text-sm text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
            {c.court && <span>{c.court}</span>}
            {c.case_no && <span>Case no: {c.case_no}</span>}
            {c.cnr && <span className="font-mono">CNR: {c.cnr}</span>}
            {c.type && <span>{c.type}</span>}
            <span className="capitalize">{c.status.replace("_", " ")}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 text-sm text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete case"}
        </button>
      </div>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold mb-3">Case History</h2>
        <div className="border border-dashed border-black/15 rounded-lg p-6 bg-white/50 text-sm text-ink-muted leading-relaxed">
          Parties, key dates and facts will appear here, auto-extracted from
          the case&rsquo;s documents and confirmed by you. Arrives in
          <span className="font-medium text-ink"> Phase 2 (P2)</span>.
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Case Documents
        </h2>
        <div className="border border-dashed border-black/15 rounded-lg p-6 bg-white/50 text-sm text-ink-muted leading-relaxed">
          The documents you create for this case (petitions, appeals, legal
          notices) will live here. The next chunk of Phase 1a adds the
          template-driven creation flow.
        </div>
      </section>

      {c.notes && (
        <section className="mb-10">
          <h2 className="font-serif text-xl font-semibold mb-3">Notes</h2>
          <div className="text-sm whitespace-pre-wrap leading-relaxed bg-white border border-black/10 rounded-lg p-4">
            {c.notes}
          </div>
        </section>
      )}
    </>
  );
}
