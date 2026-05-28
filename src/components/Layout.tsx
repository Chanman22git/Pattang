import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Vakil Chambers shell — top bar + collapsible sidebar.
 * Mirrors the prototype's ChamberShell / ChamberTopbar / ChamberSidebar.
 */

const NAV_STORAGE_KEY = "pattang.nav.open";

type NavItem = {
  to: string;
  label: string;
  /** Right-aligned count chip when expanded. */
  count?: number;
  /** Renders a "Soon" overline; greys the text. */
  soon?: boolean;
};

const navItems: NavItem[] = [
  { to: "/cases", label: "Cases" },
  { to: "/templates", label: "Templates" },
  { to: "/translate", label: "Translate", soon: true },
  { to: "/research", label: "Research", soon: true },
  { to: "/calendar", label: "Calendar", soon: true },
];

export default function Layout() {
  const [navOpen, setNavOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(NAV_STORAGE_KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(NAV_STORAGE_KEY, navOpen ? "1" : "0");
  }, [navOpen]);

  const railW = navOpen ? 220 : 56;

  return (
    <div className="min-h-full w-full bg-paper text-ink-2 font-sans">
      <Topbar navOpen={navOpen} onToggleNav={() => setNavOpen((o) => !o)} />
      <Sidebar open={navOpen} />
      <div
        style={{
          marginLeft: railW,
          transition: "margin-left 180ms ease",
        }}
      >
        <div className="px-14 pt-10 pb-24 max-w-[1240px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Top bar
// ────────────────────────────────────────────────────────────────────────────
function Topbar({
  navOpen,
  onToggleNav,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
}) {
  return (
    <div
      className="grid items-center bg-paper relative z-10 sticky top-0"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
        height: 64,
        padding: "0 28px 0 16px",
        borderBottom: "0.5px solid rgba(90,58,31,0.18)",
      }}
    >
      {/* Left — hamburger + wordmark */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleNav}
          aria-label={navOpen ? "Collapse navigation" : "Expand navigation"}
          title={navOpen ? "Collapse navigation" : "Expand navigation"}
          className="vc-iconbtn flex flex-col justify-center"
          style={{ width: 36, height: 36, gap: 4 }}
        >
          <span
            className="block bg-ink"
            style={{
              height: 1.5,
              width: navOpen ? 16 : 12,
              transition: "width 160ms",
            }}
          />
          <span
            className="block bg-ink"
            style={{
              height: 1.5,
              width: navOpen ? 12 : 16,
              transition: "width 160ms",
            }}
          />
          <span
            className="block bg-ink"
            style={{
              height: 1.5,
              width: navOpen ? 16 : 12,
              transition: "width 160ms",
            }}
          />
        </button>
        <div className="flex items-baseline gap-3">
          <div
            className="font-serif font-medium text-ink leading-none"
            style={{ fontSize: 26, letterSpacing: "-0.005em" }}
          >
            Pattang
            <span className="text-brass font-serif ml-0.5">।</span>
          </div>
          <div
            className="text-ink-3 uppercase font-medium"
            style={{ fontSize: 10.5, letterSpacing: "0.12em" }}
          >
            Advocate&rsquo;s briefcase
          </div>
        </div>
      </div>

      {/* Middle — breadcrumb */}
      <div
        className="font-mono text-ink-3 whitespace-nowrap justify-self-center"
        style={{ fontSize: 12, letterSpacing: "0.02em" }}
      >
        <Breadcrumb />
      </div>

      {/* Right — search + ⌘K */}
      <div className="flex items-center gap-2.5 justify-self-end">
        <input
          placeholder="Find a case, template or citation"
          className="vc-input"
          style={{ width: 280 }}
        />
        <div
          className="bg-foolscap font-mono text-ink-3"
          style={{
            fontSize: 11,
            padding: "4px 6px",
            border: "0.5px solid rgba(90,58,31,0.18)",
            borderRadius: 2,
          }}
        >
          ⌘K
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar
// ────────────────────────────────────────────────────────────────────────────
function Sidebar({ open }: { open: boolean }) {
  const { user } = useAuth();
  const width = open ? 220 : 56;
  const location = useLocation();

  // Active nav: match by path prefix so /cases/:id keeps Cases highlighted.
  const isActive = (to: string) => {
    if (to === "/cases") return location.pathname.startsWith("/cases");
    if (to === "/templates") return location.pathname.startsWith("/templates");
    return location.pathname === to;
  };

  return (
    <aside
      className="absolute left-0 bg-paper flex flex-col overflow-hidden"
      style={{
        top: 64,
        bottom: 0,
        width,
        padding: open ? "20px 12px" : "20px 10px",
        borderRight: "0.5px solid rgba(90,58,31,0.18)",
        transition: "width 180ms ease, padding 180ms ease",
      }}
    >
      <nav className="flex flex-col" style={{ gap: 2 }}>
        {navItems.map((it) => {
          const active = isActive(it.to);
          if (!open) {
            return (
              <NavLink
                key={it.to}
                to={it.to}
                title={it.label}
                className="vc-iconbtn flex items-center justify-center font-serif"
                style={{
                  width: 36,
                  height: 36,
                  margin: "2px auto",
                  fontSize: 17,
                  color: active ? "#1A1F2E" : it.soon ? "#A8956F" : "#6B6358",
                  background: active ? "#FAF8F3" : "transparent",
                  borderLeft: active
                    ? "2px solid #B8862F"
                    : "2px solid transparent",
                }}
              >
                {it.label[0]}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={() =>
                ["vc-nav-link", active ? "is-active" : "", it.soon ? "is-soon" : ""].join(" ")
              }
            >
              <span style={{ letterSpacing: "-0.005em" }}>{it.label}</span>
              {it.count != null && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11.5,
                    color: active ? "#B8862F" : "#A8956F",
                  }}
                >
                  {it.count}
                </span>
              )}
              {it.soon && (
                <span
                  className="text-ink-3 uppercase"
                  style={{ fontSize: 9.5, letterSpacing: "0.08em" }}
                >
                  Soon
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      {open && (
        <div
          className="mt-auto pt-5"
          style={{
            paddingLeft: 14,
            borderTop: "0.5px solid rgba(90,58,31,0.18)",
          }}
        >
          {user?.email ? (
            <>
              <div
                className="text-ink font-medium truncate"
                style={{ fontSize: 13 }}
                title={user.email}
              >
                {user.email}
              </div>
              <div
                className="text-ink-3 font-mono mt-0.5"
                style={{ fontSize: 11, letterSpacing: "0.04em" }}
              >
                Pattang pilot
              </div>
            </>
          ) : (
            <>
              <div
                className="text-ink font-medium"
                style={{ fontSize: 13 }}
              >
                Pilot session
              </div>
              <div
                className="text-ink-3 font-mono mt-0.5"
                style={{ fontSize: 11, letterSpacing: "0.04em" }}
              >
                Anonymous
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Breadcrumb — derived from route. Light heuristic for now.
// ────────────────────────────────────────────────────────────────────────────
function Breadcrumb() {
  const location = useLocation();
  const params = useParams();
  const parts = location.pathname.split("/").filter(Boolean);

  if (parts.length === 0) return <span>Pattang</span>;
  const root = parts[0];
  const heading: Record<string, string> = {
    cases: "Cases",
    templates: "Templates",
    translate: "Translate",
    research: "Research",
    calendar: "Calendar",
    signin: "Sign in",
  };
  const head = heading[root] ?? "Pattang";

  // /cases/:id, /templates/:id — second segment shows the id (truncated)
  // because we don't have the title here. The page itself owns the title.
  let tail: string | null = null;
  if (parts.length > 1) {
    if (parts[1] === "new") tail = "New";
    else if (params && params.id) tail = shorten(params.id);
    else tail = shorten(parts[1]);
  }

  return (
    <span>
      {head}
      {tail && (
        <>
          <span className="mx-2 text-ink-3">·</span>
          <span>{tail}</span>
        </>
      )}
    </span>
  );
}

function shorten(s: string): string {
  if (s.length <= 14) return s;
  return s.slice(0, 6) + "…" + s.slice(-4);
}
