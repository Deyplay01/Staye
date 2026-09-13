import React from "react";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  accent: "bg-accent text-ink-900 hover:bg-accent-dark",
  outline: "border border-ink-300 text-ink-900 hover:bg-gray-50",
  ghost: "text-brand hover:bg-brand-light",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${sizeClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
