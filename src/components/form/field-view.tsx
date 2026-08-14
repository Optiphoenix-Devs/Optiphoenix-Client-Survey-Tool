"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  RATING_SCALE,
  RESOURCE_SCALE_LEGEND,
  fieldTypeMeta,
  parseOptionList,
} from "@/lib/question-types";

export type ViewField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: unknown;
};

function StarRating({
  name,
  disabled,
  required,
  size = "md",
}: {
  name: string;
  disabled?: boolean;
  required?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const active = hovered || selected;
  const iconClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(0)}
    >
      {RATING_SCALE.map((score, index) => {
        const value = index + 1;
        const filled = Boolean(!disabled && active && value <= active);
        return (
          <label
            key={score}
            className={cn(disabled ? "cursor-default" : "cursor-pointer")}
          >
            <input
              type="radio"
              name={name}
              value={score}
              disabled={disabled}
              required={required && !disabled}
              className="sr-only"
              onChange={() => setSelected(value)}
            />
            <Star
              className={cn(
                iconClass,
                filled ? "fill-sage text-sage" : "fill-transparent text-border"
              )}
              strokeWidth={1.6}
              onMouseEnter={() => {
                if (!disabled) setHovered(value);
              }}
            />
            <span className="sr-only">{value} star{value === 1 ? "" : "s"}</span>
          </label>
        );
      })}
    </div>
  );
}

export function RatingMatrix({
  fieldId,
  rows,
  legend = RESOURCE_SCALE_LEGEND,
  disabled,
  required,
}: {
  fieldId: string;
  rows: string[];
  legend?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted">{legend}</p>
      {rows.map((row, rowIndex) => (
        <div
          key={`${row}-${rowIndex}`}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 first:border-t-0 first:pt-0"
        >
          <p className="min-w-28 text-sm font-medium">{row}</p>
          <StarRating
            name={`q_${fieldId}__${rowIndex}`}
            disabled={disabled}
            required={required}
          />
        </div>
      ))}
    </div>
  );
}

export function FieldView({
  field,
  mode,
}: {
  field: ViewField;
  mode: "preview" | "live";
}) {
  const disabled = mode === "preview";
  const options = parseOptionList(field.options);
  const name = `q_${field.id}`;
  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent disabled:text-muted";

  if (field.type === "RATING") {
    return (
      <div className="mt-2">
        <StarRating
          name={`q_${field.id}`}
          disabled={disabled}
          required={field.required}
        />
      </div>
    );
  }

  if (field.type === "RESOURCE_RATING") {
    return (
      <RatingMatrix
        fieldId={field.id}
        rows={options}
        disabled={disabled}
        required={field.required}
      />
    );
  }

  if (field.type === "SINGLE_CHOICE") {
    return (
      <div className="mt-2 flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={option}
              disabled={disabled}
              required={field.required && !disabled}
              className="accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "MULTIPLE_CHOICE") {
    return (
      <div className="mt-2 flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={`${name}[]`}
              value={option}
              disabled={disabled}
              className="accent-accent"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "DROPDOWN") {
    return (
      <select
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        defaultValue=""
        className={inputClass}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "LONG_TEXT" || field.type === "SUGGESTION") {
    return (
      <textarea
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        rows={3}
        placeholder={fieldTypeMeta(field.type)?.hint}
        className={inputClass}
      />
    );
  }

  return (
    <input
      name={name}
      disabled={disabled}
      required={field.required && !disabled}
      placeholder={fieldTypeMeta(field.type)?.hint ?? "Short answer"}
      className={inputClass}
    />
  );
}

export function FormSubmitButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      Send
    </button>
  );
}
