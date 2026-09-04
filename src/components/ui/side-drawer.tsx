"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const MOTION_MS = 300;

type SideDrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Slide from the right (default) or left. */
  side?: "right" | "left";
};

export function SideDrawer({
  open,
  title,
  description,
  onClose,
  children,
  side = "right",
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Start off-screen, then slide in on the next frames so the transition runs.
      setVisible(false);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), MOTION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mounted, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const fromRight = side === "right";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex"
      style={{ justifyContent: fromRight ? "flex-end" : "flex-start" }}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-foreground/30 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "relative flex h-full w-full max-w-md flex-col border-border bg-card transition-transform duration-300 ease-out will-change-transform",
          fromRight
            ? "border-l shadow-[-12px_0_40px_rgba(20,38,28,0.08)]"
            : "border-r shadow-[12px_0_40px_rgba(20,38,28,0.08)]",
          visible
            ? "translate-x-0"
            : fromRight
              ? "translate-x-full"
              : "-translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{children}</div>
      </aside>
    </div>,
    document.body
  );
}

export function DrawerActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
