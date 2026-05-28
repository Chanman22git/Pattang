import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NewCaseDialog from "../components/NewCaseDialog";
import { listCasesEnriched, relativeWhen } from "../lib/cases";
import { readError } from "../lib/errors";
import type { CaseRowEnriched, CaseStatus } from "../lib/types";

type FilterChip = "all" | CaseStatus;

const PAGE_SIZE = 6;

export default function CasesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const filter: FilterChip = (params.get("status") as FilterChip) || "all";
  const page = Math.max(0, parseInt(params.get("page") || "0", 10) || 0);

  const [cases, setCases] = useState<CaseRowEnriched[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const rows = await listCasesEnriched();
      setCases(rows);
    } catch (err) {
      setError(readError(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const list = cases ?? [];
    return {
      all: list.length,
      active: list.filter((c) => c.status === "active").length,
      on_hold: list.filter((c) => c.status === "on_hold").length,
      closed: list.filter((c) => c.status === "closed").length,
    };
  }, [cases]);

  const filtered = useMemo(() => {
    if (!cases) return null;
    if (filter === "all") return cases;
    return cases.filter((c) => c.status === filter);
  }, [cases, filter]);

  const total = filtered?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageCases = filtered?.slice(start, end) ?? [];

  function setFilter(next: FilterChip) {
    const np = new URLSearchParams(params);
    if (next === "all") np.delete("status");
    else np.set("status", next);
    np.delete("page");
    setParams(np, { replace: true });
  }
  function setPage(next: number) {
    const np = new URLSearchParams(params);
    if (next === 0) np.delete("page");
    else np.set("page", String(next));
    setParams(np, { replace: true });
  }

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  return (
    <>
      <CasesHero
        total={counts.all}
        counts={counts}
        date={today}
        onNew={() => setDialogOpen(true)}
      />

      <FiltersBar
        active={filter}
        counts={counts}
        onChange={setFilter}
      />

      {error && (
        <div
          className="mt-4 text-sm text-seal"
          style={{
            background: "#EAD9D9",
            border: "0.5px solid #4A1818",
            borderRadius: 2,
            padding: "12px 16px",
          }}
        >
          Couldn&rsquo;t load cases: {error}
        </div>
      )}

      {cases === null && !error ? (
        <Skeleton />
      ) : cases && cases.length === 0 ? (
        <EmptyCases onNew={() => setDialogOpen(true)} />
      ) : pageCases.length === 0 ? (
        <NoMatchesFor filter={filter} />
      ) : (
        <CasesTable
          cases={pageCases}
          page={safePage}
          pageCount={pageCount}
          total={total}
          start={start + 1}
          end={end}
          onPage={setPage}
          onRowClick={(id) => navigate(`/cases/${id}`)}
        />
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

// ────────────────────────────────────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────────────────────────────────────
function CasesHero({
  total,
  counts,
  date,
  onNew,
}: {
  total: number;
  counts: { all: number; active: number; on_hold: number; closed: number };
  date: string;
  onNew: () => void;
}) {
  return (
    <header style={{ marginBottom: 28 }}>
      <div className="flex justify-between items-end gap-6">
        <div>
          <div
            className="uppercase font-medium text-ink-3"
            style={{ fontSize: 11, letterSpacing: "0.08em", marginBottom: 14 }}
          >
            Cause list · {date}
          </div>
          <h1
            className="font-serif font-medium text-ink m-0"
            style={{ fontSize: 32, lineHeight: 1.3, letterSpacing: "-0.005em" }}
          >
            Cases
          </h1>
          <p
            className="text-ink-2"
            style={{
              fontSize: 15,
              marginTop: 10,
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            Every matter on your file, ordered by next hearing. Each row drills
            into its dossier — parties, history, documents and the next thing
            to prepare.
          </p>
          <div
            className="flex font-mono text-ink-2"
            style={{
              gap: 18,
              marginTop: 14,
              fontSize: 12,
              letterSpacing: "0.02em",
            }}
          >
            <span>
              <span style={{ color: "#1A1F2E", fontWeight: 500 }}>{total}</span>{" "}
              matters
            </span>
            <span className="text-ink-3">·</span>
            <span>
              <span style={{ color: "#2D4A3E", fontWeight: 500 }}>
                {counts.active}
              </span>{" "}
              active
            </span>
            <span className="text-ink-3">·</span>
            <span>
              <span style={{ color: "#8B6F47", fontWeight: 500 }}>
                {counts.on_hold}
              </span>{" "}
              on hold
            </span>
            <span className="text-ink-3">·</span>
            <span>
              <span style={{ color: "#A8956F", fontWeight: 500 }}>
                {counts.closed}
              </span>{" "}
              closed
            </span>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            className="vc-btn-secondary"
            title="Coming with Phase 4 — eCourts vendor"
            disabled
          >
            Import cause-list
          </button>
          <button className="vc-btn-primary" onClick={onNew}>
            New case
          </button>
        </div>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Filters bar
// ────────────────────────────────────────────────────────────────────────────
function FiltersBar({
  active,
  counts,
  onChange,
}: {
  active: FilterChip;
  counts: { all: number; active: number; on_hold: number; closed: number };
  onChange: (next: FilterChip) => void;
}) {
  const chips: { value: FilterChip; label: string; n: number }[] = [
    { value: "all", label: "All", n: counts.all },
    { value: "active", label: "Active", n: counts.active },
    { value: "on_hold", label: "On hold", n: counts.on_hold },
    { value: "closed", label: "Closed", n: counts.closed },
  ];
  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderTop: "0.5px solid #5A3A1F",
        borderBottom: "0.5px solid rgba(90,58,31,0.18)",
        padding: "12px 0",
        marginTop: 8,
      }}
    >
      <div className="flex gap-1.5">
        {chips.map((c) => {
          const isActive = c.value === active;
          return (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 2,
                border: `1px solid ${isActive ? "#1A1F2E" : "transparent"}`,
                background: isActive ? "#1A1F2E" : "transparent",
                color: isActive ? "#FAF8F3" : "#6B6358",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "baseline",
                gap: 8,
                cursor: "pointer",
                transition:
                  "background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out",
              }}
            >
              <span>{c.label}</span>
              <span
                className="font-mono"
                style={{ fontSize: 11, opacity: 0.75 }}
              >
                {c.n}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="flex items-center text-ink-2"
        style={{ gap: 16, fontSize: 13 }}
      >
        <span
          className="text-ink-3 uppercase font-medium"
          style={{ fontSize: 11, letterSpacing: "0.08em" }}
        >
          Sort
        </span>
        <a
          className="vc-link"
          style={{ color: "#1A1F2E", fontWeight: 500 }}
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          Next hearing ↓
        </a>
        <span className="text-ink-3">·</span>
        <a
          className="vc-link"
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          Group by court
        </a>
        <span className="text-ink-3">·</span>
        <input
          placeholder="Filter…"
          className="vc-input"
          style={{ width: 160, padding: "6px 10px", fontSize: 12.5 }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Table card
// ────────────────────────────────────────────────────────────────────────────
function CasesTable({
  cases,
  page,
  pageCount,
  total,
  start,
  end,
  onPage,
  onRowClick,
}: {
  cases: CaseRowEnriched[];
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
  onPage: (n: number) => void;
  onRowClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
      }}
    >
      {/* Column header */}
      <div
        className="grid uppercase font-medium text-ink-3"
        style={{
          gridTemplateColumns: "1fr 200px 150px 30px",
          gap: 16,
          padding: "11px 22px",
          borderBottom: "0.5px solid rgba(90,58,31,0.18)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        <div>Matter</div>
        <div>Forum</div>
        <div>Next hearing</div>
        <div></div>
      </div>

      {cases.map((c, i) => (
        <CaseRow
          key={c.id}
          c={c}
          last={i === cases.length - 1}
          onClick={() => onRowClick(c.id)}
        />
      ))}

      <Pagination
        start={start}
        end={end}
        total={total}
        page={page}
        pageCount={pageCount}
        onChange={onPage}
      />
    </div>
  );
}

function CaseRow({
  c,
  last,
  onClick,
}: {
  c: CaseRowEnriched;
  last: boolean;
  onClick: () => void;
}) {
  const dim = c.status === "closed";
  const ink = dim ? "#A8956F" : "#1A1F2E";
  const ink2 = dim ? "#A8956F" : "#6B6358";

  return (
    <Link
      to={`/cases/${c.id}`}
      onClick={onClick}
      className="vc-row grid items-start"
      style={{
        gridTemplateColumns: "1fr 200px 150px 30px",
        gap: 16,
        padding: "20px 22px",
        borderBottom: last ? "none" : "0.5px solid rgba(90,58,31,0.18)",
        background: c.pinned ? "rgba(184,134,47,0.07)" : "transparent",
        borderLeft: c.pinned
          ? "2px solid #B8862F"
          : "2px solid transparent",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Matter cell */}
      <div>
        <div
          className="flex items-center flex-wrap"
          style={{ gap: 8, marginBottom: 8 }}
        >
          {c.type && <span className="vc-tag">{c.type}</span>}
          {c.stage && (
            <span
              style={{
                fontSize: 11.5,
                color: ink2,
                fontStyle: "italic",
              }}
            >
              {c.stage}
            </span>
          )}
          {c.pinned && (
            <span className="vc-tag vc-tag-seal" style={{ marginLeft: 4 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: "currentColor",
                }}
              ></span>
              Next up
            </span>
          )}
          {c.unconfirmed > 0 && (
            <span className="vc-tag vc-tag-brass">
              {c.unconfirmed} fact{c.unconfirmed === 1 ? "" : "s"} to confirm
            </span>
          )}
        </div>
        <div
          className="font-serif font-medium"
          style={{
            fontSize: 22,
            lineHeight: 1.3,
            color: ink,
            letterSpacing: "-0.005em",
          }}
        >
          {c.parties.p}{" "}
          {c.parties.r && (
            <>
              <span
                style={{
                  fontStyle: "italic",
                  color: ink2,
                  fontWeight: 400,
                }}
              >
                v.
              </span>{" "}
              {c.parties.r}
            </>
          )}
        </div>
        {c.gist && (
          <div
            style={{
              fontSize: 13.5,
              color: ink2,
              lineHeight: 1.6,
              marginTop: 6,
              maxWidth: 720,
            }}
          >
            {c.gist}
          </div>
        )}
        <div
          className="flex font-mono"
          style={{
            gap: 12,
            marginTop: 10,
            fontSize: 11.5,
            color: "#A8956F",
            letterSpacing: "0.02em",
          }}
        >
          {c.case_no && <span>{c.case_no}</span>}
          {c.case_no && c.cnr && (
            <span style={{ color: "#A8956F" }}>·</span>
          )}
          {c.cnr && <span>CNR {c.cnr}</span>}
          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
            }}
          >
            · {c.docs} docs · {c.facts} facts
          </span>
        </div>
      </div>

      {/* Forum */}
      <div style={{ paddingTop: 28, lineHeight: 1.4 }}>
        {c.court && (
          <div
            className="font-serif font-medium"
            style={{ fontSize: 15.5, color: ink }}
          >
            {c.court}
          </div>
        )}
        {/* No bench column in DB yet — left intentionally blank. */}
      </div>

      {/* Next hearing — placeholder until P4 wires real values. */}
      <div style={{ paddingTop: 28 }}>
        <div
          className="font-mono"
          style={{
            fontSize: 13,
            color: ink,
            letterSpacing: "0.01em",
            fontWeight: 500,
          }}
        >
          {c.next ? formatDate(c.next) : "—"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: ink2,
            marginTop: 2,
            fontStyle: "italic",
          }}
        >
          {relativeWhen(c.next) ?? "no date yet"}
        </div>
      </div>

      <div
        className="font-serif text-ink-3 text-right"
        style={{ fontSize: 18, paddingTop: 28 }}
      >
        ›
      </div>
    </Link>
  );
}

function Pagination({
  start,
  end,
  total,
  page,
  pageCount,
  onChange,
}: {
  start: number;
  end: number;
  total: number;
  page: number;
  pageCount: number;
  onChange: (n: number) => void;
}) {
  const pageNumbers = (() => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
    const out = new Set<number>([
      0,
      pageCount - 1,
      page - 1,
      page,
      page + 1,
    ]);
    return [...out]
      .filter((p) => p >= 0 && p < pageCount)
      .sort((a, b) => a - b);
  })();

  const pagerBtn = (disabled: boolean): React.CSSProperties => ({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 12.5,
    padding: "6px 12px",
    borderRadius: 2,
    border: "1px solid rgba(90,58,31,0.18)",
    background: "#FAF8F3",
    color: disabled ? "#A8956F" : "#6B6358",
    cursor: disabled ? "default" : "pointer",
    transition:
      "background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out",
  });

  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderTop: "0.5px solid rgba(90,58,31,0.18)",
        padding: "12px 22px",
      }}
    >
      <div
        className="font-mono text-ink-3"
        style={{ fontSize: 11.5, letterSpacing: "0.02em" }}
      >
        Showing{" "}
        <span style={{ color: "#1A1F2E" }}>
          {start}–{end}
        </span>{" "}
        of <span style={{ color: "#1A1F2E" }}>{total}</span>
      </div>
      <div className="flex items-center" style={{ gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          style={pagerBtn(page === 0)}
        >
          ‹ Prev
        </button>
        {pageNumbers.map((p, i) => {
          const isGap = i > 0 && p - pageNumbers[i - 1] > 1;
          return (
            <span key={p} className="contents">
              {isGap && (
                <span
                  className="font-mono text-ink-3"
                  style={{ fontSize: 12, padding: "0 4px" }}
                >
                  …
                </span>
              )}
              <button
                onClick={() => onChange(p)}
                style={{
                  fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  fontSize: 12.5,
                  minWidth: 30,
                  padding: "6px 10px",
                  borderRadius: 2,
                  border: `1px solid ${
                    p === page ? "#1A1F2E" : "rgba(90,58,31,0.18)"
                  }`,
                  background: p === page ? "#1A1F2E" : "#FAF8F3",
                  color: p === page ? "#FAF8F3" : "#6B6358",
                  fontWeight: p === page ? 500 : 400,
                  cursor: "pointer",
                  transition: "all 150ms ease-out",
                }}
              >
                {p + 1}
              </button>
            </span>
          );
        })}
        <button
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          disabled={page >= pageCount - 1}
          style={pagerBtn(page >= pageCount - 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Skeletons, empties
// ────────────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#FAF8F3",
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderRadius: 2,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            padding: "22px",
            borderBottom:
              i < 2 ? "0.5px solid rgba(90,58,31,0.18)" : "none",
          }}
        >
          <div
            className="animate-pulse rounded"
            style={{
              height: 18,
              width: "40%",
              background: "rgba(90,58,31,0.08)",
              marginBottom: 8,
            }}
          />
          <div
            className="animate-pulse rounded"
            style={{
              height: 12,
              width: "60%",
              background: "rgba(90,58,31,0.05)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyCases({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="text-center"
      style={{
        marginTop: 32,
        padding: "56px 24px",
        border: "0.5px dashed rgba(90,58,31,0.4)",
        borderRadius: 2,
        background: "#FAF8F3",
      }}
    >
      <div
        className="font-serif font-medium text-ink"
        style={{ fontSize: 22 }}
      >
        No cases on file yet
      </div>
      <p
        className="text-ink-2"
        style={{
          margin: "12px auto 24px",
          maxWidth: 480,
          fontSize: 14,
        }}
      >
        Each case is the hub for its documents, parties, dates and deadlines.
        Start with one — the rest fills in over time.
      </p>
      <button className="vc-btn-primary" onClick={onNew}>
        New case
      </button>
    </div>
  );
}

function NoMatchesFor({ filter }: { filter: FilterChip }) {
  return (
    <div
      className="text-center text-ink-2"
      style={{
        marginTop: 24,
        padding: "32px 24px",
        border: "0.5px dashed rgba(90,58,31,0.18)",
        borderRadius: 2,
        background: "#FAF8F3",
        fontSize: 14,
      }}
    >
      No <span style={{ fontWeight: 500 }}>{filter.replace("_", " ")}</span>{" "}
      cases right now.
    </div>
  );
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
