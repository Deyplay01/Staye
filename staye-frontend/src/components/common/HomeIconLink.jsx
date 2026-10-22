import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomeIconLink({ className = "" }) {
  return (
    <Link
      to="/"
      aria-label="Back to home"
      title="Back to home"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-300 bg-white text-ink-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-navy-900 ${className}`}
    >
      <Home className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
