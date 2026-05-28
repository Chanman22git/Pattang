// Direction A — "Vakil Chambers"
// Indian advocate's workspace. Cream paper, bar-coat black, brass and seal.
// See DESIGN_SYSTEM.md for the spec.

const chamberTokens = {
  // backgrounds
  bg: '#FFFFFF',         // page
  bgDeep: '#FAF8F3',     // very subtle warm tint for striping
  surface: '#FAF8F3',    // cards, elevated panels
  // primary
  ink: '#1A1F2E',        // Bar coat black
  ink2: '#6B6358',       // Ink wash (body)
  ink3: '#A8956F',       // Court fee stamp (meta)
  // borders
  rule: 'rgba(90,58,31,0.55)',     // Teak bench, defined
  ruleSoft: 'rgba(90,58,31,0.18)', // Teak bench @ 30%-ish, soft
  teak: '#5A3A1F',
  // accent + semantic
  accent: '#B8862F',         // Ashoka brass
  accentSoft: '#EDDFBE',     // Brass at low value (tint)
  seal: '#4A1818',           // Sindoor seal (urgent)
  sealSoft: '#EAD9D9',
  lawn: '#2D4A3E',           // Court lawn (success)
  lawnSoft: '#D8E2DD',
  twine: '#8B6F47',          // Twine binding (tag)
  twineSoft: 'rgba(139,111,71,0.18)',
  warn: '#7A5520',           // kept for legacy refs
  ok: '#2D4A3E',             // alias for legacy
  okSoft: '#D8E2DD',
  // fonts
  serif: "'Spectral', 'Source Serif 4', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// ── Global interaction CSS (the Hover Principle) ─────────
// Injected once. Inline styles can't express hover transitions cleanly,
// so we use a small set of utility classes for the interactive primitives.
const VC_CSS = `
  .vc-link { color: ${chamberTokens.ink2}; text-decoration: none; position: relative; transition: color 100ms ease-out; }
  .vc-link::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -2px;
    height: 1px; background: ${chamberTokens.accent};
    transform: scaleX(0); transform-origin: left; transition: transform 100ms ease-out;
  }
  .vc-link:hover { color: ${chamberTokens.ink}; }
  .vc-link:hover::after { transform: scaleX(1); }

  .vc-btn-primary {
    background: ${chamberTokens.ink}; color: ${chamberTokens.surface};
    border: 1px solid ${chamberTokens.ink}; border-radius: 2px;
    padding: 8px 16px; font-size: 13px; font-weight: 500;
    font-family: ${chamberTokens.sans}; cursor: pointer;
    transition: background 180ms ease-out, border-color 180ms ease-out;
    letter-spacing: 0.005em;
  }
  .vc-btn-primary:hover { background: ${chamberTokens.seal}; border-color: ${chamberTokens.seal}; }
  .vc-btn-primary:active { background: ${chamberTokens.ink}; box-shadow: inset 0 0 0 2px ${chamberTokens.accent}; }

  .vc-btn-secondary {
    background: transparent; color: ${chamberTokens.ink2};
    border: 1px solid ${chamberTokens.teak}; border-radius: 2px;
    padding: 8px 16px; font-size: 13px; font-weight: 400;
    font-family: ${chamberTokens.sans}; cursor: pointer;
    transition: background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out;
  }
  .vc-btn-secondary:hover { background: ${chamberTokens.surface}; color: ${chamberTokens.ink}; border-color: ${chamberTokens.ink}; }

  .vc-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${chamberTokens.twineSoft}; color: ${chamberTokens.twine};
    padding: 3px 8px; border-radius: 2px;
    font-family: ${chamberTokens.sans}; font-size: 11px;
    font-weight: 500; letter-spacing: 0.04em;
    transition: background 150ms ease-out, color 150ms ease-out;
  }
  .vc-tag:hover { background: ${chamberTokens.twine}; color: ${chamberTokens.surface}; }

  .vc-tag-brass { background: ${chamberTokens.accentSoft}; color: ${chamberTokens.accent}; }
  .vc-tag-brass:hover { background: ${chamberTokens.accent}; color: ${chamberTokens.surface}; }
  .vc-tag-seal { background: ${chamberTokens.sealSoft}; color: ${chamberTokens.seal}; }
  .vc-tag-seal:hover { background: ${chamberTokens.seal}; color: ${chamberTokens.surface}; }
  .vc-tag-lawn { background: ${chamberTokens.lawnSoft}; color: ${chamberTokens.lawn}; }

  .vc-card {
    background: ${chamberTokens.surface};
    border: 0.5px solid ${chamberTokens.ruleSoft};
    border-radius: 2px;
    position: relative; overflow: hidden;
    transition: border-color 120ms ease-out;
  }
  .vc-card::before {
    content: ''; position: absolute; inset: 0 auto 0 0; width: 2px;
    background: ${chamberTokens.accent};
    transform: scaleX(0); transform-origin: left;
    transition: transform 200ms ease-out;
  }
  .vc-card:hover { border-color: ${chamberTokens.teak}; }
  .vc-card:hover::before { transform: scaleX(1); }

  .vc-row { transition: background 100ms ease-out; cursor: pointer; }
  .vc-row:hover { background: rgba(168,149,111,0.15); }

  .vc-nav-link {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 12px 9px 14px; border-radius: 2px;
    font-size: 14px; font-weight: 400;
    color: ${chamberTokens.ink2};
    border-left: 2px solid transparent;
    transition: color 100ms ease-out, background 100ms ease-out, border-color 100ms ease-out;
    cursor: pointer; user-select: none;
  }
  .vc-nav-link:hover { color: ${chamberTokens.ink}; }
  .vc-nav-link.is-active {
    color: ${chamberTokens.ink}; font-weight: 500;
    background: ${chamberTokens.surface};
    border-left-color: ${chamberTokens.accent};
  }
  .vc-nav-link.is-soon { color: ${chamberTokens.ink3}; }

  .vc-input {
    font-family: ${chamberTokens.sans}; font-size: 13px;
    color: ${chamberTokens.ink2};
    background: ${chamberTokens.surface};
    border: 1px solid ${chamberTokens.ruleSoft};
    border-radius: 2px; padding: 8px 12px; outline: none;
    transition: border-color 150ms ease-out, background 150ms ease-out;
  }
  .vc-input:hover { border-color: ${chamberTokens.teak}; }
  .vc-input:focus { border-color: ${chamberTokens.ink}; background: #fff; color: ${chamberTokens.ink}; }
  .vc-input::placeholder { color: ${chamberTokens.ink3}; }

  .vc-iconbtn {
    background: transparent; border: 1px solid transparent; border-radius: 2px;
    padding: 8px; cursor: pointer;
    transition: background 120ms ease-out, border-color 120ms ease-out;
  }
  .vc-iconbtn:hover { background: ${chamberTokens.surface}; border-color: ${chamberTokens.ruleSoft}; }

  /* Selection in the brass key */
  ::selection { background: ${chamberTokens.accentSoft}; color: ${chamberTokens.ink}; }
`;

// Inject CSS once
if (typeof window !== 'undefined' && !window.__vc_css_injected) {
  const style = document.createElement('style');
  style.textContent = VC_CSS;
  document.head.appendChild(style);
  window.__vc_css_injected = true;
}

// ── Shell ────────────────────────────────────────────────
function ChamberShell({ children, breadcrumb, active }) {
  const t = chamberTokens;
  const [navOpen, setNavOpen] = React.useState(true);
  const railW = navOpen ? 220 : 56;
  return (
    <div style={{
      width: '100%', minHeight: '100%', position: 'relative',
      background: t.bg, color: t.ink2, fontFamily: t.sans,
      fontSize: 15, lineHeight: 1.6,
    }}>
      <ChamberTopbar
        breadcrumb={breadcrumb}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((o) => !o)}
      />
      <ChamberSidebar active={active} open={navOpen} />
      <div style={{ marginLeft: railW, transition: 'margin-left 180ms ease' }}>
        <div style={{ padding: '40px 56px 96px', maxWidth: 1240 }}>{children}</div>
      </div>
    </div>
  );
}

