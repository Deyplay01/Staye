import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 6000;

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-700",
    borderClassName: "border-emerald-200",
  },
  error: {
    icon: AlertCircle,
    iconClassName: "text-red-700",
    borderClassName: "border-red-200",
  },
  info: {
    icon: Info,
    iconClassName: "text-brand",
    borderClassName: "border-brand/30",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({
    title,
    message,
    type = "info",
    duration = TOAST_DURATION_MS,
    actionLabel,
    onAction,
  }) => {
    const id = ++nextId.current;
    const toast = { id, title, message, type, actionLabel, onAction };
    setToasts((current) => [...current.slice(-3), toast]);
    timers.current.set(id, window.setTimeout(() => dismissToast(id), duration));
    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-end gap-3 px-4 sm:left-auto sm:w-full sm:max-w-md sm:px-4">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <section
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto w-full rounded-2xl border ${style.borderClassName} bg-white p-4 text-ink-900 shadow-popover`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClassName}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {toast.title && <p className="text-sm font-bold">{toast.title}</p>}
                  {toast.message && <p className="mt-1 text-sm leading-5 text-ink-600">{toast.message}</p>}
                  {toast.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        dismissToast(toast.id);
                        toast.onAction();
                      }}
                      className="mt-2 text-sm font-semibold text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:underline"
                    >
                      {toast.actionLabel || "View"}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss message"
                  className="rounded-md p-1 text-ink-500 hover:bg-slate-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
