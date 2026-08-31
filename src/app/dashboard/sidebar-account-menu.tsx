"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";

const VIEWPORT_PAD = 12;
const MENU_WIDTH = 224;

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function clampMenuPosition(
  anchor: DOMRect,
  panelWidth: number,
  panelHeight: number,
  compact: boolean
): MenuPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (compact) {
    let left = anchor.right + 10;
    if (left + panelWidth > vw - VIEWPORT_PAD) {
      left = anchor.left - panelWidth - 10;
    }
    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - panelWidth - VIEWPORT_PAD));

    let top = anchor.bottom - panelHeight;
    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - panelHeight - VIEWPORT_PAD));

    return { top, left, width: panelWidth };
  }

  let top = anchor.top - panelHeight - 8;
  if (top < VIEWPORT_PAD) {
    top = anchor.bottom + 8;
  }
  top = Math.max(VIEWPORT_PAD, Math.min(top, vh - panelHeight - VIEWPORT_PAD));

  let left = anchor.left;
  const width = Math.max(anchor.width, panelWidth);
  if (left + width > vw - VIEWPORT_PAD) {
    left = vw - width - VIEWPORT_PAD;
  }
  left = Math.max(VIEWPORT_PAD, left);

  return { top, left, width };
}

type AccountMenuPanelProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  name: string;
  email: string;
  avatarUrl?: string | null;
  initials: string;
  onClose: () => void;
  logoutAction: () => Promise<void>;
};

export function AccountMenuPanel({
  open,
  anchorRef,
  panelRef,
  name,
  email,
  avatarUrl,
  initials,
  onClose,
  logoutAction,
}: AccountMenuPanelProps) {
  const [position, setPosition] = useState<MenuPosition>({
    top: VIEWPORT_PAD,
    left: VIEWPORT_PAD,
    width: MENU_WIDTH,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      if (!anchorRef.current || !panelRef.current) return;
      const anchor = anchorRef.current.getBoundingClientRect();
      const panel = panelRef.current.getBoundingClientRect();
      const compact = anchor.width < 120;
      setPosition(
        clampMenuPosition(
          anchor,
          panel.width || MENU_WIDTH,
          panel.height || 240,
          compact
        )
      );
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, panelRef, name, email]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[70] app-radius border border-border bg-card p-2 shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      <div className="flex items-center gap-3 px-2 py-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sage/20 text-xs font-semibold text-accent">
            {initials || "OP"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>
      <ThemeToggle showLabel />
      <Link
        href="/dashboard/profile"
        onClick={onClose}
        className="app-menu-item flex items-center gap-2 px-2 py-2 text-sm"
      >
        <UserRound className="h-4 w-4" />
        Account
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="app-menu-item flex w-full items-center gap-2 px-2 py-2 text-sm"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </div>,
    document.body
  );
}

export function useAccountMenuDismiss(
  open: boolean,
  onClose: () => void,
  menuRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, menuRef, panelRef]);
}
