import React from "react";

const VARIANTS = {
  primary: "bg-navy-900 text-white shadow-sm hover:bg-navy-800",
  accent: "bg-accent text-ink-900 hover:bg-accent-dark",
  outline: "border border-slate-200 bg-white text-ink-900 hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-ink-700 hover:bg-slate-100 hover:text-ink-900",
  danger: "bg-danger text-white hover:bg-red-700",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) {
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-sm" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2.5 text-sm";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${sizeClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
