import React from "react";

export default function Footer() {
  return (
    <footer id="help" className="mt-16 bg-ink-900 text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C9F2C7] text-lg font-bold text-[#243119]">S</span>
              <span className="text-2xl font-bold tracking-tight">Stayé</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#C9F2C7]/75">
              Thoughtful spaces, real hosts, and stays worth remembering.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ACECA1]">Support</p>
            <ul className="space-y-2 text-sm text-[#C9F2C7]/75">
            <li>Help center</li>
            <li>Cancellation options</li>
            <li>Contact us</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ACECA1]">Stayé</p>
            <ul className="space-y-2 text-sm text-[#C9F2C7]/75">
            <li>About us</li>
            <li>Careers</li>
            <li>Press</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ACECA1]">Terms</p>
            <ul className="space-y-2 text-sm text-[#C9F2C7]/75">
            <li>Privacy policy</li>
            <li>Terms of use</li>
          </ul>
        </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ACECA1]">For partners</p>
            <ul className="space-y-2 text-sm text-[#C9F2C7]/75">
            <li>List your property</li>
            <li>Partner dashboard</li>
          </ul>
        </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[#629460]/40 pt-5 text-xs text-[#C9F2C7]/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Stayé</span>
          <span>Stay somewhere that feels like yours.</span>
        </div>
      </div>
    </footer>
  );
}
