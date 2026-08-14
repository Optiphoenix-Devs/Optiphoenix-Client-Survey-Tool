"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type Listener = (items: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(items);
}

export function toast(
  title: string,
  options?: { description?: string; tone?: ToastTone }
) {
  const item: ToastItem = {
    id: nextId++,
    title,
    description: options?.description,
    tone: options?.tone ?? "info",
  };
  items = [...items, item];
  emit();
  window.setTimeout(() => dismissToast(item.id), 5000);
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    setToasts(items);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto toast-enter flex items-start gap-3 rounded-xl border bg-card px-4 py-3",
            item.tone === "success" && "border-sage",
            item.tone === "error" && "border-rose-700",
            item.tone === "info" && "border-border"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-sm text-muted">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            className="rounded-md p-1 text-muted hover:bg-hover hover:text-foreground"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
