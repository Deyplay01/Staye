import React, { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function GoogleAuthButton({ onSuccess, onError, text = "signin_with", disabled = false }) {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measureWidth = () => {
      const width = Math.floor(container.getBoundingClientRect().width);
      setButtonWidth(Math.min(400, Math.max(200, width)));
    };
    measureWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measureWidth);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measureWidth);
    return () => window.removeEventListener("resize", measureWidth);
  }, []);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-ink-300 bg-slate-50 px-4 py-3 text-center text-sm text-ink-500" role="status">
        Google sign-in is currently unavailable.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex min-h-10 w-full justify-center transition-opacity ${disabled ? "opacity-50" : ""}`}
      aria-disabled={disabled}
    >
      {disabled ? (
        <p className="flex items-center text-sm text-ink-500" role="status">Please wait...</p>
      ) : buttonWidth > 0 && (
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          size="large"
          shape="rectangular"
          text={text}
          logo_alignment="left"
          width={String(buttonWidth)}
        />
      )}
    </div>
  );
}
