import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import HERO_IMAGE from "../../asset/hero-image.avif"

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  host = false,
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative flex min-h-[34vh] min-w-0 overflow-hidden bg-slate-900 md:min-h-screen">
          <img src={HERO_IMAGE} alt="A serene waterfront resort" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/10" aria-hidden="true" />
          <Link to="/" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white focus-visible:outline-white sm:left-8 sm:top-8">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </Link>
          <div className="relative mt-auto max-w-xl p-6 pt-20 text-white sm:p-10 sm:pt-28 md:px-12 md:py-14 lg:px-16">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              {host ? "For thoughtful hosts" : "Make room for a getaway"}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {host ? "Share a place people will remember." : "Your next good story starts with a stay."}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
              {host
                ? "Bring your property to Staye and manage your listings and bookings in one place."
                : "Discover welcoming places, compare your options, and make your next trip yours."}
            </p>
            <Link to="/listings" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-slate-200">
              Explore available stays <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="flex min-h-[66vh] min-w-0 items-center justify-center bg-white px-5 py-10 sm:px-10 sm:py-12 md:min-h-screen md:px-12 lg:px-16">
          <div className="w-full max-w-[400px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mt-3 mb-7 text-sm leading-6 text-slate-500">{description}</p>
            {children}
            {footer && <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">{footer}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
