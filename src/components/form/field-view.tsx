"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  RATING_SCALE,
  RESOURCE_SCALE_LEGEND,
  fieldTypeMeta,
  getAllowOther,
  getChoiceList,
  getFieldType,
  getMaxLength,
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
        "pointer-events-none grid h-5 w-5 shrink-0 place-items-center border-2 transition duration-200",
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
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const active = hovered || selected;
  const iconClass =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-4 w-4" : "h-7 w-7";

  return (
    <div className="flex flex-wrap items-center gap-1.5" onMouseLeave={() => setHovered(0)}>
      {RATING_SCALE.map((score, index) => {
        const value = index + 1;
        const filled = Boolean(!disabled && active && value <= active);
        return (
          <label
            key={score}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center transition duration-150",
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
  starSize = "md",
  layout = "compact",
}: {
  fieldId: string;
  rows: string[];
  legend?: string;
  disabled?: boolean;
  required?: boolean;
  starSize?: "sm" | "md" | "lg";
  layout?: "compact" | "cards";
}) {
  if (layout === "cards") {
    return (
      <div className="mt-3 space-y-4">
        <p className="text-xs text-muted">{legend}</p>
        {rows.map((row, rowIndex) => (
          <div
            key={`${row}-${rowIndex}`}
            className="app-radius border border-border bg-surface px-4 py-3"
          >
            <p className="text-sm font-medium">{row}</p>
            <div className="mt-3">
              <StarRating
                name={`q_${fieldId}__${rowIndex}`}
                disabled={disabled}
                required={required}
                size={starSize}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
            size={starSize}
          />
        </div>
      ))}
    </div>
  );
}

function OtherTextInput({
  name,
  disabled,
  visible,
  className,
}: {
  name: string;
  disabled?: boolean;
  visible: boolean;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <input
      name={name}
      disabled={disabled}
      placeholder="Please specify"
      className={cn(
        "mt-2 w-full app-radius border border-border bg-background px-3 py-2.5 text-sm outline-none transition duration-200 focus:border-accent disabled:text-muted",
        className
      )}
    />
  );
}

const EMPTY_SELECTION: string[] = [];

function ChoiceList({
  type,
  name,
  options,
  disabled,
  required,
  large = false,
  allowOther = false,
  defaultValue,
}: {
  type: "radio" | "checkbox";
  name: string;
  options: string[];
  disabled?: boolean;
  required?: boolean;
  large?: boolean;
  allowOther?: boolean;
  defaultValue?: string;
}) {
  const initialSelected = useMemo(() => {
    if (!defaultValue) return EMPTY_SELECTION;
    if (type === "checkbox") {
      try {
        const parsed = JSON.parse(defaultValue);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        /* plain string */
      }
    }
    return [defaultValue];
  }, [defaultValue, type]);

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const otherSelected = selected.includes("__other__");

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  function selectOption(option: string, checked: boolean) {
    if (disabled) return;
    if (type === "radio") {
      setSelected([option]);
      return;
    }
    setSelected((current) => {
      if (checked) {
        return current.includes(option) ? current : [...current, option];
      }
      return current.filter((item) => item !== option);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={option}
            className={cn(
              "group flex cursor-pointer items-center gap-3 app-radius border border-border bg-surface text-sm transition duration-200 hover:border-sage/70",
              large ? "px-4 py-3.5" : "px-3 py-2.5",
              checked && "border-accent bg-sage/10",
              disabled && "cursor-default opacity-70"
            )}
          >
            <input
              type={type}
              name={name}
              value={option}
              disabled={disabled}
              required={type === "radio" && required && !disabled && !allowOther}
              className="sr-only"
              checked={checked}
              onChange={(event) => selectOption(option, event.target.checked)}
            />
            <ChoiceControl type={type} checked={checked} disabled={disabled} />
            <span className="min-w-0 flex-1 break-words">{option}</span>
          </label>
        );
      })}
      {allowOther ? (
        <div
          className={cn(
            "app-radius border border-border bg-surface text-sm transition duration-200",
            large ? "px-4 py-3.5" : "px-3 py-2.5",
            otherSelected && "border-accent bg-sage/10"
          )}
        >
          <label className="group flex cursor-pointer items-center gap-3">
            <input
              type={type}
              name={name}
              value="__other__"
              disabled={disabled}
              required={
                type === "radio" && required && !disabled && !otherSelected
              }
              className="sr-only"
              checked={otherSelected}
              onChange={(event) =>
                selectOption("__other__", event.target.checked)
              }
            />
            <ChoiceControl
              type={type}
              checked={otherSelected}
              disabled={disabled}
            />
            Other
          </label>
          <OtherTextInput
            name={`${name.replace(/\[\]$/, "")}__other`}
            disabled={disabled}
            visible={otherSelected}
          />
        </div>
      ) : null}
    </div>
  );
}

function DropdownField({
  name,
  options,
  disabled,
  required,
  allowOther,
  fillClass = "bg-background",
  defaultValue = "",
}: {
  name: string;
  options: string[];
  disabled?: boolean;
  required?: boolean;
  allowOther?: boolean;
  fillClass?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="relative mt-2">
      <select
        name={name}
        disabled={disabled}
        required={required && !disabled && value !== "__other__"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          "w-full appearance-none bg-none app-radius border border-border py-2.5 pl-3 pr-10 text-sm outline-none transition duration-200 focus:border-accent disabled:text-muted",
          fillClass
        )}
      >
        <option value="" disabled>
          Choose an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {allowOther ? <option value="__other__">Other</option> : null}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
      <OtherTextInput
        name={`${name}__other`}
        disabled={disabled}
        visible={value === "__other__"}
        className={fillClass}
      />
    </div>
  );
}

function YesNoToggle({
  name,
  disabled,
  required,
  large = false,
}: {
  name: string;
  disabled?: boolean;
  required?: boolean;
  large?: boolean;
}) {
  const [on, setOn] = useState(false);
  const [touched, setTouched] = useState(false);

  function toggle() {
    if (disabled) return;
    setTouched(true);
    setOn((current) => !current);
  }

  return (
    <div
      className={cn(
        "relative mt-2 flex items-center gap-3",
        large && "gap-4"
      )}
      role="group"
      aria-label="Yes or no"
    >
      <span
        className={cn(
          "text-sm transition",
          touched && !on ? "font-semibold text-foreground" : "text-muted"
        )}
      >
        No
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? "Yes" : "No"}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative shrink-0 rounded-full transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          large ? "h-8 w-14" : "h-7 w-12",
          on ? "bg-accent" : "bg-border",
          disabled && "cursor-default opacity-60"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 rounded-full bg-white shadow-sm transition duration-200",
            large ? "h-7 w-7" : "h-6 w-6",
            on ? (large ? "left-[1.625rem]" : "left-[1.375rem]") : "left-0.5"
          )}
        />
      </button>
      <span
        className={cn(
          "text-sm transition",
          touched && on ? "font-semibold text-foreground" : "text-muted"
        )}
      >
        Yes
      </span>
      <input
        type="hidden"
        name={name}
        value={touched ? (on ? "Yes" : "No") : ""}
        readOnly
      />
      {required && !touched ? (
        <input
          tabIndex={-1}
          defaultValue=""
          required
          readOnly
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
    </div>
  );
}

