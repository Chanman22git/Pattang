import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type NavItem = {
  to: string;
  label: string;
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
  const { user, signOut } = useAuth();
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
                  "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-ink hover:bg-black/5",
                ].join(" ")
              }
            >
              <span>{item.label}</span>
              {item.soon && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted bg-black/5 rounded px-1.5 py-0.5">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-black/10">
          {user && (
            <>
              <div
                className="text-xs text-ink-muted truncate"
                title={user.email ?? ""}
              >
                {user.email}
              </div>
              <button
                onClick={() => signOut()}
                className="mt-2 text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline"
              >
                Sign out
              </button>
            </>
          )}
          <div className="mt-3 text-[11px] text-ink-muted leading-relaxed">
            Phase 1a — complete
            <br />
            v0.0.0
          </div>
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
