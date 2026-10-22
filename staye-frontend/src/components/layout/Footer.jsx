import React from "react";
import BrandLogo from "../common/BrandLogo";

export default function Footer() {
  return (
    <footer id="help" className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo variant="inverse" size="large" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">
              Thoughtful spaces, real hosts, and stays worth remembering.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Support</p>
            <ul className="space-y-2 text-sm text-slate-300">
            <li>Help center</li>
            <li>Cancellation options</li>
            <li>Contact us</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Stayé</p>
            <ul className="space-y-2 text-sm text-slate-300">
            <li>About us</li>
            <li>Careers</li>
            <li>Press</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Terms</p>
            <ul className="space-y-2 text-sm text-slate-300">
            <li>Privacy policy</li>
            <li>Terms of use</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">For partners</p>
            <ul className="space-y-2 text-sm text-slate-300">
            <li>List your property</li>
            <li>Partner dashboard</li>
          </ul>
        </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-700 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Stayé</span>
          <span>Stay somewhere that feels like yours.</span>
        </div>
      </div>
    </footer>
  );
}
