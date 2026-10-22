import React from "react";
import { Link } from "react-router-dom";

const SIZE_CLASSES = {
  compact: { mark: "h-8 w-8 text-sm", word: "text-xl" },
  default: { mark: "h-9 w-9 text-sm", word: "text-xl sm:text-2xl" },
  large: { mark: "h-11 w-11 text-lg", word: "text-2xl" },
};

export default function BrandLogo({ to = "/", variant = "default", size = "default", asText = false }) {
  const dimensions = SIZE_CLASSES[size] || SIZE_CLASSES.default;
  const isInverse = variant === "inverse";
  const markColors = isInverse ? "bg-white text-slate-900" : "bg-slate-900 text-white";
  const wordColor = isInverse ? "text-white" : "text-slate-900";
  const accentColor = isInverse ? "text-slate-300" : "text-brand";
  const className = `group/brand inline-flex shrink-0 items-center gap-2 font-bold transition-transform duration-200 hover:-translate-y-0.5 ${wordColor}`;

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center rounded-full font-bold transition duration-200 group-hover/brand:rotate-[-6deg] group-hover/brand:scale-105 ${dimensions.mark} ${markColors}`} aria-hidden="true">
        S
      </span>
      <span className={`inline-flex items-baseline font-bold ${dimensions.word}`}>
        <span className="transition-transform duration-200 group-hover/brand:-translate-x-1">S</span>
        <span className="transition-transform duration-200 group-hover/brand:-translate-x-0.5">t</span>
        <span className="transition-transform duration-200">a</span>
        <span className="transition-transform duration-200 group-hover/brand:translate-x-0.5">y</span>
        <span className="transition-transform duration-200 group-hover/brand:translate-x-1">é</span>
        <span className={`transition-colors ${accentColor}`}>.</span>
      </span>
    </>
  );

  if (asText) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link to={to} aria-label="Stayé home" className={className}>
      {content}
    </Link>
  );
}