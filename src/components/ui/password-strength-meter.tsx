"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getPasswordRequirements,
  getPasswordStrength,
  PASSWORD_HINT,
  PASSWORD_STRENGTH_LABEL,
  type PasswordStrength,
} from "@/lib/password-strength";

const BAR_COLORS: Record<Exclude<PasswordStrength, "empty">, string[]> = {
  weak: ["bg-rose-500", "bg-hover", "bg-hover"],
  medium: ["bg-amber-500", "bg-amber-500", "bg-hover"],
  strong: ["bg-brand", "bg-brand", "bg-brand"],
};

const TEXT_COLORS: Record<Exclude<PasswordStrength, "empty">, string> = {
  weak: "text-rose-700 dark:text-rose-300",
  medium: "text-amber-800 dark:text-amber-300",
  strong: "text-brand dark:text-sage",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirements(password);

  if (strength === "empty") {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-muted">{PASSWORD_HINT}</p>
        <ul className="space-y-1">
          {requirements.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-xs text-muted">
              <Circle className="h-3 w-3 shrink-0" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const activeBars = strength === "weak" ? 1 : strength === "medium" ? 2 : 3;

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
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
        <span className={cn("text-xs font-semibold", TEXT_COLORS[strength])}>
          {PASSWORD_STRENGTH_LABEL[strength]}
        </span>
      </div>
      <ul className="space-y-1">
        {requirements.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              item.met ? "font-medium text-brand dark:text-sage" : "text-muted"
            )}
          >
            {item.met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-brand dark:text-sage" strokeWidth={2.5} />
            ) : (
              <Circle className="h-3 w-3 shrink-0" />
            )}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
