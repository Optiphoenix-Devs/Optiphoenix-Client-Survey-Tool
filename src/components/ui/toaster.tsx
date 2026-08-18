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
  window.setTimeout(() => dismissToast(item.id), options?.durationMs ?? 4200);
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
  }, 320);
}

const TONE = {
  success: {
    className: "bg-emerald-600 text-white",
    descriptionClass: "text-white/85",
    closeClass: "text-white/80 hover:bg-white/15 hover:text-white",
    Icon: CheckCircle2,
  },
  error: {
    className: "bg-rose-600 text-white",
    descriptionClass: "text-white/85",
    closeClass: "text-white/80 hover:bg-white/15 hover:text-white",
    Icon: CircleAlert,
  },
  info: {
    className: "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50",
    descriptionClass: "text-stone-600 dark:text-stone-200",
    closeClass:
      "text-stone-500 hover:bg-black/10 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-white/15 dark:hover:text-white",
    Icon: Info,
  },
} as const;

export function Toaster() {
  // Seed from current in-memory toasts; this avoids setState() in useEffect (lint rule).
  const [toasts, setToasts] = useState<ToastItem[]>(() => items);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-[50px] left-1/2 z-[90] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((item) => {
        const tone = TONE[item.tone];
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-[0_16px_40px_rgba(20,38,28,0.18)]",
              tone.className,
              item.leaving ? "toast-leave" : "toast-enter"
            )}
          >
            <tone.Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
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
