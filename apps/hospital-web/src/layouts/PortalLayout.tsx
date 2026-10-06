import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useHospitalSocket } from "../hooks/useHospitalSocket";
import { cn } from "../lib/cn";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/doctors", label: "Doctors" },
  { to: "/departments", label: "Departments" },
  { to: "/queue", label: "Queue" },
  { to: "/ambulances", label: "Ambulances" },
  { to: "/beds", label: "Beds" },
  { to: "/facilities", label: "Facilities" },
  { to: "/emergency", label: "Emergency" },
];

export function PortalLayout() {
  const { user, logout } = useAuth();
  useHospitalSocket();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-rule">
        <div className="border-b border-rule px-5 py-5">
          <span className="font-serif text-lg text-ink">MediReach</span>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-muted">Hospital Portal</p>
        </div>
        <nav className="flex-1 px-2 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "block rounded px-3 py-2 font-mono text-sm text-ink-muted hover:bg-paper-raised hover:text-ink",
                  isActive && item.to !== "/emergency" && "bg-paper-raised text-ink",
                  isActive && item.to === "/emergency" && "bg-status-unavailable/10 text-status-unavailable",
                  !isActive && item.to === "/emergency" && "text-status-unavailable",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-rule px-5 py-4">
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
