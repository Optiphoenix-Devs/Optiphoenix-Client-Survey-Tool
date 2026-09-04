"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";

const iconButtonClass = "app-icon-action-btn";
const dangerButtonClass = "app-icon-action-btn app-icon-action-btn-danger";

export function TableActionsHeader({
  label = "Actions",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <th className={cn("directory-table-head px-4 py-3.5 text-center", className)}>
      {label}
    </th>
  );
}

export function TableActionsCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn("px-4 py-3 text-center align-middle", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-center gap-1.5">{children}</div>
    </td>
  );
}

export function TableEditButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Tooltip label="Edit" side="top">
      <button
        type="button"
        onClick={onClick}
        className={iconButtonClass}
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

export function TableEditLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Tooltip label="Edit" side="top">
      <Link href={href} className={iconButtonClass} aria-label={`Edit ${label}`}>
        <Pencil className="h-4 w-4" />
      </Link>
    </Tooltip>
  );
}

export function TableUseButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Tooltip label="Use template" side="top">
      <button
        type="button"
        onClick={onClick}
        className={iconButtonClass}
        aria-label={`Use template ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

export function TableDeleteButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Tooltip label="Delete" side="top">
      <button
        type="button"
        onClick={onClick}
        className={dangerButtonClass}
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}
