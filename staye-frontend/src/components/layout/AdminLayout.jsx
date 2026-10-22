import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Building2, LayoutDashboard, BedDouble, CalendarCheck2, LogOut, Home, Menu, X, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import BrandLogo from "../common/BrandLogo";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/listings", label: "Listings", icon: BedDouble },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck2 },
  { to: "/admin/verify-booking", label: "Verify booking", icon: ShieldCheck },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
];

export default function AdminLayout({ children }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = isSuperAdmin
    ? [...NAV_ITEMS, { to: "/admin/users", label: "Trust & safety", icon: Users }]
    : NAV_ITEMS;
  const workspaceName = isSuperAdmin ? "Stayé Admin" : "Stayé Host";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 flex-col border-r border-navy-800 bg-navy-900 text-white sm:flex">
          <div className="flex items-center justify-between gap-2 px-6 py-5">
          <div className="flex min-w-0 items-center gap-2"><BrandLogo variant="inverse" size="compact" /><span className="shrink-0 text-sm font-semibold text-slate-300">{isSuperAdmin ? "Admin" : "Host"}</span></div>
          <NotificationBell adminMode align="left" inverse />
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to homepage
          </NavLink>
        </nav>
        <div className="border-t border-white/15 px-6 py-4">
          <p className="text-sm font-medium">{user?.name || "Admin"}</p>
          <p className="mb-3 truncate text-xs text-slate-400">{user?.email}</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen bg-[#FAFAFA] sm:ml-64 sm:h-screen sm:min-h-0 sm:overflow-y-auto">
        <header className="relative z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2"><BrandLogo size="compact" /><span className="text-sm font-semibold text-slate-600">{isSuperAdmin ? "Admin" : "Host"}</span></div>
          <div className="flex items-center gap-3"><NotificationBell adminMode /><button onClick={() => setMobileNavOpen((value) => !value)} className="text-navy-900" aria-label="Toggle admin navigation">
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button></div>
          {mobileNavOpen && (
            <nav className="absolute inset-x-0 top-full min-h-[calc(100vh-57px)] border-t border-slate-200 bg-white p-4 shadow-popover">
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-navy-900">{workspaceName}</p>
                <p className="mt-1 text-xs text-ink-500">{isSuperAdmin ? "Manage the platform and review activity." : "Manage your stays and bookings."}</p>
              </div>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "bg-accent text-navy-900" : "text-ink-700 hover:bg-slate-100"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-ink-300/70 pt-4">
                <NavLink to="/" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-white/70">
                  <Home className="h-4 w-4" aria-hidden="true" /> Back to homepage
                </NavLink>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink-700 hover:bg-white/70">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
                </button>
              </div>
            </nav>
          )}
        </header>
        <main className="min-h-[calc(100vh-57px)] px-4 py-6 sm:min-h-0 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
