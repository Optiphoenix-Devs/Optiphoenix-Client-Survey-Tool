"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("h-4 w-4 shrink-0 animate-spin", className)} />;
}

export function ActionButton({
  pending = false,
  icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  /** Replaced by a spinner while pending. */
  icon?: ReactNode;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={pending || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 disabled:opacity-60",
        className
      )}
    >
      {pending ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function PendingButton({
  icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <ActionButton pending={pending} icon={icon} className={className} {...props}>
      {children}
    </ActionButton>
  );
}
