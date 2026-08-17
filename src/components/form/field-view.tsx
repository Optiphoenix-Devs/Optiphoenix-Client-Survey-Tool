"use client";

import { useState } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
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

function ChoiceControl({
  type,
  checked,
  disabled,
}: {
  type: "radio" | "checkbox";
  checked?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center border-2 transition duration-200",
        type === "radio" ? "rounded-full" : "rounded-md",
        checked
          ? "border-accent bg-accent"
          : "border-border bg-surface group-hover:border-sage",
        disabled && "opacity-60"
      )}
    >
      {checked ? (
        type === "radio" ? (
          <span className="h-1.5 w-1.5 rounded-full bg-on-accent" />
        ) : (
          <Check className="h-3.5 w-3.5 text-on-accent" strokeWidth={3} />
        )
      ) : null}
    </span>
  );
}

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
  const iconClass = size === "sm" ? "h-4 w-4" : "h-7 w-7";

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {RATING_SCALE.map((score, index) => {
        const value = index + 1;
        const filled = Boolean(!disabled && active && value <= active);
        return (
          <label
            key={score}
            className={cn(
              "transition duration-150",
              disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
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
                "transition duration-150",
                filled ? "fill-sage text-sage" : "fill-transparent text-border"
              )}
              strokeWidth={1.6}
              onMouseEnter={() => {
                if (!disabled) setHovered(value);
              }}
            />
            <span className="sr-only">
              {value} star{value === 1 ? "" : "s"}
            </span>
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

function ChoiceList({
  type,
  name,
  options,
  disabled,
  required,
}: {
  type: "radio" | "checkbox";
  name: string;
  options: string[];
  disabled?: boolean;
  required?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(() => []);

  function toggle(option: string) {
    if (disabled) return;
    if (type === "radio") {
      setSelected([option]);
      return;
    }
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={option}
            className={cn(
              "group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition duration-200 hover:border-sage/70",
              checked && "border-accent bg-sage/10",
              disabled && "cursor-default opacity-70"
            )}
          >
            <input
              type={type}
              name={name}
              value={option}
              disabled={disabled}
              required={type === "radio" && required && !disabled}
              className="sr-only"
              checked={checked}
              onChange={() => toggle(option)}
            />
            <ChoiceControl type={type} checked={checked} disabled={disabled} />
            {option}
          </label>
        );
      })}
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
    "mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition duration-200 focus:border-accent disabled:text-muted";

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
      <ChoiceList
        type="radio"
        name={name}
        options={options}
        disabled={disabled}
        required={field.required}
      />
    );
  }

  if (field.type === "MULTIPLE_CHOICE") {
    return (
      <ChoiceList
        type="checkbox"
        name={`${name}[]`}
        options={options}
        disabled={disabled}
      />
    );
  }

  if (field.type === "DROPDOWN") {
    return (
      <div className="relative mt-2">
        <select
          name={name}
          disabled={disabled}
          required={field.required && !disabled}
          defaultValue=""
          className="w-full appearance-none bg-none rounded-xl border border-border bg-background py-2.5 pl-3 pr-10 text-sm outline-none transition duration-200 focus:border-accent disabled:text-muted"
        >
          <option value="" disabled>
            Choose an option
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    );
  }

  if (field.type === "LONG_TEXT" || field.type === "SUGGESTION") {
    return (
      <textarea
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        rows={3}
        placeholder={
          field.type === "SUGGESTION"
            ? "Ideas or suggestion"
            : "Write your response here"
        }
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
        "mt-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition duration-200 hover:bg-accent-hover",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      Send
    </button>
  );
}
