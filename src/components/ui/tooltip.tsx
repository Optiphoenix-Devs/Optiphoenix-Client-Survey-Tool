"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const VIEWPORT_PAD = 8;
const EXIT_MS = 140;

export function Tooltip({
  label,
  children,
  side = "right",
  className,
  enabled = true,
}: {
  label: string;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom";
  className?: string;
  enabled?: boolean;
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearHideTimer() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function hideNow() {
    clearHideTimer();
    setOpen(false);
    setMounted(false);
    setAnchor(null);
  }

  function hide() {
    setOpen(false);
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setMounted(false);
      setAnchor(null);
      hideTimer.current = null;
    }, EXIT_MS);
  }

  function show(rect: DOMRect) {
    if (!enabled) return;
    clearHideTimer();
    setAnchor(rect);
    setMounted(true);
    requestAnimationFrame(() => setOpen(true));
  }

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  useEffect(() => {
    if (!enabled) hideNow();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    function onDismiss() {
      hideNow();
    }
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss);
    return () => {
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("resize", onDismiss);
    };
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span
      className={cn("inline-flex", className)}
      onMouseEnter={(event) => show(event.currentTarget.getBoundingClientRect())}
      onMouseLeave={hide}
      onFocus={(event) => show(event.currentTarget.getBoundingClientRect())}
      onBlur={hide}
      onPointerDown={hideNow}
    >
      {children}
      {enabled && mounted && anchor && typeof document !== "undefined" ? (
        <TooltipBubble label={label} anchor={anchor} side={side} open={open} />
      ) : null}
    </span>
  );
}

function TooltipBubble({
  label,
  anchor,
  side,
  open,
}: {
  label: string;
  anchor: DOMRect;
  side: "right" | "top" | "bottom";
  open: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [nudge, setNudge] = useState({ x: 0, y: 0 });
  const base = tooltipStyle(anchor, side);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (rect.left < VIEWPORT_PAD) x += VIEWPORT_PAD - rect.left;
    if (rect.right > window.innerWidth - VIEWPORT_PAD) {
      x -= rect.right - (window.innerWidth - VIEWPORT_PAD);
    }
    if (rect.top < VIEWPORT_PAD) y += VIEWPORT_PAD - rect.top;
    if (rect.bottom > window.innerHeight - VIEWPORT_PAD) {
      y -= rect.bottom - (window.innerHeight - VIEWPORT_PAD);
    }
    setNudge({ x, y });
  }, [anchor, side, label]);

  return createPortal(
    <span
      ref={ref}
      role="tooltip"
      className={cn(
        "pointer-events-none fixed z-[80] max-w-xs rounded-lg border border-white/10 bg-foreground/92 px-2.5 py-1.5 text-[11px] leading-4 font-medium text-background shadow-lg backdrop-blur-sm",
        open ? "tooltip-enter" : "tooltip-leave"
      )}
      style={{
        top: base.top,
        left: base.left,
        transform: `${base.transform} translate(${nudge.x}px, ${nudge.y}px)`,
      }}
    >
      {label}
    </span>,
    document.body
  );
}

function tooltipStyle(anchor: DOMRect, side: "right" | "top" | "bottom") {
  if (side === "right") {
    return {
      top: anchor.top + anchor.height / 2,
      left: anchor.right + 8,
      transform: "translateY(-50%)",
    };
  }
  if (side === "top") {
    return {
      top: anchor.top - 8,
      left: anchor.left + anchor.width / 2,
      transform: "translate(-50%, -100%)",
    };
  }
  return {
    top: anchor.bottom + 8,
    left: anchor.left + anchor.width / 2,
    transform: "translateX(-50%)",
  };
}
