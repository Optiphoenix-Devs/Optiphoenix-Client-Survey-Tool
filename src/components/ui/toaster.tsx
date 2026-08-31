"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  leaving?: boolean;
};

type Listener = (items: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();
const shownOnce = new Set<string>();

function emit() {
  for (const listener of listeners) listener(items);
}

export function toast(
  title: string,
  options?: { description?: string; tone?: ToastTone; durationMs?: number }
) {
  const item: ToastItem = {
    id: nextId++,
    title,
    description: options?.description,
    tone: options?.tone ?? "info",
  };
  items = [item, ...items.filter((toastItem) => !toastItem.leaving)].slice(0, 4);
  emit();
  window.setTimeout(() => dismissToast(item.id), options?.durationMs ?? 4000);
}

export function toastOnce(
  key: string,
  title: string,
  options?: { description?: string; tone?: ToastTone; durationMs?: number }
) {
  if (shownOnce.has(key)) return;
  shownOnce.add(key);
  toast(title, options);
}

function dismissToast(id: number) {
  const current = items.find((item) => item.id === id);
  if (!current || current.leaving) return;
  items = items.map((item) => (item.id === id ? { ...item, leaving: true } : item));
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, 220);
}

const TONE = {
  success: {
    shell: "border-emerald-950/20 bg-emerald-950 text-emerald-50",
    descriptionClass: "text-emerald-100/90",
    iconClass: "text-emerald-200",
    closeClass: "text-emerald-100/80 hover:bg-emerald-900 hover:text-white",
    Icon: CheckCircle2,
  },
  error: {
    shell: "border-rose-950/20 bg-rose-950 text-rose-50",
    descriptionClass: "text-rose-100/90",
    iconClass: "text-rose-200",
    closeClass: "text-rose-100/80 hover:bg-rose-900 hover:text-white",
    Icon: CircleAlert,
  },
  info: {
    shell: "border-slate-900/20 bg-slate-900 text-slate-50",
    descriptionClass: "text-slate-200/90",
    iconClass: "text-slate-300",
    closeClass: "text-slate-200/80 hover:bg-slate-800 hover:text-white",
    Icon: Info,
  },
} as const;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>(() => items);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[90] flex w-[min(calc(100vw-2rem),22rem)] flex-col gap-2.5">
      {toasts.map((item) => {
        const tone = TONE[item.tone];
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-3 app-radius border px-4 py-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur-sm",
              tone.shell,
              item.leaving ? "toast-leave" : "toast-enter"
            )}
          >
            <tone.Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.iconClass)} strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">{item.title}</p>
              {item.description ? (
                <p className={cn("mt-0.5 text-sm leading-5", tone.descriptionClass)}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className={cn("rounded-md p-1 transition", tone.closeClass)}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
