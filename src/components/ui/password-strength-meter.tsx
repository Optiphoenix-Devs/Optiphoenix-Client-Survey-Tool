"use client";

import { cn } from "@/lib/cn";
import {
  getPasswordStrength,
  PASSWORD_STRENGTH_LABEL,
  type PasswordStrength,
} from "@/lib/password-strength";

const BAR_COLORS: Record<Exclude<PasswordStrength, "empty">, string[]> = {
  weak: ["bg-rose-500", "bg-hover", "bg-hover"],
  medium: ["bg-amber-500", "bg-amber-500", "bg-hover"],
  strong: ["bg-emerald-500", "bg-emerald-500", "bg-emerald-500"],
};

const TEXT_COLORS: Record<Exclude<PasswordStrength, "empty">, string> = {
  weak: "text-rose-700 dark:text-rose-300",
  medium: "text-amber-800 dark:text-amber-300",
  strong: "text-emerald-700 dark:text-emerald-300",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  if (strength === "empty") {
    return (
      <p className="mt-1.5 text-xs text-muted">
        Use 8+ characters with letters, numbers, and symbols.
      </p>
    );
  }

  const activeBars = strength === "weak" ? 1 : strength === "medium" ? 2 : 3;

  return (
    <div className="mt-1.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {BAR_COLORS[strength].map((color, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index < activeBars ? color : "bg-hover"
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium", TEXT_COLORS[strength])}>
          {PASSWORD_STRENGTH_LABEL[strength]}
        </span>
      </div>
    </div>
  );
}
