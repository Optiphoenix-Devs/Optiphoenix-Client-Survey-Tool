"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("h-4 w-4 shrink-0 animate-spin", className)} />;
}

export function ActionButton({
  pending = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
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
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function PendingButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <ActionButton pending={pending} className={className} {...props}>
      {children}
    </ActionButton>
  );
}
