import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/cases", label: "Cases" },
  { to: "/templates", label: "Templates" },
  { to: "/research", label: "Research" },
  { to: "/calendar", label: "Calendar" },
];

export default function Layout() {
  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 border-r border-black/10 bg-white/60 backdrop-blur px-4 py-6 flex flex-col">
        <div className="mb-8">
          <div className="font-serif text-2xl font-semibold tracking-tight text-accent">
            Pattang
          </div>
          <div className="text-xs text-ink-muted mt-0.5">
            Advocate workspace
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-ink hover:bg-black/5",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-[11px] text-ink-muted leading-relaxed">
          Phase 0 — Foundations
          <br />
          v0.0.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