export function FieldView({
  field,
  mode,
  presentation = "default",
  defaultAnswer,
}: {
  field: ViewField;
  mode: "preview" | "live";
  presentation?: "default" | "survey";
  defaultAnswer?: string;
}) {
  const disabled = mode === "preview";
  const isSurvey = presentation === "survey";
  const plugin = getFieldType(field.type);
  const options = getChoiceList(field.options);
  const allowOther = getAllowOther(field.options);
  const maxLength = getMaxLength(field.options);
  const name = `q_${field.id}`;
  const fieldFill = isSurvey ? "bg-surface" : "bg-background";
  const inputClass = cn(
    "mt-2 w-full app-radius border border-border px-3 py-2.5 text-sm outline-none transition duration-200 focus:border-accent disabled:text-muted",
    fieldFill
  );
  const starSize = "md";

  if (field.type === "SECTION") {
    return null;
  }

  const control = (() => {
  if (field.type === "RATING" || plugin?.inputKind === "rating") {
    return (
      <div className="mt-2">
        <StarRating
          name={`q_${field.id}`}
          disabled={disabled}
          required={field.required}
          size={starSize}
        />
        {isSurvey ? (
          <p className="mt-3 text-xs leading-5 text-muted">{RESOURCE_SCALE_LEGEND}</p>
        ) : null}
      </div>
    );
  }

  if (field.type === "RESOURCE_RATING" || plugin?.inputKind === "resource-rating") {
    return (
      <RatingMatrix
        fieldId={field.id}
        rows={options}
        disabled={disabled}
        required={field.required}
        starSize={starSize}
        layout={isSurvey ? "cards" : "compact"}
      />
    );
  }

  if (field.type === "SINGLE_CHOICE" || plugin?.inputKind === "single-choice") {
    return (
      <ChoiceList
        type="radio"
        name={name}
        options={options}
        disabled={disabled}
        required={field.required}
        large={false}
        allowOther={allowOther}
        defaultValue={defaultAnswer}
      />
    );
  }

  if (field.type === "MULTIPLE_CHOICE" || plugin?.inputKind === "multi-choice") {
    return (
      <ChoiceList
        type="checkbox"
        name={`${name}[]`}
        options={options}
        disabled={disabled}
        large={false}
        allowOther={allowOther}
        defaultValue={defaultAnswer}
      />
    );
  }

  if (field.type === "DROPDOWN" || plugin?.inputKind === "dropdown") {
    return (
      <DropdownField
        name={name}
        options={options}
        disabled={disabled}
        required={field.required}
        allowOther={allowOther}
        fillClass={fieldFill}
        defaultValue={defaultAnswer}
      />
    );
  }

  if (field.type === "BRANCHING_DROPDOWN" || plugin?.inputKind === "branching-dropdown") {
    if (isSurvey) {
      return (
        <ChoiceList
          type="radio"
          name={name}
          options={options}
          disabled={disabled}
          required={field.required}
          large
          allowOther={false}
          defaultValue={defaultAnswer}
        />
      );
    }
    return (
      <DropdownField
        name={name}
        options={options}
        disabled={disabled}
        required={field.required}
        allowOther={false}
        fillClass={fieldFill}
        defaultValue={defaultAnswer}
      />
    );
  }

  if (field.type === "LONG_TEXT" || plugin?.inputKind === "long-text") {
    return (
      <textarea
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        rows={isSurvey ? 4 : 3}
        maxLength={maxLength}
        placeholder="Long answer text"
        className={inputClass}
      />
    );
  }

  if (field.type === "COMMENT" || plugin?.inputKind === "comment") {
    return (
      <textarea
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        rows={isSurvey ? 4 : 3}
        maxLength={maxLength}
        placeholder="Paragraph text answer"
        className={inputClass}
      />
    );
  }

  if (field.type === "SUGGESTION" || plugin?.inputKind === "suggestion") {
    return (
      <textarea
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        rows={3}
        maxLength={maxLength}
        placeholder="Ideas or comments"
        className={inputClass}
      />
    );
  }

  if (field.type === "DATE" || plugin?.inputKind === "date") {
    return (
      <input
        type="date"
        name={name}
        disabled={disabled}
        required={field.required && !disabled}
        className={cn(inputClass, "max-w-xs")}
      />
    );
  }

  if (field.type === "TIME" || plugin?.inputKind === "time") {
    return (
      <div className="mt-2 max-w-xs">
        <input
          type="time"
          name={name}
          disabled={disabled}
          required={field.required && !disabled}
          className={cn(inputClass, "mt-0")}
        />
        <p className="mt-1.5 text-xs text-muted">Time zone: GMT</p>
      </div>
    );
  }

  if (field.type === "YES_NO" || plugin?.inputKind === "yes-no") {
    return (
      <YesNoToggle
        name={name}
        disabled={disabled}
        required={field.required}
        large={false}
      />
    );
  }

  return (
    <input
      name={name}
      disabled={disabled}
      required={field.required && !disabled}
      maxLength={maxLength}
      placeholder={
        field.type === "SHORT_TEXT"
          ? "Short answer text"
          : (fieldTypeMeta(field.type)?.hint ?? "Short answer text")
      }
      className={inputClass}
    />
  );
  })();

  if (mode === "preview") {
    return (
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Answer</p>
        {control}
      </div>
    );
  }

  return control;
}

export function FormSubmitButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "mt-2 app-btn-primary px-5 py-2.5 text-sm",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      Send
    </button>
  );
}
