// Chamber — Template references, linked documents, and right rail (Vakil Chambers)

function ChamberReferences({ refs }) {
  const t = chamberTokens;
  return (
    <section style={{ marginBottom: 56 }}>
      <ChamberSectionHead
        title="What this template refers to"
        sub="Learning inputs refine the structure · standing references inform generation"
        action="Attach reference"
      />
      <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
        {refs.map((r, i) => (
          <li key={i} className="vc-row" style={{
            display: 'flex', gap: 18, alignItems: 'flex-start',
            padding: '16px 16px',
            borderBottom: i === refs.length - 1 ? 'none' : `0.5px dashed ${t.ruleSoft}`,
          }}>
            <span className={`vc-tag ${r.kind === 'learning_input' ? 'vc-tag-brass' : 'vc-tag-lawn'}`} style={{ marginTop: 2 }}>
              {r.kind === 'learning_input' ? 'Learning input' : 'Standing ref.'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: t.serif, fontSize: 16, color: t.ink, fontWeight: 500, lineHeight: 1.4,
              }}>{r.title}</div>
              <div style={{
                fontSize: 13, color: t.ink2, marginTop: 4, fontStyle: 'italic',
                lineHeight: 1.55,
              }}>{r.note}</div>
            </div>
            <div style={{ fontSize: 13, color: t.ink3 }}>↗</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChamberLinkedDocs({ docs }) {
  const t = chamberTokens;
  return (
    <section>
      <ChamberSectionHead
        title="Documents from this template"
        sub={`${docs.length} documents across ${new Set(docs.map(d => d.case)).size} cases — navigable index`}
      />
      <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
        {docs.map((d, i) => (
          <li key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
            padding: '13px 0',
            borderBottom: `0.5px solid ${t.ruleSoft}`,
            alignItems: 'baseline',
          }}>
            <div>
              <a className="vc-link" style={{
                fontFamily: t.serif, fontSize: 15, color: t.ink, fontWeight: 500,
              }}>{d.title}</a>
              <span style={{
                marginLeft: 10, fontSize: 13, color: t.ink2, fontStyle: 'italic',
              }}>
                — in {d.case}
              </span>
            </div>
            <div style={{
              fontFamily: t.mono, fontSize: 11.5, color: t.ink3, letterSpacing: '0.02em',
            }}>{d.date}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChamberTemplateRail({ tpl }) {
  const t = chamberTokens;
  return (
    <aside style={{
      position: 'sticky', top: 40, alignSelf: 'flex-start',
      borderLeft: `0.5px solid ${t.ruleSoft}`, paddingLeft: 24,
    }}>
      <DossierBlock label="Anatomy of a document">
        <div style={{
          background: t.surface, border: `0.5px solid ${t.ruleSoft}`,
          borderRadius: 2, padding: 14,
          fontFamily: t.serif, fontSize: 11.5, color: t.ink, lineHeight: 1.6,
        }}>
          <div style={{
            textAlign: 'center', fontFamily: t.sans, fontSize: 9,
            letterSpacing: '0.16em', color: t.ink3, fontWeight: 500,
            textTransform: 'uppercase', marginBottom: 8,
          }}>
            In the High Court of Karnataka
          </div>
          <div style={{
            textAlign: 'center', fontFamily: t.mono, fontSize: 9.5,
            color: t.ink3, marginBottom: 10, letterSpacing: '0.02em',
          }}>
            W.P. No. ____ / 20__
          </div>
          <div style={{ height: 0.5, background: t.teak, opacity: 0.5, margin: '10px 0' }}></div>
          <div style={{
            background: 'rgba(184,134,47,0.18)', padding: '4px 6px',
            marginBottom: 4, fontSize: 10.5, color: t.ink,
          }}>· Petitioner name</div>
          <div style={{
            background: 'rgba(184,134,47,0.18)', padding: '4px 6px',
            marginBottom: 4, fontSize: 10.5, color: t.ink,
          }}>· Petitioner address</div>
          <div style={{
            textAlign: 'center', fontStyle: 'italic', fontSize: 11.5,
            color: t.ink2, margin: '8px 0',
          }}>versus</div>
          <div style={{
            background: 'rgba(184,134,47,0.18)', padding: '4px 6px',
            marginBottom: 4, fontSize: 10.5, color: t.ink,
          }}>· Respondent(s)</div>
          <div style={{ height: 0.5, background: t.teak, opacity: 0.5, margin: '10px 0' }}></div>
          <div style={{
            fontFamily: t.sans, fontSize: 9, fontWeight: 500,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: t.ink3, marginBottom: 6,
          }}>
            Grounds &amp; prayer
          </div>
          <div style={{
            background: t.bg, padding: 10, fontSize: 10.5,
            color: t.ink2, fontStyle: 'italic',
            border: `0.5px dashed ${t.teak}`, borderRadius: 2,
            lineHeight: 1.5,
          }}>
            Case-specific free text — pulled-context capable
          </div>
          <div style={{
            marginTop: 12, fontFamily: t.sans, fontSize: 9.5,
            color: t.ink3, textAlign: 'right', fontStyle: 'italic',
          }}>
            — prefilled: counsel signature —
          </div>
        </div>
        <div style={{
          fontSize: 11.5, color: t.ink3, marginTop: 10, lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          Shaded blocks come from the form. The dashed area is yours to draft, case by case.
        </div>
      </DossierBlock>

      <DossierBlock label="Template history">
        {tpl.history.map((h, i) => (
          <div key={i} style={{ padding: '7px 0', fontSize: 12.5 }}>
            <div style={{
              fontFamily: t.mono, fontSize: 11, color: t.ink3, letterSpacing: '0.02em',
            }}>{h.date}</div>
            <div style={{
              fontFamily: t.serif, fontSize: 13.5, color: t.ink, lineHeight: 1.45, marginTop: 2,
            }}>{h.label}</div>
          </div>
        ))}
      </DossierBlock>

      <DossierBlock label="Editable operations">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
          {['Add additional details', 'Refer to a new document', 'Suggest edits with AI', 'Clone as variant'].map((op, i) => (
            <li key={i} className="vc-row" style={{
              padding: '8px 6px', color: t.ink,
              borderBottom: i === 3 ? 'none' : `0.5px dashed ${t.ruleSoft}`,
              fontFamily: t.serif, fontSize: 13.5,
            }}>
              <span style={{
                color: t.ink3, marginRight: 8, fontFamily: t.mono, fontSize: 10,
              }}>→</span>{op}
            </li>
          ))}
        </ul>
      </DossierBlock>
    </aside>
  );
}

Object.assign(window, { ChamberReferences, ChamberLinkedDocs, ChamberTemplateRail });
