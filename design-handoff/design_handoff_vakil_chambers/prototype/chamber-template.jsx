// Chamber — Template Detail page (Vakil Chambers)

function ChamberTemplateDetail() {
  const t = chamberTokens;
  const tpl = MOCK_TEMPLATE;
  return (
    <ChamberShell active="Templates" breadcrumb={`Templates · ${tpl.name}`}>
      <ChamberTemplateHead tpl={tpl} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, marginTop: 40 }}>
        <div>
          <ChamberFieldGroups f={tpl.fields} />
          <ChamberReferences refs={tpl.references} />
          <ChamberLinkedDocs docs={tpl.linkedDocuments} />
        </div>
        <ChamberTemplateRail tpl={tpl} />
      </div>
    </ChamberShell>
  );
}

function ChamberTemplateHead({ tpl }) {
  const t = chamberTokens;
  return (
    <header>
      <div style={{
        fontFamily: t.sans, fontSize: 11, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: t.ink3, marginBottom: 12, fontWeight: 500,
      }}>
        Template · {tpl.docType} · {tpl.version}
      </div>
      <h1 style={{
        fontFamily: t.serif, fontWeight: 500, fontSize: 32, lineHeight: 1.3,
        letterSpacing: '-0.005em', margin: 0, color: t.ink,
      }}>
        {tpl.name}
      </h1>
      <p style={{
        fontFamily: t.sans, fontSize: 15, color: t.ink2, marginTop: 14,
        maxWidth: 640, lineHeight: 1.6,
      }}>
        {tpl.description}
      </p>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 32, marginTop: 28,
        borderTop: `0.5px solid ${t.ruleSoft}`, paddingTop: 22,
      }}>
        <Metric label="Documents generated" value={tpl.metrics.generated} />
        <Metric label="Cases using this" value={tpl.metrics.cases} />
        <Metric label="Last used" value={tpl.metrics.lastUsed} small />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignSelf: 'center' }}>
          <button className="vc-btn-secondary">Clone</button>
          <button className="vc-btn-secondary">Suggest edits</button>
          <button className="vc-btn-primary">Use this template</button>
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value, small }) {
  const t = chamberTokens;
  return (
    <div>
      <div style={{
        fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: t.ink3, fontWeight: 500,
      }}>{label}</div>
      <div style={{
        fontFamily: t.serif, fontSize: small ? 22 : 28, color: t.ink,
        lineHeight: 1.2, marginTop: 6, fontWeight: 500,
      }}>{value}</div>
    </div>
  );
}

function ChamberFieldGroups({ f }) {
  const t = chamberTokens;
  return (
    <section style={{ marginBottom: 56 }}>
      <ChamberSectionHead title="The form this template asks" sub="Three groups, set at creation. Editable per template." />
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20,
      }}>
        <FieldGroupCard kind="basic" label="Basic details" sub="Asked each time" fields={f.basic} />
        <FieldGroupCard kind="prefill" label="Standard details" sub="Prefilled from profile · overridable" fields={f.prefill} />
      </div>
      <div style={{ marginTop: 16 }}>
        <CaseSpecificCard cs={f.caseSpecific} />
      </div>
    </section>
  );
}

function FieldGroupCard({ kind, label, sub, fields }) {
  const t = chamberTokens;
  const dot = kind === 'basic' ? t.accent : t.lawn;
  return (
    <div style={{
      background: t.surface, border: `0.5px solid ${t.ruleSoft}`,
      borderRadius: 2, padding: '18px 20px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 6, height: 6, background: dot }}></span>
        <div style={{
          fontFamily: t.serif, fontSize: 16, fontWeight: 500, color: t.ink,
        }}>{label}</div>
        <div style={{
          fontFamily: t.mono, fontSize: 11, color: t.ink3,
          marginLeft: 'auto', letterSpacing: '0.02em',
        }}>{fields.length} fields</div>
      </div>
      <div style={{ fontSize: 12.5, color: t.ink2, marginBottom: 14, fontStyle: 'italic' }}>{sub}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {fields.map((fld, i) => (
          <li key={i} style={{
            display: 'flex', justifyContent: 'space-between', gap: 12,
            padding: '9px 0',
            borderTop: `0.5px solid ${t.ruleSoft}`,
            fontSize: 13,
          }}>
            <div>
              <div style={{ color: t.ink }}>{fld.label}</div>
              {fld.value && (
                <div style={{
                  fontSize: 12, color: t.ink2, marginTop: 3, fontStyle: 'italic',
                  fontFamily: t.serif,
                }}>{fld.value}</div>
              )}
            </div>
            <div style={{
              fontFamily: t.mono, fontSize: 10.5, color: t.ink3,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              alignSelf: 'flex-start',
            }}>
              {fld.type}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseSpecificCard({ cs }) {
  const t = chamberTokens;
  return (
    <div style={{
      background: t.bgDeep, border: `0.5px solid ${t.ruleSoft}`,
      borderRadius: 2, padding: '18px 20px',
      display: 'flex', gap: 20, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, background: t.seal }}></span>
          <div style={{ fontFamily: t.serif, fontSize: 16, fontWeight: 500, color: t.ink }}>
            Case-specific · {cs.label}
          </div>
        </div>
        <div style={{ fontSize: 13, color: t.ink2, marginTop: 8, lineHeight: 1.6 }}>{cs.hint}</div>
      </div>
      <div style={{
        width: 260, minHeight: 96,
        border: `0.5px dashed ${t.teak}`, borderRadius: 2,
        background: t.surface,
        padding: 12,
        fontFamily: t.serif, fontSize: 13, fontStyle: 'italic', color: t.ink3, lineHeight: 1.55,
      }}>
        Free-text area · accepts long prose · pulled context from prior documents in the case…
      </div>
    </div>
  );
}

Object.assign(window, { ChamberTemplateDetail });
