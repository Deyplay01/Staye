import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ className = "", ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const visibilityLabel = isVisible ? "Hide password" : "Show password";

  return (
    <span className="relative block">
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        className={className}
        style={{ ...inputProps.style, paddingRight: "3rem" }}
      />
      <button
        type="button"
        aria-label={visibilityLabel}
        title={visibilityLabel}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink-500 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}
