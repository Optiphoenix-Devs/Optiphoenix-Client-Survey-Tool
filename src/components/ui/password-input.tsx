"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

export function PasswordInput({
  name = "password",
  autoComplete,
  placeholder = "At least 8 characters",
  className,
  showStrength = false,
  minLength,
  resetKey,
}: {
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  showStrength?: boolean;
  /** Enforce length only when setting a password (create/reset). Omit on login. */
  minLength?: number;
  /** Change this value to clear the controlled password (e.g. after failed login). */
  resetKey?: string | number | null;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (resetKey === undefined || resetKey === null) return;
    setValue("");
    setVisible(false);
  }, [resetKey]);

  return (
    <div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
              setVisible((current) => !current);
            }}
            className="rounded-md p-1 text-muted transition hover:text-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>
      {showStrength ? <PasswordStrengthMeter password={value} /> : null}
    </div>
  );
}