function ChamberSidebar({ active = 'Cases', open }) {
  const t = chamberTokens;
  const items = [
    { label: 'Cases', count: 17 },
    { label: 'Templates', count: 8 },
    { label: 'Translate', soon: true },
    { label: 'Research', soon: true },
    { label: 'Calendar', soon: true },
  ];
  const width = open ? 220 : 56;
  return (
    <aside style={{
      position: 'absolute', top: 64, left: 0, bottom: 0, width,
      borderRight: `0.5px solid ${t.ruleSoft}`, background: t.bg,
      padding: open ? '20px 12px' : '20px 10px',
      display: 'flex', flexDirection: 'column',
      transition: 'width 180ms ease, padding 180ms ease',
      overflow: 'hidden',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it) => {
          const isActive = it.label === active;
          if (!open) {
            return (
              <div key={it.label} title={it.label} className="vc-iconbtn" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, margin: '2px auto',
                fontFamily: t.serif, fontSize: 17,
                color: isActive ? t.ink : (it.soon ? t.ink3 : t.ink2),
                background: isActive ? t.surface : 'transparent',
                borderLeft: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
              }}>
                {it.label[0]}
              </div>
            );
          }
          const cls = `vc-nav-link${isActive ? ' is-active' : ''}${it.soon ? ' is-soon' : ''}`;
          return (
            <div key={it.label} className={cls}>
              <span style={{ letterSpacing: '-0.005em' }}>{it.label}</span>
              {it.count != null && <span style={{ fontFamily: t.mono, fontSize: 11.5, color: isActive ? t.accent : t.ink3 }}>{it.count}</span>}
              {it.soon && <span style={{ fontSize: 9.5, letterSpacing: '0.08em', color: t.ink3, textTransform: 'uppercase' }}>Soon</span>}
            </div>
          );
        })}
      </nav>
      {open && (
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: `0.5px solid ${t.ruleSoft}`, paddingLeft: 14 }}>
          <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>Counsel C</div>
          <div style={{ fontSize: 11, color: t.ink3, fontFamily: t.mono, marginTop: 2, letterSpacing: '0.04em' }}>KAR/1234/2009</div>
        </div>
      )}
    </aside>
  );
}

