"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

const headClass = "directory-table-head px-4 py-3.5";

export function TableHeadLeft({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <th className={cn(headClass, "text-left", className)}>{children}</th>;
}

export function TableHeadCenter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <th className={cn(headClass, "text-center", className)}>{children}</th>;
}

export function TableCellLeft({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <td className={cn("px-4 py-3 text-left align-middle", className)}>{children}</td>;
}

export function TableCellCenter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <td className={cn("px-4 py-3 text-center align-middle", className)}>{children}</td>;
}

export function DirectoryTableRow({
  href,
  ariaLabel,
  children,
  className,
}: {
  href?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  if (!href) {
    return (
      <tr className={cn("border-b border-border last:border-0", className)}>
        {children}
      </tr>
    );
  }

  const target = href;

  return (
    <tr
      className={cn(
        "directory-table-row cursor-pointer border-b border-border last:border-0",
        className
      )}
      onClick={() => router.push(target)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(target);
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  );
}
