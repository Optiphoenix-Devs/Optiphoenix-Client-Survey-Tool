import Link from "next/link";
import { cn } from "@/lib/cn";

export function DirectoryCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("directory-card flex h-full flex-col p-6", className)}>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </article>
  );
}

export function DirectoryCardIcon({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("directory-card-icon", className)}>{children}</span>;
}

export function DirectoryCardTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn(
        "directory-card-title line-clamp-2 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function DirectoryCardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("directory-card-footer relative mt-6 flex flex-wrap gap-2 pt-5", className)}>
      {children}
    </div>
  );
}

type DirectoryCardButtonProps = {
  className?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  href?: string;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className" | "children">;

export function DirectoryCardButton({
  className,
  children,
  variant = "primary",
  href,
  type = "button",
  ...props
}: DirectoryCardButtonProps) {
  const classes = cn(
    "directory-card-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition",
    variant === "primary" && "directory-card-btn-primary",
    variant === "secondary" && "directory-card-btn-secondary",
    variant === "danger" && "directory-card-btn-danger",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
