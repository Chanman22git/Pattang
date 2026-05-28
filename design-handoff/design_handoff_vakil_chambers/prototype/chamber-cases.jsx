// Chamber — Cases list (Vakil Chambers)

function ChamberCasesList() {
  const t = chamberTokens;
  const cases = MOCK_CASES;
  const counts = {
    all: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    onHold: cases.filter(c => c.status === 'on_hold').length,
    closed: cases.filter(c => c.status === 'closed').length,
  };
  return (
    <ChamberShell active="Cases" breadcrumb="Cases · index of dockets">
      <ChamberCasesHero counts={counts} total={cases.length} />
      <ChamberCasesFilters counts={counts} />
      <ChamberCasesTable cases={cases} />
    </ChamberShell>
  );
}

function ChamberCasesHero({ counts, total }) {
  const t = chamberTokens;
  return (
    <header style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div>
          <div style={{
            fontFamily: t.sans, fontSize: 11, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: t.ink3, marginBottom: 14, fontWeight: 500,
          }}>
            Cause list · 28 May 2026
          </div>
          <h1 style={{
            fontFamily: t.serif, fontWeight: 500, fontSize: 32, lineHeight: 1.3,
            letterSpacing: '-0.005em', margin: 0, color: t.ink,
          }}>
            Cases
          </h1>
          <p style={{
            fontFamily: t.sans, fontSize: 15, color: t.ink2, marginTop: 10,
            maxWidth: 620, lineHeight: 1.6,
          }}>
            Every matter on your file, ordered by next hearing. Each row drills into its dossier — parties, history, documents and the next thing to prepare.
          </p>
          <div style={{
            display: 'flex', gap: 18, marginTop: 14, fontFamily: t.mono,
            fontSize: 12, color: t.ink2, letterSpacing: '0.02em',
          }}>
            <span><span style={{ color: t.ink, fontWeight: 500 }}>{total}</span> matters</span>
            <span style={{ color: t.ink3 }}>·</span>
            <span><span style={{ color: t.lawn, fontWeight: 500 }}>{counts.active}</span> active</span>
            <span style={{ color: t.ink3 }}>·</span>
            <span><span style={{ color: t.twine, fontWeight: 500 }}>{counts.onHold}</span> on hold</span>
            <span style={{ color: t.ink3 }}>·</span>
            <span><span style={{ color: t.ink3, fontWeight: 500 }}>{counts.closed}</span> closed</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="vc-btn-secondary">Import cause-list</button>
          <button className="vc-btn-primary">New case</button>
        </div>
      </div>
    </header>
  );
}

function ChamberCasesFilters({ counts }) {
  const t = chamberTokens;
  const [activeChip, setActiveChip] = React.useState('All');
  const chips = [
    { label: 'All',     n: counts.all },
    { label: 'Active',  n: counts.active },
    { label: 'On hold', n: counts.onHold },
    { label: 'Closed',  n: counts.closed },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderTop: `0.5px solid ${t.teak}`, borderBottom: `0.5px solid ${t.ruleSoft}`,
      padding: '12px 0', marginTop: 8,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {chips.map(c => {
          const isActive = c.label === activeChip;
          return (
            <button
              key={c.label}
              onClick={() => setActiveChip(c.label)}
              style={{
                padding: '6px 12px', borderRadius: 2,
                border: `1px solid ${isActive ? t.ink : 'transparent'}`,
                background: isActive ? t.ink : 'transparent',
                color: isActive ? t.surface : t.ink2,
                fontFamily: t.sans, fontSize: 13, fontWeight: 500,
                display: 'inline-flex', alignItems: 'baseline', gap: 8,
                cursor: 'pointer',
                transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
              }}>
              <span>{c.label}</span>
              <span style={{ fontFamily: t.mono, fontSize: 11, opacity: 0.75 }}>{c.n}</span>
            </button>
          );
        })}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        fontSize: 13, color: t.ink2,
      }}>
        <span style={{ color: t.ink3, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Sort</span>
        <a className="vc-link" style={{ color: t.ink, fontWeight: 500 }}>Next hearing ↓</a>
        <span style={{ color: t.ink3 }}>·</span>
        <a className="vc-link">Group by court</a>
        <span style={{ color: t.ink3 }}>·</span>
        <input placeholder="Filter…" className="vc-input" style={{ width: 160, padding: '6px 10px', fontSize: 12.5 }} />
      </div>
    </div>
  );
}

function ChamberCasesTable({ cases }) {
  const t = chamberTokens;
  const PAGE_SIZE = 6;
  const [page, setPage] = React.useState(0);
  const total = cases.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageCases = cases.slice(start, end);

  return (
    <div style={{
      marginTop: 16, background: t.surface,
      border: `0.5px solid ${t.ruleSoft}`, borderRadius: 2,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 200px 150px 30px',
        gap: 16, padding: '11px 22px',
        borderBottom: `0.5px solid ${t.ruleSoft}`,
        fontFamily: t.sans, fontSize: 11, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: t.ink3, fontWeight: 500,
      }}>
        <div>Matter</div><div>Forum</div><div>Next hearing</div><div></div>
      </div>
      {pageCases.map((c, i) => <ChamberCaseRow key={start + i} c={c} last={i === pageCases.length - 1} />)}
      <ChamberPagination
        start={start + 1}
        end={end}
        total={total}
        page={safePage}
        pageCount={pageCount}
        onChange={setPage}
      />
    </div>
  );
}

