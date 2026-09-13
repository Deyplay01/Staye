import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, BedDouble, CalendarCheck2, LogOut, Home, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/listings", label: "Listings", icon: BedDouble },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck2 },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-64 flex-col bg-navy-900 text-white sm:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <Building2 className="h-6 w-6" aria-hidden="true" />
          <span className="text-lg font-extrabold">Stayé Admin</span>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to homepage
          </NavLink>
        </nav>
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-sm font-medium">{user?.name || "Admin"}</p>
          <p className="mb-3 truncate text-xs text-white/60">{user?.email}</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="relative z-30 flex items-center justify-between border-b border-ink-300 bg-white px-4 py-3 sm:hidden">
          <span className="font-bold text-navy-900">Stayé / host</span>
          <button onClick={() => setMobileNavOpen((value) => !value)} className="text-navy-900" aria-label="Toggle admin navigation">
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {mobileNavOpen && (
            <nav className="absolute inset-x-0 top-full min-h-[calc(100vh-57px)] border-t border-white/60 bg-white/75 p-4 shadow-popover backdrop-blur-xl">
              <div className="mb-4 rounded-2xl border border-white/80 bg-white/60 p-4">
                <p className="text-sm font-bold text-navy-900">Host workspace</p>
                <p className="mt-1 text-xs text-ink-500">Manage your stays and bookings.</p>
              </div>
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "bg-accent text-navy-900" : "text-ink-700 hover:bg-brand-light"}`}>
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
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
