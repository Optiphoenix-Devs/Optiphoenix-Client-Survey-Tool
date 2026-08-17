"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";

export function PasswordInput({
  name = "password",
  autoComplete,
  placeholder,
  className,
}: {
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        required
        minLength={8}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border bg-surface py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-accent",
          className
        )}
      />
      <Tooltip
        label={visible ? "Hide password" : "Show password"}
        side="bottom"
        className="absolute top-1/2 right-2.5 -translate-y-1/2"
      >
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setVisible((value) => !value);
          }}
          className="rounded-md p-1 text-muted transition hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Tooltip>
    </div>
  );
}