function ChamberTopbar({ breadcrumb, navOpen, onToggleNav }) {
  const t = chamberTokens;
  return (
    <div style={{
      borderBottom: `0.5px solid ${t.ruleSoft}`, height: 64,
      padding: '0 28px 0 16px',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
      background: t.bg, position: 'relative', zIndex: 2,
    }}>
      {/* Left — toggle + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onToggleNav}
          aria-label={navOpen ? 'Collapse navigation' : 'Expand navigation'}
          title={navOpen ? 'Collapse navigation' : 'Expand navigation'}
          className="vc-iconbtn"
          style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            gap: 4, width: 36, height: 36,
          }}>
          <span style={{ display: 'block', height: 1.5, background: t.ink, width: navOpen ? 16 : 12, transition: 'width 160ms' }} />
          <span style={{ display: 'block', height: 1.5, background: t.ink, width: navOpen ? 12 : 16, transition: 'width 160ms' }} />
          <span style={{ display: 'block', height: 1.5, background: t.ink, width: navOpen ? 16 : 12, transition: 'width 160ms' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{
            fontFamily: t.serif, fontSize: 26, fontWeight: 500,
            lineHeight: 1, letterSpacing: '-0.005em', color: t.ink,
          }}>
            Pattang
            <span style={{ color: t.accent, fontFamily: t.serif, marginLeft: 2 }}>।</span>
          </div>
          <div style={{
            fontSize: 10.5, color: t.ink3, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>
            Advocate's briefcase
          </div>
        </div>
      </div>

      {/* Middle — breadcrumb */}
      <div style={{
        fontFamily: t.mono, fontSize: 12, color: t.ink3, letterSpacing: '0.02em',
        textAlign: 'center', justifySelf: 'center', whiteSpace: 'nowrap',
      }}>
        {breadcrumb}
      </div>

      {/* Right — search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifySelf: 'end' }}>
        <input
          placeholder="Find a case, template or citation"
          className="vc-input"
          style={{ width: 280 }}
        />
        <div style={{
          fontSize: 11, color: t.ink3, fontFamily: t.mono,
          padding: '4px 6px', border: `0.5px solid ${t.ruleSoft}`, borderRadius: 2,
          background: t.surface,
        }}>⌘K</div>
      </div>
    </div>
  );
}

Object.assign(window, { chamberTokens, ChamberShell });