function ChamberCaseRow({ c, last }) {
  const t = chamberTokens;
  const dim = c.status === 'closed';
  const ink = dim ? t.ink3 : t.ink;
  const ink2 = dim ? t.ink3 : t.ink2;

  const stageTagClass = c.pinned ? 'vc-tag vc-tag-seal'
    : c.status === 'closed' ? 'vc-tag'
    : 'vc-tag';

  return (
    <a
      className="vc-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 200px 150px 30px',
        gap: 16, alignItems: 'flex-start',
        padding: '20px 22px',
        borderBottom: last ? 'none' : `0.5px solid ${t.ruleSoft}`,
        background: c.pinned ? 'rgba(184,134,47,0.07)' : 'transparent',
        textDecoration: 'none', color: 'inherit',
        borderLeft: c.pinned ? `2px solid ${t.accent}` : '2px solid transparent',
      }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span className="vc-tag">{c.type}</span>
          <span style={{
            fontFamily: t.sans, fontSize: 11.5, color: ink2,
            fontStyle: 'italic',
          }}>{c.stage}</span>
          {c.pinned && (
            <span className="vc-tag vc-tag-seal" style={{ marginLeft: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }}></span>
              Next up
            </span>
          )}
          {c.unconfirmed > 0 && (
            <span className="vc-tag vc-tag-brass">
              {c.unconfirmed} fact{c.unconfirmed === 1 ? '' : 's'} to confirm
            </span>
          )}
        </div>
        <div style={{
          fontFamily: t.serif, fontSize: 22, lineHeight: 1.3, color: ink,
          fontWeight: 500, letterSpacing: '-0.005em',
        }}>
          {c.parties.p}{' '}
          <span style={{ fontStyle: 'italic', color: ink2, fontWeight: 400 }}>v.</span>{' '}
          {c.parties.r}
        </div>
        {c.gist && (
          <div style={{
            fontFamily: t.sans, fontSize: 13.5, color: ink2,
            lineHeight: 1.6, marginTop: 6, maxWidth: 720,
          }}>
            {c.gist}
          </div>
        )}
        <div style={{
          display: 'flex', gap: 12, marginTop: 10,
          fontFamily: t.mono, fontSize: 11.5, color: t.ink3, letterSpacing: '0.02em',
        }}>
          <span>{c.caseNo}</span>
          <span style={{ color: t.ink3 }}>·</span>
          <span>CNR {c.cnr}</span>
          <span style={{ fontFamily: t.sans, fontSize: 12, color: t.ink3 }}>
            · {c.docs} docs · {c.facts} facts
          </span>
        </div>
      </div>
      <div style={{ paddingTop: 28, fontFamily: t.sans, fontSize: 14, color: ink, lineHeight: 1.4 }}>
        <div style={{ fontFamily: t.serif, fontSize: 15.5, fontWeight: 500, color: ink }}>{c.court}</div>
        <div style={{ fontSize: 12, color: ink2, marginTop: 2 }}>{c.bench}</div>
      </div>
      <div style={{ paddingTop: 28 }}>
        <div style={{
          fontFamily: t.mono, fontSize: 13, color: ink,
          letterSpacing: '0.01em', fontWeight: 500,
        }}>{c.next}</div>
        <div style={{ fontSize: 12, color: ink2, marginTop: 2, fontStyle: 'italic' }}>{c.nextRel}</div>
      </div>
      <div style={{
        fontSize: 18, color: t.ink3, textAlign: 'right',
        paddingTop: 28, fontFamily: t.serif,
      }}>›</div>
    </a>
  );
}

function ChamberPagination({ start, end, total, page, pageCount, onChange }) {
  const t = chamberTokens;
  const pageNumbers = (() => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
    const out = new Set([0, pageCount - 1, page - 1, page, page + 1]);
    return [...out].filter(p => p >= 0 && p < pageCount).sort((a, b) => a - b);
  })();
  const pagerBtn = (disabled) => ({
    fontFamily: t.sans, fontSize: 12.5, fontWeight: 400,
    padding: '6px 12px', borderRadius: 2,
    border: `1px solid ${t.ruleSoft}`,
    background: t.surface,
    color: disabled ? t.ink3 : t.ink2,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
  });
  return (
    <div style={{
      borderTop: `0.5px solid ${t.ruleSoft}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 22px',
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 11.5, color: t.ink3, letterSpacing: '0.02em',
      }}>
        Showing <span style={{ color: t.ink }}>{start}–{end}</span> of <span style={{ color: t.ink }}>{total}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          style={pagerBtn(page === 0)}>
          ‹ Prev
        </button>
        {pageNumbers.map((p, i) => {
          const isGap = i > 0 && p - pageNumbers[i - 1] > 1;
          return (
            <React.Fragment key={p}>
              {isGap && <span style={{ color: t.ink3, fontFamily: t.mono, fontSize: 12, padding: '0 4px' }}>…</span>}
              <button
                onClick={() => onChange(p)}
                style={{
                  fontFamily: t.mono, fontSize: 12.5,
                  minWidth: 30, padding: '6px 10px', borderRadius: 2,
                  border: `1px solid ${p === page ? t.ink : t.ruleSoft}`,
                  background: p === page ? t.ink : t.surface,
                  color: p === page ? t.surface : t.ink2,
                  fontWeight: p === page ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}>
                {p + 1}
              </button>
            </React.Fragment>
          );
        })}
        <button
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          disabled={page >= pageCount - 1}
          style={pagerBtn(page >= pageCount - 1)}>
          Next ›
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ChamberCasesList });
