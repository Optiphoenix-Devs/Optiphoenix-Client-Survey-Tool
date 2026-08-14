"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export function Tooltip({
  label,
  children,
  side = "right",
  className,
}: {
  label: string;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom";
  className?: string;
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={(event) => setAnchor(event.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setAnchor(null)}
      onFocus={(event) => setAnchor(event.currentTarget.getBoundingClientRect())}
      onBlur={() => setAnchor(null)}
    >
      {children}
      {anchor && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[80] whitespace-nowrap rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-on-accent shadow-sm"
              style={tooltipStyle(anchor, side)}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

function tooltipStyle(anchor: DOMRect, side: "right" | "top" | "bottom") {
  if (side === "right") {
    return { top: anchor.top + anchor.height / 2, left: anchor.right + 8, transform: "translateY(-50%)" };
  }
  if (side === "top") {
    return { top: anchor.top - 8, left: anchor.left + anchor.width / 2, transform: "translate(-50%, -100%)" };
  }
  return { top: anchor.bottom + 8, left: anchor.left + anchor.width / 2, transform: "translateX(-50%)" };
}
