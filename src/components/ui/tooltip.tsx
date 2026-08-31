"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const VIEWPORT_PAD = 8;

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

  return (
    <span
      className={cn("inline-flex", className)}
      onMouseEnter={(event) => {
        if (!enabled) return;
        setAnchor(event.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => setAnchor(null)}
      onFocus={(event) => {
        if (!enabled) return;
        setAnchor(event.currentTarget.getBoundingClientRect());
      }}
      onBlur={() => setAnchor(null)}
    >
      {children}
      {enabled && anchor && typeof document !== "undefined" ? (
        <TooltipBubble label={label} anchor={anchor} side={side} />
      ) : null}
    </span>
  );
}

function TooltipBubble({
  label,
  anchor,
  side,
}: {
  label: string;
  anchor: DOMRect;
  side: "right" | "top" | "bottom";
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
      className="pointer-events-none fixed z-[80] whitespace-nowrap rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-on-accent shadow-sm"
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
