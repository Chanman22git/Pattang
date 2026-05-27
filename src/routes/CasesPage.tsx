import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import NewCaseDialog from "../components/NewCaseDialog";
import { listCases } from "../lib/cases";
import type { CaseRow } from "../lib/types";

const statusStyles: Record<CaseRow["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-black/5 text-ink-muted border-black/10",
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await listCases();
      setCases(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8 border-b border-black/10 pb-5">
        <PageHeader
          title="Cases"
          subtitle="Every document, fact and deadline for a matter — in one place."
        />
        <button
          onClick={() => setDialogOpen(true)}
          className="shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-accent text-white hover:bg-accent/90"
        >
          New case
        </button>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          Couldn&rsquo;t load cases: {error}
        </div>
      )}

      {cases === null && !error && <CasesSkeleton />}

      {cases && cases.length === 0 && (
        <EmptyState
          title="No cases yet"
          body="Each case is the hub for its documents, parties, dates and deadlines. Start with one — you can come back and fill in the details later."
          cta="Create your first case"
          onClick={() => setDialogOpen(true)}
        />
      )}

      {cases && cases.length > 0 && (
        <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
          {cases.map((c) => (
            <li key={c.id} className="border-b border-black/10 last:border-b-0">
              <Link
                to={`/cases/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-paper transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {c.court && <span>{c.court}</span>}
                    {c.case_no && <span>#{c.case_no}</span>}
                    {c.cnr && <span className="font-mono">{c.cnr}</span>}
                    {c.type && <span>{c.type}</span>}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border ${
                    statusStyles[c.status]
                  }`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewCaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          setDialogOpen(false);
          refresh();
        }}
      />
    </>
  );
}

function CasesSkeleton() {
  return (
    <ul className="border border-black/10 rounded-lg overflow-hidden bg-white">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="border-b border-black/10 last:border-b-0 px-5 py-4"
        >
          <div className="h-4 w-1/3 bg-black/5 rounded mb-2 animate-pulse" />
          <div className="h-3 w-1/2 bg-black/5 rounded animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
