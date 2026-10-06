import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/cn";

const NAV_ITEMS = [
  { to: "/", label: "Hospitals", end: true },
  { to: "/users", label: "Users" },
  { to: "/audit-log", label: "Audit Log" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border-strong bg-surface">
        <div className="border-b border-border-strong px-5 py-5">
          <span className="font-mono text-lg font-semibold text-ink">MediReach</span>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-muted">Super Admin</p>
        </div>
        <nav className="flex-1 px-2 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "block rounded px-3 py-2 font-mono text-sm text-ink-muted hover:bg-bg hover:text-ink",
                  isActive && "bg-accent/10 text-accent",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border-strong px-5 py-4">
          <p className="truncate text-sm text-ink">{user?.name}</p>
          <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted hover:text-ink"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
