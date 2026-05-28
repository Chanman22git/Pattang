// Chamber — Case Detail page (Vakil Chambers)

function ChamberCaseDetail() {
  const t = chamberTokens;
  const c = MOCK_CASE;
  return (
    <ChamberShell active="Cases" breadcrumb={`Cases · ${c.shortTitle}`}>
      <ChamberCaseCaption c={c} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, marginTop: 40 }}>
        <div>
          <ChamberHearingBanner h={c.nextHearing} />
          <ChamberTimeline events={c.timeline} />
          <ChamberDocuments docs={c.documents} />
        </div>
        <ChamberDossier c={c} />
      </div>
    </ChamberShell>
  );
}

function ChamberCaseCaption({ c }) {
  const t = chamberTokens;
  return (
    <header>
      <div style={{
        fontFamily: t.sans, fontSize: 11, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: t.ink3, marginBottom: 14, fontWeight: 500,
      }}>
        In the {c.court} · {c.bench}
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 16,
        fontFamily: t.mono, fontSize: 12.5, color: t.ink2,
        marginBottom: 20, letterSpacing: '0.02em',
      }}>
        <span>{c.caseNo}</span>
        <span style={{ color: t.ink3 }}>·</span>
        <span>CNR {c.cnr}</span>
        <span style={{ color: t.ink3 }}>·</span>
        <span style={{
          textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10.5,
          fontFamily: t.sans, color: t.ink3, fontWeight: 500,
        }}>{c.type}</span>
      </div>
      <h1 style={{
        fontFamily: t.serif, fontWeight: 500, lineHeight: 1.3,
        letterSpacing: '-0.005em', margin: 0, color: t.ink,
        maxWidth: 820, fontSize: 32,
      }}>
        Plaintiff&nbsp;A&nbsp;
        <span style={{ fontStyle: 'italic', color: t.ink2, fontWeight: 400 }}>v.</span>
        &nbsp;Karnataka State Industrial Areas Development Board <span style={{ color: t.ink3 }}>&amp; Anr.</span>
      </h1>
      <div style={{
        marginTop: 20, display: 'flex', alignItems: 'center', gap: 12,
        fontSize: 13, color: t.ink2,
      }}>
        <span className="vc-tag vc-tag-lawn">
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }}></span>
          Active · part-heard
        </span>
        <span style={{ color: t.ink3 }}>·</span>
        <span style={{ fontFamily: t.mono, fontSize: 12 }}>Filed {c.filed}</span>
        <span style={{ color: t.ink3 }}>·</span>
        <span style={{ fontSize: 13 }}>5 documents</span>
      </div>
    </header>
  );
}

function ChamberHearingBanner({ h }) {
  const t = chamberTokens;
  return (
    <div style={{
      border: `0.5px solid ${t.seal}`,
      borderLeft: `2px solid ${t.seal}`,
      background: t.surface, padding: '16px 20px', borderRadius: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 40,
    }}>
      <div>
        <div style={{
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: t.seal, fontWeight: 500, marginBottom: 6,
        }}>
          Next hearing — {h.relative}
        </div>
        <div style={{
          fontFamily: t.serif, fontSize: 22, color: t.ink, lineHeight: 1.3,
          fontWeight: 500,
        }}>
          {h.date}
        </div>
        <div style={{ fontSize: 13, color: t.ink2, marginTop: 4, fontStyle: 'italic' }}>
          Listed for orders · {h.bench}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChamberCaseDetail });
