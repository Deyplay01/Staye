import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, UserCog, LogOut, CalendarCheck2, Home, LayoutDashboard, UserRound, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../api/auth";
import { getImageUrl } from "../../api";
import BrandLogo from "../common/BrandLogo";
import NotificationBell from "../common/NotificationBell";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const desktopMenuRef = useRef(null);
  const { isAuthenticated, user, logout, isHost, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const initials = (user?.name || "Guest")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isListingDetails = /^\/listings\/[^/]+$/.test(location.pathname);
  const primaryLinkClass = "rounded-full px-4 py-2 text-xs font-semibold transition-colors";
  const activePrimaryLinkClass = "bg-white text-slate-900 shadow-sm";
  const inactivePrimaryLinkClass = "text-slate-600 hover:text-slate-900";

  useEffect(() => {
    const controller = new AbortController();
    if (!isAuthenticated) {
      setAvatar("");
      return () => controller.abort();
    }
    setAvatar(user?.avatar || "");
    fetchProfile({ signal: controller.signal })
      .then((profile) => setAvatar(profile.avatar || user?.avatar || ""))
      .catch((error) => {
        if (error.name !== "CanceledError" && !controller.signal.aborted) {
          setAvatar(user?.avatar || "");
        }
      });
    return () => controller.abort();
  }, [isAuthenticated, user?.avatar, user?.id]);

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <BrandLogo />

        <nav aria-label="Primary navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100/80 p-1.5 md:flex">
          <Link to="/listings" aria-current={location.pathname === "/listings" ? "page" : undefined} className={`${primaryLinkClass} ${location.pathname === "/listings" ? activePrimaryLinkClass : inactivePrimaryLinkClass}`}>
            Explore
          </Link>
          {isListingDetails && (
            <Link to={`${location.pathname}${location.search}`} aria-current="page" className={`${primaryLinkClass} ${activePrimaryLinkClass}`}>
              Property Details
            </Link>
          )}
          <Link to="/my-bookings" aria-current={location.pathname === "/my-bookings" ? "page" : undefined} className={`${primaryLinkClass} ${location.pathname === "/my-bookings" ? activePrimaryLinkClass : inactivePrimaryLinkClass}`}>
            My Bookings
          </Link>
          {isHost && (
            <Link to="/admin/dashboard" aria-current={location.pathname.startsWith("/admin") ? "page" : undefined} className={`${primaryLinkClass} ${location.pathname.startsWith("/admin") ? activePrimaryLinkClass : inactivePrimaryLinkClass}`}>
              {isSuperAdmin ? "Admin Console" : "Host Portal"}
            </Link>
          )}
        </nav>

        <nav ref={desktopMenuRef} className="hidden items-center gap-6 sm:flex">
          <div className="relative flex items-center gap-3">
            {isAuthenticated && <NotificationBell />}
            <button
              type="button"
              onClick={() => setDesktopMenu(desktopMenu === "account" ? null : "account")}
              aria-expanded={desktopMenu === "account"}
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-full border border-slate-200 p-1.5 pl-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:shadow-md"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              {avatar ? <img src={getImageUrl(avatar)} alt="" onError={() => setAvatar("")} className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{initials}</span>}
            </button>
            {desktopMenu === "account" && (
              <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard</Link>
                    <Link to="/profile" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><UserRound className="h-4 w-4" aria-hidden="true" /> Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">Log in</Link>
                    <Link to="/register" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">Sign up</Link>
                  </>
                )}
                {isHost ? (
                  <>
                    <div className="my-2 border-t border-slate-200" />
                    <Link to="/admin/dashboard" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"><Building2 className="h-4 w-4" aria-hidden="true" /> {isSuperAdmin ? "Admin console" : "Host portal"}</Link>
                    <Link to="/admin/listings" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><Building2 className="h-4 w-4" aria-hidden="true" /> Host listings</Link>
                    <Link to="/admin/bookings" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><CalendarCheck2 className="h-4 w-4" aria-hidden="true" /> Host bookings</Link>
                    {isSuperAdmin && <Link to="/admin/users" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><UserCog className="h-4 w-4" aria-hidden="true" /> Trust &amp; safety</Link>}
                  </>
                ) : (
                  <Link to="/admin/login" onClick={() => setDesktopMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"><UserCog className="h-4 w-4" aria-hidden="true" /> Host login</Link>
                )}
                {isAuthenticated && <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 border-t border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"><LogOut className="h-4 w-4" aria-hidden="true" /> Log out</button>}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3 sm:hidden">
          {isAuthenticated && <NotificationBell />}
          <button
            className="text-slate-900"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full h-[calc(100vh-73px)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white/95 px-5 shadow-lg backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 py-6 text-left">
            <nav aria-label="Mobile navigation" className="space-y-1">
              <p className="mb-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Explore</p>
              <Link to="/" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">
                <Home className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Home
              </Link>
              <Link to="/listings" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">
                <Building2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Explore stays
              </Link>
              {isListingDetails && (
                <Link to={`${location.pathname}${location.search}`} onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">
                  <Building2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Property details
                </Link>
              )}
            </nav>

            {isAuthenticated ? (
              <section className="space-y-1 border-t border-slate-200 pt-4">
                <p className="mb-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Your account</p>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><LayoutDashboard className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Dashboard</Link>
                <Link to="/my-bookings" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><CalendarCheck2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> My bookings</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">
                  {avatar ? <img src={getImageUrl(avatar)} alt="" onError={() => setAvatar("")} className="h-7 w-7 rounded-full object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{initials}</span>}
                  {user?.name?.split(" ")[0] || "Profile"}
                </Link>
              </section>
            ) : (
              <section className="space-y-1 border-t border-slate-200 pt-4">
                <p className="mb-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Welcome</p>
                <Link to="/login" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex w-fit items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:scale-[1.02] hover:bg-slate-800 active:scale-100">Sign up</Link>
              </section>
            )}

            {isHost ? (
              <section className="space-y-1 border-t border-slate-200 pt-4">
                <p className="mb-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{isSuperAdmin ? "Administration" : "Hosting"}</p>
                <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 active:translate-x-0"><Building2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> {isSuperAdmin ? "Admin console" : "Host portal"}</Link>
                <Link to="/admin/listings" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><Building2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Host listings</Link>
                <Link to="/admin/bookings" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><CalendarCheck2 className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Host bookings</Link>
                {isSuperAdmin && <Link to="/admin/users" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><UserCog className="h-4 w-4 text-slate-500 group-hover:text-slate-900" aria-hidden="true" /> Trust &amp; safety</Link>}
              </section>
            ) : (
              <section className="border-t border-slate-200 pt-4">
                <p className="mb-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Hosting</p>
                <Link to="/admin/login" onClick={() => setOpen(false)} className="group flex items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0"><UserCog className="h-4 w-4" aria-hidden="true" /> Host login</Link>
              </section>
            )}

            {isAuthenticated && (
              <div className="border-t border-slate-200 pt-4">
                <button type="button" onClick={() => { setOpen(false); handleLogout(); }} className="group flex w-full items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition duration-150 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 active:translate-x-0">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    <div className="h-[73px]" aria-hidden="true" />
    </>
  );
}
