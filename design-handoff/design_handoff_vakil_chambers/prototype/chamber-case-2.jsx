// Chamber — Timeline + Documents + Section heads (Vakil Chambers)

function ChamberTimeline({ events }) {
  const t = chamberTokens;
  const [open, setOpen] = React.useState(false);
  const upcoming = events.find(e => e.kind === 'upcoming');
  const last = [...events].reverse().find(e => e.kind !== 'upcoming');
  return (
    <section style={{ marginBottom: 56 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          borderBottom: `0.5px solid ${t.teak}`, paddingBottom: 12, cursor: 'pointer',
          userSelect: 'none',
        }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: t.serif, fontSize: 18, color: t.ink2, width: 14,
            display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
          }}>›</span>
          <div>
            <h2 style={{
              fontFamily: t.serif, fontWeight: 500, fontSize: 20,
              margin: 0, color: t.ink, letterSpacing: '-0.005em', lineHeight: 1.3,
            }}>
              Case history
            </h2>
            <div style={{ fontSize: 13, color: t.ink2, marginTop: 4 }}>
              {events.length} entries · 7 confirmed · 2 to review
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontSize: 11, color: t.ink3, fontFamily: t.sans,
            letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            {open ? 'Hide' : 'Show'}
          </span>
          {!open && (
            <button
              onClick={(e) => e.stopPropagation()}
              className="vc-btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12.5 }}>
              Refresh from documents
            </button>
          )}
        </div>
      </div>

      {!open && (
        <div style={{
          marginTop: 16, padding: '14px 18px', background: t.surface,
          border: `0.5px solid ${t.ruleSoft}`, borderRadius: 2,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        }}>
          {last && (
            <div>
              <div style={{
                fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: t.ink3, marginBottom: 6, fontWeight: 500,
              }}>
                Last event
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 12, color: t.ink2, letterSpacing: '0.02em' }}>{last.date}</div>
              <div style={{ fontFamily: t.serif, fontSize: 15.5, color: t.ink, marginTop: 4, lineHeight: 1.4 }}>{last.label}</div>
            </div>
          )}
          {upcoming && (
            <div>
              <div style={{
                fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: t.seal, marginBottom: 6, fontWeight: 500,
              }}>
                Next event
              </div>
              <div style={{ fontFamily: t.mono, fontSize: 12, color: t.seal, letterSpacing: '0.02em' }}>{upcoming.date}</div>
              <div style={{ fontFamily: t.serif, fontSize: 15.5, color: t.ink, marginTop: 4, lineHeight: 1.4 }}>{upcoming.label}</div>
            </div>
          )}
        </div>
      )}

      {open && (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 94, top: 8, bottom: 8, width: 0.5, background: t.teak, opacity: 0.4 }}></div>
          {events.map((e, i) => {
            const up = e.kind === 'upcoming';
            return (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 18px 1fr',
                gap: 0, alignItems: 'flex-start', padding: '14px 0',
                borderBottom: i === events.length - 1 ? 'none' : `0.5px dashed ${t.ruleSoft}`,
              }}>
                <div style={{
                  fontFamily: t.mono, fontSize: 12, color: up ? t.seal : t.ink2,
                  paddingTop: 2, letterSpacing: '0.02em',
                  fontWeight: up ? 500 : 400,
                }}>
                  {e.date}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 9, height: 9,
                    background: up ? t.seal : (e.kind === 'hearing' ? t.ink : t.surface),
                    border: `1px solid ${up ? t.seal : t.ink}`,
                    marginTop: 6, marginLeft: -4,
                  }}></div>
                </div>
                <div style={{ paddingLeft: 8 }}>
                  <div style={{
                    fontFamily: t.serif, fontSize: 15.5, color: t.ink, lineHeight: 1.4,
                    fontWeight: up ? 500 : 400,
                  }}>
                    {e.label}
                  </div>
                  {e.doc && (
                    <a className="vc-link" style={{
                      display: 'inline-block', marginTop: 4,
                      fontSize: 13, color: t.accent, fontFamily: t.sans,
                    }}>{e.doc} ↗</a>
                  )}
                  {up && (
                    <div style={{
                      marginTop: 4, fontSize: 12, color: t.ink3, fontStyle: 'italic',
                    }}>
                      upcoming · synced from cause-list (manual)
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ChamberDocuments({ docs }) {
  const t = chamberTokens;
  return (
    <section>
      <ChamberSectionHead
        title="Documents"
        sub="In this case's Drive folder · edited in Google Docs"
        action="New document" actionSolid />
      <div style={{
        marginTop: 20, background: t.surface,
        border: `0.5px solid ${t.ruleSoft}`, borderRadius: 2,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 180px 80px 90px',
          padding: '11px 20px', borderBottom: `0.5px solid ${t.ruleSoft}`,
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: t.ink3, fontWeight: 500,
        }}>
          <div>Title</div><div>From template</div><div>Pages</div><div style={{ textAlign: 'right' }}>Filed</div>
        </div>
        {docs.map((d, i) => (
          <div key={i} className="vc-row" style={{
            display: 'grid', gridTemplateColumns: '1fr 180px 80px 90px',
            padding: '15px 20px', alignItems: 'center',
            borderBottom: i === docs.length - 1 ? 'none' : `0.5px solid ${t.ruleSoft}`,
            fontSize: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: t.mono, fontSize: 10, padding: '2px 6px',
                background: t.bg, color: t.ink2, borderRadius: 2,
                letterSpacing: '0.06em', border: `0.5px solid ${t.ruleSoft}`,
              }}>DOC</span>
              <span style={{ fontFamily: t.serif, fontSize: 15.5, color: t.ink, fontWeight: 500 }}>{d.title}</span>
            </div>
            <div style={{ fontSize: 12.5, color: t.ink2 }}>{d.template}</div>
            <div style={{ fontFamily: t.mono, fontSize: 12, color: t.ink2 }}>{d.pages} pp</div>
            <div style={{ fontFamily: t.mono, fontSize: 12, color: t.ink2, textAlign: 'right' }}>{d.date}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, fontSize: 12.5, color: t.ink3, fontStyle: 'italic',
      }}>
        Pull from this case's documents when drafting the next one — facts, parties, citations.
      </div>
    </section>
  );
}

function ChamberSectionHead({ title, sub, action, actionSolid }) {
  const t = chamberTokens;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      borderBottom: `0.5px solid ${t.teak}`, paddingBottom: 12,
    }}>
      <div>
        <h2 style={{
          fontFamily: t.serif, fontWeight: 500, fontSize: 20,
          margin: 0, color: t.ink, letterSpacing: '-0.005em', lineHeight: 1.3,
        }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: t.ink2, marginTop: 4 }}>{sub}</div>}
      </div>
      {action && (
        <button className={actionSolid ? 'vc-btn-primary' : 'vc-btn-secondary'}>
          {action}
        </button>
      )}
    </div>
  );
}

Object.assign(window, { ChamberTimeline, ChamberDocuments, ChamberSectionHead });
