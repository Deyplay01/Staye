import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, UserCog, LogOut, CalendarCheck2, Home, LayoutDashboard, UserRound, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../api/auth";
import { getImageUrl } from "../../api";
import NotificationBell from "../common/NotificationBell";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const desktopMenuRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const initials = (user?.name || "Guest")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatar("");
      return;
    }
    setAvatar(user?.avatar || "");
    fetchProfile().then((profile) => setAvatar(profile.avatar || user?.avatar || "")).catch(() => setAvatar(user?.avatar || ""));
  }, [isAuthenticated, user?.avatar]);

  useEffect(() => {
    function closeDesktopMenu(event) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setDesktopMenu(null);
      }
    }

    document.addEventListener("mousedown", closeDesktopMenu);
    return () => document.removeEventListener("mousedown", closeDesktopMenu);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-300/80 bg-white/90 lg:backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center text-lg gap-2 font-bold tracking-tight text-navy-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9F2C7] text-sm font-bold text-[#243119]">S</span>
          <span className="text-2xl font-bold tracking-tight">Stayé</span>
        </Link>

        <nav ref={desktopMenuRef} className="hidden items-center gap-6 sm:flex">
          <Link to="/listings" className="text-sm font-medium text-ink-700 hover:text-brand">
            Browse listings
          </Link>

          {isAuthenticated ? (
            <div className="relative flex items-center gap-3">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setDesktopMenu(desktopMenu === "account" ? null : "account")}
                aria-expanded={desktopMenu === "account"}
                className="flex items-center gap-2 rounded-full border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand hover:text-brand"
              >
                {avatar ? <img src={getImageUrl(avatar)} alt="" onError={() => setAvatar("")} className="h-7 w-7 rounded-full object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9F2C7] text-xs font-bold text-[#243119]">{initials}</span>}
                <span>Hi, {user?.name?.split(" ")[0]}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${desktopMenu === "account" ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {desktopMenu === "account" && (
                <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl border border-ink-300 bg-white p-2 shadow-popover">
                  {!user?.isAdmin && <Link to="/dashboard" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard</Link>}
                  <Link to="/my-bookings" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><CalendarCheck2 className="h-4 w-4" aria-hidden="true" /> My bookings</Link>
                  <Link to="/profile" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><UserRound className="h-4 w-4" aria-hidden="true" /> Profile</Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-700 hover:bg-brand-light"><LogOut className="h-4 w-4" aria-hidden="true" /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-brand">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Sign up
              </Link>
            </>
          )}

          {user?.isAdmin ? (
            <div className="relative border-l border-ink-300 pl-5">
              <button type="button" onClick={() => setDesktopMenu(desktopMenu === "admin" ? null : "admin")} aria-expanded={desktopMenu === "admin"} className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand">
                <Building2 className="h-4 w-4" aria-hidden="true" /> Admin workspace <ChevronDown className={`h-4 w-4 transition-transform ${desktopMenu === "admin" ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {desktopMenu === "admin" && (
                <div className="absolute right-0 top-full mt-3 w-52 rounded-2xl border border-ink-300 bg-white p-2 shadow-popover">
                  <Link to="/admin/dashboard" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard</Link>
                  <Link to="/admin/listings" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><Building2 className="h-4 w-4" aria-hidden="true" /> Listings</Link>
                  <Link to="/admin/bookings" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-light"><CalendarCheck2 className="h-4 w-4" aria-hidden="true" /> Bookings</Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="flex items-center gap-1.5 border-l border-ink-300 pl-6 text-sm font-medium text-ink-500 hover:text-brand"
            >
              <UserCog className="h-4 w-4" aria-hidden="true" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 sm:hidden">
          {isAuthenticated && <NotificationBell />}
          <button
            className="text-navy-900"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full min-h-[calc(100vh-73px)] space-y-1 border-t border-white/60 bg-white/75 px-5 pb-6 pt-5 shadow-popover backdrop-blur-xl sm:hidden">
          <div className="mb-5 rounded-2xl border border-white/80 bg-white/60 p-4 text-sm text-navy-900">
            <p className="font-semibold">Find your next stay</p>
            <p className="mt-1 text-xs text-ink-500">Thoughtful spaces, ready when you are.</p>
          </div>
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl bg-accent/70 px-4 py-3 text-sm font-semibold text-navy-900">
            <Home className="h-4 w-4" aria-hidden="true" /> Home
          </Link>
          <Link to="/listings" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70">
            Browse listings
          </Link>
          {isAuthenticated ? (
            <>
              {!user?.isAdmin && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/my-bookings"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70"
              >
                My bookings
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70">
                {avatar ? <img src={getImageUrl(avatar)} alt="" onError={() => setAvatar("")} className="h-7 w-7 rounded-full object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9F2C7] text-xs font-bold text-[#243119]">{initials}</span>}
                Hi, {user?.name?.split(" ")[0]}
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="block rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-700 hover:bg-white/70"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70">
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-white/70"
              >
                Sign up
              </Link>
            </>
          )}
          <Link
            to={user?.isAdmin ? "/admin/dashboard" : "/admin/login"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-500 hover:bg-white/70"
          >
            {user?.isAdmin ? <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> : <UserCog className="h-4 w-4" aria-hidden="true" />}
            {user?.isAdmin ? "Dashboard" : "Admin login"}
          </Link>
        </div>
      )}
    </header>
    <div className="h-[73px]" aria-hidden="true" />
    </>
  );
}
