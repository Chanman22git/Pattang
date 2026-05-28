// Chamber — Dossier sidebar (Vakil Chambers)

function ChamberDossier({ c }) {
  const t = chamberTokens;
  return (
    <aside style={{
      position: 'sticky', top: 40, alignSelf: 'flex-start',
      borderLeft: `0.5px solid ${t.ruleSoft}`, paddingLeft: 24,
    }}>
      <div style={{
        fontFamily: t.sans, fontSize: 10.5, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: t.ink3, marginBottom: 20, fontWeight: 500,
      }}>
        Dossier
      </div>

      <DossierBlock label="Parties">
        {c.parties.map((p, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: t.sans, fontSize: 10, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: t.ink3, fontWeight: 500,
            }}>
              {p.role}
            </div>
            <div style={{
              fontFamily: t.serif, fontSize: 17, lineHeight: 1.3,
              color: t.ink, marginTop: 2, fontWeight: 500,
            }}>
              {p.name}
            </div>
            <div style={{ fontSize: 12, color: t.ink2, marginTop: 2, fontStyle: 'italic' }}>{p.note}</div>
          </div>
        ))}
      </DossierBlock>

      <DossierBlock label="Reliefs sought">
        <div style={{ fontFamily: t.serif, fontSize: 14, color: t.ink, lineHeight: 1.6 }}>
          {c.reliefs}
        </div>
      </DossierBlock>

      <DossierBlock label="Key facts" caption={`${c.facts.filter(f => f.confirmed).length}/${c.facts.length} confirmed`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.facts.map((f, i) => (
            <div key={i} style={{
              fontSize: 13, color: t.ink, lineHeight: 1.55,
              paddingLeft: 12, position: 'relative',
              borderLeft: f.confirmed ? `2px solid ${t.lawn}` : `2px dashed ${t.seal}`,
            }}>
              <div style={{ fontFamily: t.serif, fontSize: 13.5 }}>{f.text}</div>
              <div style={{
                fontSize: 11, color: f.confirmed ? t.ink3 : t.seal,
                marginTop: 4, fontFamily: t.mono, letterSpacing: '0.02em',
              }}>
                {f.source}{f.confirmed ? '' : ' · confirm'}
              </div>
            </div>
          ))}
        </div>
      </DossierBlock>

      <DossierBlock label="At a glance">
        <KV k="Court" v="Karnataka HC, Bengaluru" />
        <KV k="Bench" v="Single, Hon'ble S.K., J." />
        <KV k="Filed" v={c.filed} />
        <KV k="Case no." v={c.caseNo} mono />
        <KV k="CNR" v={c.cnr} mono />
        <KV k="Stage" v="Reserved for orders" />
        <KV k="Adv. for petitioner" v="Counsel C (self)" />
      </DossierBlock>
    </aside>
  );
}

function DossierBlock({ label, caption, children }) {
  const t = chamberTokens;
  return (
    <div style={{
      marginBottom: 28, paddingBottom: 24,
      borderBottom: `0.5px dashed ${t.ruleSoft}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: t.sans, fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: t.ink, fontWeight: 600,
        }}>
          {label}
        </div>
        {caption && (
          <div style={{
            fontSize: 10.5, color: t.ink3, fontFamily: t.mono,
            letterSpacing: '0.02em',
          }}>{caption}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v, mono }) {
  const t = chamberTokens;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '5px 0', fontSize: 12.5,
    }}>
      <span style={{ color: t.ink3 }}>{k}</span>
      <span style={{
        color: t.ink, fontFamily: mono ? t.mono : t.sans,
        textAlign: 'right', fontSize: mono ? 11.5 : 12.5,
      }}>{v}</span>
    </div>
  );
}

Object.assign(window, { ChamberDossier });
