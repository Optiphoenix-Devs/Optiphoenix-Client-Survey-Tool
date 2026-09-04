"use client";

import { ChevronDown, Loader2, Plus, Star, Trash2 } from "lucide-react";
import {
  RESOURCE_SCALE,
  RESOURCE_SCALE_LEGEND,
  minOptionsForType,
} from "@/lib/question-types";
import { Tooltip } from "@/components/ui/tooltip";

export function ChoiceOptionEditor({
  type,
  options,
  onChange,
  onCreateSection,
  linkedOptions,
  creatingOption,
}: {
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "DROPDOWN";
  options: string[];
  onChange: (next: string[]) => void;
  onCreateSection?: (option: string) => void;
  linkedOptions?: ReadonlySet<string>;
  creatingOption?: string | null;
}) {
  const control =
    type === "MULTIPLE_CHOICE" ? "checkbox" : type === "SINGLE_CHOICE" ? "radio" : null;
  const minimum = minOptionsForType(type);
  const canCreateSection = Boolean(onCreateSection);

  function updateAt(index: number, value: string) {
    onChange(options.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function removeAt(index: number) {
    if (options.length <= minimum) return;
    onChange(options.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">
        {type === "DROPDOWN"
          ? canCreateSection
            ? "Branching options"
            : "Dropdown options"
          : "Options"}
      </p>
      {type === "DROPDOWN" ? (
        <div className="relative">
          <select
            disabled
            className="w-full appearance-none bg-none app-radius border border-border bg-background py-2 pl-3 pr-10 text-sm text-muted"
          >
            <option>Choose an option</option>
            {options.map((option, index) => (
              <option key={`${option}-${index}`}>
                {option || `Option ${index + 1}`}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      ) : null}
      {options.map((option, index) => {
        const trimmed = option.trim();
        const alreadyLinked = Boolean(trimmed && linkedOptions?.has(trimmed));
        const isCreating = creatingOption === trimmed;
        const createBusy = Boolean(creatingOption);

        return (
          <div key={index} className="flex items-center gap-2">
            {control ? (
              <input
                type={control}
                disabled
                name={`preview-${type}`}
                className="accent-accent"
                tabIndex={-1}
              />
            ) : (
              <span className="w-4 text-center text-xs text-muted">{index + 1}.</span>
            )}
            <input
              value={option}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
            />
            {canCreateSection ? (
              <Tooltip
                label={
                  isCreating
                    ? "Creating section…"
                    : alreadyLinked
                      ? "Section already created"
                      : trimmed
                        ? "Create section for this option"
                        : "Enter an option name first"
                }
                side="bottom"
              >
                <span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!trimmed || alreadyLinked || createBusy) return;
                      onCreateSection?.(trimmed);
                    }}
                    disabled={!trimmed || alreadyLinked || createBusy}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-accent/10 hover:text-accent disabled:opacity-30"
                    aria-label={
                      isCreating
                        ? "Creating section"
                        : "Create section for this option"
                    }
                    aria-busy={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </span>
              </Tooltip>
            ) : null}
            <Tooltip label="Remove option" side="bottom">
              <span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={options.length <= minimum}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-800 disabled:opacity-30"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </Tooltip>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
      >
        <Plus className="h-4 w-4" />
        Add option
      </button>
    </div>
  );
}

export function ResourceRatingEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  function updateAt(index: number, value: string) {
    onChange(options.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function removeAt(index: number) {
    if (options.length <= 1) return;
    onChange(options.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium">People to rate</p>
      <p className="text-xs text-muted">{RESOURCE_SCALE_LEGEND}</p>
      {options.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              value={name}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={`Name ${index + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
            <Tooltip label="Remove name" side="bottom">
              <span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={options.length <= 1}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-rose-50 hover:text-rose-800 disabled:opacity-30"
                  aria-label="Remove name"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </Tooltip>
          </div>
          <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
            {RESOURCE_SCALE.map((score) => (
              <Star
                key={score}
                className="h-4 w-4 fill-transparent text-border"
                strokeWidth={1.6}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, `Name ${options.length + 1}`])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
      >
        <Plus className="h-4 w-4" />
        Add name
      </button>
    </div>
  );
}
