import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteCase,
  getCase,
  listCaseFacts,
  type CaseFactRow,
} from "../lib/cases";
import { listDocumentsForCase } from "../lib/documents";
import { readError } from "../lib/errors";
import type { CaseRow, DocumentWithLinks } from "../lib/types";

/**
 * Case Detail (Vakil Chambers). 1fr / 320px split:
 *   left  → caption + (optional) hearing banner + case history + documents
 *   right → Dossier rail (parties, reliefs, key facts, at-a-glance)
 *
 * Some sections degrade gracefully because the schema doesn't yet carry:
 *   - explicit next-hearing (Phase 4 / calendar_event)
 *   - rich reliefs / pleadings text (would need a new column)
 *   - timeline of orders & hearings (Phase 2+)
 * Where the data is thin, we still render the section header with an
 * honest "coming with phase N" stub rather than hiding it — the layout
 * shape on the page should match the design.
 */
export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [c, setC] = useState<CaseRow | null | undefined>(undefined);
  const [docs, setDocs] = useState<DocumentWithLinks[]>([]);
  const [facts, setFacts] = useState<CaseFactRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([
      getCase(id),
      listDocumentsForCase(id),
      listCaseFacts(id),
    ])
      .then(([row, dList, fList]) => {
        if (!active) return;
        setC(row);
        setDocs(dList);
        setFacts(fList);
      })
      .catch((err) => {
        if (active) setError(readError(err));
      });
    return () => {
      active = false;
    };
  }, [id]);

  const parties = useMemo(() => (c ? splitParties(c.title) : null), [c]);

  if (c === undefined && !error)
    return <div className="text-ink-3" style={{ fontSize: 13 }}>Loading…</div>;
  if (error) return <ErrorNotice msg={error} />;
  if (c === null)
    return (
      <div>
        <h1
          className="font-serif font-medium text-ink"
          style={{ fontSize: 28 }}
        >
          Case not found
        </h1>
        <Link
          to="/cases"
          className="vc-link mt-3 inline-block"
          style={{ fontSize: 13 }}
        >
          ← Back to cases
        </Link>
      </div>
    );
  if (!c) return null;

  async function onDelete() {
    if (!c) return;
    if (
      !confirm(
        "Delete this case? Its documents, citations and calendar events go with it. This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteCase(c.id);
      navigate("/cases");
    } catch (err) {
      setError(readError(err));
      setDeleting(false);
    }
  }

  return (
    <>
      <CaseCaption c={c} parties={parties} docCount={docs.length} />

      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 320px",
          gap: 48,
          marginTop: 40,
        }}
      >
        <div>
          <HearingBanner />
          <TimelineSection docs={docs} />
          <DocumentsSection caseId={c.id} docs={docs} />

          <div
            style={{
              marginTop: 48,
              paddingTop: 18,
              borderTop: "0.5px solid rgba(90,58,31,0.18)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onDelete}
              disabled={deleting}
              className="vc-btn-secondary"
              style={{ color: "#4A1818", borderColor: "rgba(90,58,31,0.18)" }}
            >
              {deleting ? "Deleting…" : "Delete case"}
            </button>
          </div>
        </div>

        <Dossier c={c} parties={parties} facts={facts} />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Caption header
// ────────────────────────────────────────────────────────────────────────────
function CaseCaption({
  c,
  parties,
  docCount,
}: {
  c: CaseRow;
  parties: { p: string; r: string } | null;
  docCount: number;
}) {
  const stage = c.status === "closed" ? "Disposed" : c.status === "on_hold" ? "On hold" : "Active";
  return (
    <header>
      {c.court && (
        <div
          className="uppercase font-medium text-ink-3"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          In the {c.court}
        </div>
      )}
      <div
        className="flex items-baseline font-mono text-ink-2"
        style={{
          fontSize: 12.5,
          marginBottom: 20,
          gap: 16,
          letterSpacing: "0.02em",
          flexWrap: "wrap",
        }}
      >
        {c.case_no && <span>{c.case_no}</span>}
        {c.case_no && c.cnr && <span className="text-ink-3">·</span>}
        {c.cnr && <span>CNR {c.cnr}</span>}
        {c.type && (
          <>
            <span className="text-ink-3">·</span>
            <span
              className="uppercase font-sans font-medium text-ink-3"
              style={{ fontSize: 10.5, letterSpacing: "0.08em" }}
            >
              {c.type}
            </span>
          </>
        )}
      </div>
      <h1
        className="font-serif font-medium text-ink m-0"
        style={{
          fontSize: 32,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          maxWidth: 820,
        }}
      >
        {parties ? (
          <>
            {parties.p}{" "}
            {parties.r && (
              <>
                <span
                  style={{
                    fontStyle: "italic",
                    color: "#6B6358",
                    fontWeight: 400,
                  }}
                >
                  v.
                </span>{" "}
                {parties.r}
              </>
            )}
          </>
        ) : (
          c.title
        )}
      </h1>

      <div
        className="flex items-center text-ink-2"
        style={{ marginTop: 20, gap: 12, fontSize: 13 }}
      >
        <span
          className={
            c.status === "closed"
              ? "vc-tag"
              : c.status === "on_hold"
              ? "vc-tag"
              : "vc-tag vc-tag-lawn"
          }
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: "currentColor",
            }}
          />
          {stage}
        </span>
        <span className="text-ink-3">·</span>
        <span className="font-mono" style={{ fontSize: 12 }}>
          Opened {formatDate(c.created_at)}
        </span>
        <span className="text-ink-3">·</span>
        <span style={{ fontSize: 13 }}>
          {docCount} document{docCount === 1 ? "" : "s"}
        </span>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hearing banner — placeholder until calendar wiring lands (Phase 4).
// Renders a soft "no next hearing" strip so the layout still anchors.
// ────────────────────────────────────────────────────────────────────────────
function HearingBanner() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        border: "0.5px solid rgba(90,58,31,0.18)",
        borderLeft: "2px solid rgba(90,58,31,0.18)",
        background: "#FAF8F3",
        padding: "14px 20px",
        borderRadius: 2,
        marginBottom: 40,
      }}
    >
      <div>
        <div
          className="uppercase font-medium text-ink-3"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}
        >
          Next hearing — not yet set
        </div>
        <div
          className="text-ink-2"
          style={{ fontSize: 13, fontStyle: "italic" }}
        >
          Calendar sync arrives with Phase 4 · you can set a date manually
          once that ships.
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Case history — collapsible.
// ────────────────────────────────────────────────────────────────────────────
function TimelineSection({ docs }: { docs: DocumentWithLinks[] }) {
  const [open, setOpen] = useState(false);

  // Build a thin timeline from documents (each document creation is a
  // filing event). Real hearings / orders arrive once timeline data lands.
  const events = useMemo(
    () =>
      [...docs]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((d) => ({
          date: d.created_at,
          label: `Filed ${d.title}`,
          kind: "filing" as const,
          doc: d,
        })),
    [docs]
  );

  const last = events.length ? events[events.length - 1] : null;
  const summary = `${events.length} entr${events.length === 1 ? "y" : "ies"}`;

  return (
    <section style={{ marginBottom: 56 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="flex items-baseline justify-between"
        style={{
          borderBottom: "0.5px solid #5A3A1F",
          paddingBottom: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div className="flex items-baseline" style={{ gap: 12 }}>
          <span
            className="font-serif text-ink-2 inline-block"
            style={{
              fontSize: 18,
              width: 14,
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 120ms ease",
            }}
          >
            ›
          </span>
          <div>
            <h2
              className="font-serif font-medium text-ink m-0"
              style={{
                fontSize: 20,
                letterSpacing: "-0.005em",
                lineHeight: 1.3,
              }}
            >
              Case history
            </h2>
            <div className="text-ink-2 mt-1" style={{ fontSize: 13 }}>
              {summary}
              {" · auto-extracted timeline lands with Phase 2"}
            </div>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 14 }}>
          <span
            className="uppercase font-medium text-ink-3"
            style={{ fontSize: 11, letterSpacing: "0.08em" }}
          >
            {open ? "Hide" : "Show"}
          </span>
          {!open && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="vc-btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12.5 }}
              disabled
              title="AI refresh lands with Phase 2"
            >
              Refresh from documents
            </button>
          )}
        </div>
      </div>

      {!open && (
        <div
          className="grid"
          style={{
            marginTop: 16,
            padding: "14px 18px",
            background: "#FAF8F3",
            border: "0.5px solid rgba(90,58,31,0.18)",
            borderRadius: 2,
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <div>
            <div
              className="uppercase font-medium text-ink-3"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Last event
            </div>
            {last ? (
              <>
                <div
                  className="font-mono text-ink-2"
                  style={{ fontSize: 12, letterSpacing: "0.02em" }}
                >
                  {formatDate(last.date)}
                </div>
                <div
                  className="font-serif text-ink"
                  style={{ fontSize: 15.5, marginTop: 4, lineHeight: 1.4 }}
                >
                  {last.label}
                </div>
              </>
            ) : (
              <div
                className="text-ink-3"
                style={{ fontSize: 13, fontStyle: "italic" }}
              >
                No events yet
              </div>
            )}
          </div>
          <div>
            <div
              className="uppercase font-medium"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.1em",
                color: "#4A1818",
                marginBottom: 6,
              }}
            >
              Next event
            </div>
            <div
              className="text-ink-3"
              style={{ fontSize: 13, fontStyle: "italic" }}
            >
              Set when calendar arrives
            </div>
          </div>
        </div>
      )}

      {open && (
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            marginTop: 20,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 94,
              top: 8,
              bottom: 8,
              width: 0.5,
              background: "#5A3A1F",
              opacity: 0.4,
            }}
          />
          {events.length === 0 && (
            <li
              className="text-ink-3"
              style={{ padding: "16px 0", fontSize: 13, fontStyle: "italic" }}
            >
              No documents yet — the timeline fills in as you draft.
            </li>
          )}
          {events.map((e, i) => (
            <li
              key={i}
              className="grid items-start"
              style={{
                gridTemplateColumns: "90px 18px 1fr",
                padding: "14px 0",
                borderBottom:
                  i === events.length - 1
                    ? "none"
                    : "0.5px dashed rgba(90,58,31,0.18)",
              }}
            >
              <div
                className="font-mono text-ink-2"
                style={{
                  fontSize: 12,
                  paddingTop: 2,
                  letterSpacing: "0.02em",
                }}
              >
                {formatDate(e.date)}
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    background: "transparent",
                    border: "1px solid #1A1F2E",
                    marginTop: 6,
                    marginLeft: -4,
                  }}
                />
              </div>
              <div style={{ paddingLeft: 8 }}>
                <div
                  className="font-serif text-ink"
                  style={{ fontSize: 15.5, lineHeight: 1.4 }}
                >
                  {e.label}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Documents — VC-styled inline table.
// ────────────────────────────────────────────────────────────────────────────
function DocumentsSection({
  caseId,
  docs,
}: {
  caseId: string;
  docs: DocumentWithLinks[];
}) {
  return (
    <section>
      <SectionHead
        title="Documents"
        sub="Drafted from templates · downloadable as .docx today, Google Docs next"
        action={
          <Link
            to={`/cases/${caseId}/documents/new`}
            className="vc-btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            New document
          </Link>
        }
      />

      <div
        style={{
          marginTop: 20,
          background: "#FAF8F3",
          border: "0.5px solid rgba(90,58,31,0.18)",
          borderRadius: 2,
        }}
      >
        <div
          className="grid uppercase font-medium text-ink-3"
          style={{
            gridTemplateColumns: "1fr 180px 90px 100px",
            padding: "11px 20px",
            borderBottom: "0.5px solid rgba(90,58,31,0.18)",
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          <div>Title</div>
          <div>From template</div>
          <div>Status</div>
          <div className="text-right">Created</div>
        </div>

        {docs.length === 0 && (
          <div
            className="text-ink-3"
            style={{
              padding: "28px 20px",
              fontSize: 13,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            No documents yet. Pick a template and the case-specific content is
            all you have to fill in.
          </div>
        )}

        {docs.map((d, i) => (
          <div
            key={d.id}
            className="vc-row grid items-center"
            style={{
              gridTemplateColumns: "1fr 180px 90px 100px",
              padding: "15px 20px",
              borderBottom:
                i === docs.length - 1
                  ? "none"
                  : "0.5px solid rgba(90,58,31,0.18)",
              fontSize: 14,
            }}
          >
            <div className="flex items-center" style={{ gap: 10 }}>
              <span
                className="font-mono text-ink-2 uppercase"
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  background: "#FFFFFF",
                  borderRadius: 2,
                  letterSpacing: "0.06em",
                  border: "0.5px solid rgba(90,58,31,0.18)",
                }}
              >
                DOC
              </span>
              <span
                className="font-serif font-medium text-ink"
                style={{ fontSize: 15.5 }}
              >
                {d.title}
              </span>
            </div>
            <div className="text-ink-2" style={{ fontSize: 12.5 }}>
              {d.template_name ? (
                d.template_name
              ) : d.field_values?.kind === "live" ? (
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    background: "#FFFFFF",
                    borderRadius: 2,
                    letterSpacing: "0.06em",
                    border: "0.5px solid rgba(90,58,31,0.18)",
                    color: "#6B5326",
                  }}
                >
                  Live
                </span>
              ) : (
                "—"
              )}
            </div>
            <div className="font-mono text-ink-2" style={{ fontSize: 12 }}>
              {d.status}
            </div>
            <div
              className="font-mono text-ink-2 text-right"
              style={{ fontSize: 12 }}
            >
              {formatDate(d.created_at)}
            </div>
          </div>
        ))}
      </div>

      <div
        className="text-ink-3 italic"
        style={{ marginTop: 10, fontSize: 12.5 }}
      >
        Pull from this case&rsquo;s documents when drafting the next one —
        facts, parties, citations.
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dossier rail
// ────────────────────────────────────────────────────────────────────────────
function Dossier({
  c,
  parties,
  facts,
}: {
  c: CaseRow;
  parties: { p: string; r: string } | null;
  facts: CaseFactRow[];
}) {
  const confirmedCount = facts.filter((f) => f.confirmed).length;

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
      <div
        className="uppercase font-medium text-ink-3"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.1em",
          marginBottom: 20,
        }}
      >
        Dossier
      </div>

      <DossierBlock label="Parties">
        {parties && parties.p && (
          <DossierParty role="Petitioner" name={parties.p} />
        )}
        {parties && parties.r && (
          <DossierParty role="Respondent" name={parties.r} />
        )}
        {(!parties || (!parties.p && !parties.r)) && (
          <div
            className="text-ink-3"
            style={{ fontSize: 13, fontStyle: "italic" }}
          >
            Title doesn&rsquo;t look like an A v. B caption — edit the case
            title to populate parties automatically.
          </div>
        )}
      </DossierBlock>

      <DossierBlock label="Reliefs sought">
        {c.notes ? (
          <div
            className="font-serif text-ink"
            style={{ fontSize: 14, lineHeight: 1.6 }}
          >
            {c.notes}
          </div>
        ) : (
          <div
            className="text-ink-3"
            style={{ fontSize: 13, fontStyle: "italic" }}
          >
            Add a one-line statement of the relief sought to your case
            notes — it surfaces here.
          </div>
        )}
      </DossierBlock>

      <DossierBlock
        label="Key facts"
        caption={
          facts.length > 0
            ? `${confirmedCount}/${facts.length} confirmed`
            : undefined
        }
      >
        {facts.length === 0 ? (
          <div
            className="text-ink-3"
            style={{ fontSize: 13, fontStyle: "italic" }}
          >
            AI fact-extraction arrives with Phase 2. Until then, the next
            time you create a document, the values you type become a
            starting point.
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {facts.map((f) => (
              <div
                key={f.id}
                style={{
                  paddingLeft: 12,
                  fontSize: 13,
                  color: "#1A1F2E",
                  lineHeight: 1.55,
                  borderLeft: f.confirmed
                    ? "2px solid #2D4A3E"
                    : "2px dashed #4A1818",
                }}
              >
                <div className="font-serif" style={{ fontSize: 13.5 }}>
                  {f.value}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: f.confirmed ? "#A8956F" : "#4A1818",
                    marginTop: 4,
                    letterSpacing: "0.02em",
                  }}
                >
                  {f.kind}
                  {f.confirmed ? "" : " · confirm"}
                </div>
              </div>
            ))}
          </div>
        )}
      </DossierBlock>

      <DossierBlock label="At a glance">
        {c.court && <KV k="Court" v={c.court} />}
        {c.type && <KV k="Type" v={c.type} />}
        <KV k="Filed" v={formatDate(c.created_at)} />
        {c.case_no && <KV k="Case no." v={c.case_no} mono />}
        {c.cnr && <KV k="CNR" v={c.cnr} mono />}
        <KV k="Status" v={c.status.replace("_", " ")} />
      </DossierBlock>
    </aside>
  );
}

function DossierBlock({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 28,
        paddingBottom: 24,
        borderBottom: "0.5px dashed rgba(90,58,31,0.18)",
      }}
    >
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: 14 }}
      >
        <div
          className="uppercase text-ink"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {caption && (
          <div
            className="font-mono text-ink-3"
            style={{ fontSize: 10.5, letterSpacing: "0.02em" }}
          >
            {caption}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DossierParty({ role, name }: { role: string; name: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="uppercase text-ink-3 font-medium"
        style={{ fontSize: 10, letterSpacing: "0.08em" }}
      >
        {role}
      </div>
      <div
        className="font-serif font-medium text-ink"
        style={{ fontSize: 17, lineHeight: 1.3, marginTop: 2 }}
      >
        {name}
      </div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div
      className="flex justify-between"
      style={{ gap: 12, padding: "5px 0", fontSize: 12.5 }}
    >
      <span className="text-ink-3">{k}</span>
      <span
        className={mono ? "font-mono text-ink text-right" : "text-ink text-right"}
        style={{ fontSize: mono ? 11.5 : 12.5 }}
      >
        {v}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section head — shared utility
// ────────────────────────────────────────────────────────────────────────────
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
          <div className="text-ink-2 mt-1" style={{ fontSize: 13 }}>
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

function splitParties(title: string): { p: string; r: string } {
  const m = title.match(/^(.+?)\s+(?:v\.?|vs\.?)\s+(.+)$/i);
  if (m) return { p: m[1].trim(), r: m[2].trim() };
  return { p: title.trim(), r: "" };
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
