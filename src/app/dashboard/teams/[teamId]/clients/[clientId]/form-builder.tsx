"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  ArrowLeft,
  CheckSquare,
  ChevronDownSquare,
  Bookmark,
  ChevronDown,
  CircleDot,
  Eye,
  Globe,
  GripVertical,
  Lightbulb,
  Pencil,
  Star,
  Trash2,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { PendingButton } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/action-result";
import {
  FIELD_TYPES,
  fieldNeedsOptions,
  fieldTypeMeta,
  parseOptionList,
  type FieldTypeValue,
} from "@/lib/question-types";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { FieldView, FormSubmitButton } from "@/components/form/field-view";
import {
  ChoiceOptionEditor,
  ResourceRatingEditor,
} from "@/components/form/field-settings-controls";
import {
  addField as addFormField,
  deleteField as deleteFormField,
  reorderFields as reorderFormFields,
  togglePublishForm as toggleFormPublish,
  updateField as updateFormField,
  updateForm as updateFormMeta,
  saveAsTemplate as saveFormAsTemplate,
} from "./actions";
import * as templateActions from "@/app/dashboard/templates/actions";

type BuilderAction = (formData: FormData) => Promise<ActionResult>;

type BuilderActions = {
  addField: BuilderAction;
  deleteField: BuilderAction;
  reorderFields: BuilderAction;
  togglePublishForm: BuilderAction;
  updateField: BuilderAction;
  updateForm: BuilderAction;
  saveAsTemplate: BuilderAction;
};

const formActions: BuilderActions = {
  addField: addFormField,
  deleteField: deleteFormField,
  reorderFields: reorderFormFields,
  togglePublishForm: toggleFormPublish,
  updateField: updateFormField,
  updateForm: updateFormMeta,
  saveAsTemplate: saveFormAsTemplate,
};

const BuilderActionsContext = createContext<BuilderActions>(formActions);

function useBuilderActions() {
  return useContext(BuilderActionsContext);
}

type BuilderField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: unknown;
  order: number;
};

type FormBuilderProps = {
  teamId: string;
  clientId: string;
  formId: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  hasResponse?: boolean;
  publicFormUrl: string;
  focusFieldId?: string;
  fields: BuilderField[];
  backHref?: string;
  variant?: "form" | "template";
};

const FIELD_ICONS: Record<FieldTypeValue, LucideIcon> = {
  SHORT_TEXT: Type,
  LONG_TEXT: AlignLeft,
  SINGLE_CHOICE: CircleDot,
  MULTIPLE_CHOICE: CheckSquare,
  DROPDOWN: ChevronDownSquare,
  RATING: Star,
  RESOURCE_RATING: Users,
  SUGGESTION: Lightbulb,
};

function fieldIcon(type: string) {
  return FIELD_ICONS[type as FieldTypeValue] ?? Type;
}

async function notifyAction(
  action: (formData: FormData) => Promise<ActionResult>,
  formData: FormData,
  success?: string
) {
  const result = await action(formData);
  if (result.error) {
    toast(result.error, { tone: "error" });
    return result;
  }
  if (success) toast(success, { tone: "success" });
  return result;
}

function SortableFieldCard({
  field,
  selected,
  onToggle,
  teamId,
  clientId,
  formId,
}: {
  field: BuilderField;
  selected: boolean;
  onToggle: () => void;
  teamId: string;
  clientId: string;
  formId: string;
}) {
  const { deleteField } = useBuilderActions();
  const meta = fieldTypeMeta(field.type);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  useEffect(() => {
    if (selected) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  function removeField(event: React.MouseEvent) {
    event.stopPropagation();
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("fieldId", field.id);
    startTransition(() => {
      void notifyAction(deleteField, formData, "Field removed.");
    });
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        "group rounded-2xl border bg-card transition",
        selected
          ? "border-accent ring-2 ring-accent/15"
          : "border-border hover:border-sage",
        isDragging && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <Tooltip label="Drag to reorder" side="bottom">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted hover:bg-background"
            aria-label="Drag to reorder"
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </Tooltip>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-accent">
          {createElement(fieldIcon(field.type), { className: "h-4 w-4" })}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={selected}
        >
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
            {field.label}
            {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
          </p>
          <span className="hidden shrink-0 text-[10px] font-semibold tracking-wide text-muted uppercase sm:inline">
            {meta?.label ?? field.type}
          </span>
        </button>
        <div className="flex h-8 shrink-0 items-center">
          <Tooltip label="Remove field" side="bottom" className="flex h-8 w-8 items-center justify-center">
            <button
              type="button"
              onClick={removeField}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-800",
                selected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              )}
              aria-label="Remove field"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
            aria-label={selected ? "Collapse field" : "Expand field"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                selected && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {selected ? (
        <div className="border-t border-border px-4 py-4">
          <FieldSettings
            key={field.id}
            field={field}
            teamId={teamId}
            clientId={clientId}
            formId={formId}
          />
        </div>
      ) : null}
    </div>
  );
}

function FieldSettings({
  field,
  teamId,
  clientId,
  formId,
}: {
  field: BuilderField;
  teamId: string;
  clientId: string;
  formId: string;
}) {
  const { updateField } = useBuilderActions();
  const labelRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState(() => {
    const parsed = parseOptionList(field.options);
    if (parsed.length > 0) return parsed;
    if (field.type === "RESOURCE_RATING") return ["Name 1"];
    if (fieldNeedsOptions(field.type)) return ["Option 1"];
    return [];
  });

  useEffect(() => {
    const input = labelRef.current;
    if (!input || input.offsetParent === null) return;
    input.focus();
    input.select();
  }, [field.id]);

  const choiceType =
    field.type === "SINGLE_CHOICE" ||
    field.type === "MULTIPLE_CHOICE" ||
    field.type === "DROPDOWN"
      ? field.type
      : null;

  return (
    <form
      action={async (formData) => {
        await notifyAction(updateField, formData, "Field saved.");
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="fieldId" value={field.id} />
      <input type="hidden" name="optionsText" value={options.join("\n")} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Label
        <input
          ref={labelRef}
          name="label"
          required
          defaultValue={field.label}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      {field.type === "RATING" ? (
        <FieldView
          field={{ ...field, options }}
          mode="preview"
        />
      ) : null}
      {field.type === "RESOURCE_RATING" ? (
        <ResourceRatingEditor options={options} onChange={setOptions} />
      ) : null}
      {choiceType ? (
        <ChoiceOptionEditor
          type={choiceType}
          options={options}
          onChange={setOptions}
        />
      ) : null}
      {field.type === "SHORT_TEXT" ||
      field.type === "LONG_TEXT" ||
      field.type === "SUGGESTION" ? (
        <FieldView field={field} mode="preview" />
      ) : null}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="required" defaultChecked={field.required} />
        Required
      </label>
      <PendingButton
        className="justify-center rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
        pendingLabel="Saving…"
      >
        Save field
      </PendingButton>
    </form>
  );
}

function FormIdentityCard({
  teamId,
  clientId,
  formId,
  title,
  description,
  isTemplate = false,
}: {
  teamId: string;
  clientId: string;
  formId: string;
  title: string;
  description: string | null;
  isTemplate?: boolean;
}) {
  const { updateForm } = useBuilderActions();
  function submitIfChanged(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextTitle = String(data.get("title") ?? "").trim();
    const nextDescription = String(data.get("description") ?? "");
    if (nextTitle === title.trim() && nextDescription === (description ?? "")) return;
    form.requestSubmit();
  }

  return (
    <form
      action={async (formData) => {
        await notifyAction(updateForm, formData, "Saved.");
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        submitIfChanged(event.currentTarget);
      }}
      className="rounded-2xl border border-border bg-card px-5 py-5"
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="formId" value={formId} />
      <input
        name="title"
        required
        defaultValue={title}
        aria-label={isTemplate ? "Template name" : "Form title"}
        placeholder={isTemplate ? "Template name" : "Form title"}
        className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted"
      />
      <textarea
        name="description"
        defaultValue={description ?? ""}
        maxLength={500}
        rows={2}
        aria-label={isTemplate ? "Template description" : "Form description"}
        placeholder={
          isTemplate
            ? "Optional description for your team..."
            : "Add a short description for clients..."
        }
        className="mt-2 w-full resize-none bg-transparent text-sm leading-6 text-muted outline-none placeholder:text-muted/80"
      />
    </form>
  );
}

export function FormBuilder({
  teamId,
  clientId,
  formId,
  title,
  description,
  status,
  hasResponse = false,
  publicFormUrl,
  focusFieldId,
  fields,
  backHref = "/dashboard/forms",
  variant = "form",
}: FormBuilderProps) {
  const isTemplate = variant === "template";
  const actions = isTemplate ? templateActions : formActions;
  const [preview, setPreview] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [items, setItems] = useState(fields);
  const [selectedId, setSelectedId] = useState<string | null>(
    focusFieldId ?? fields[0]?.id ?? null
  );
  const [, startTransition] = useTransition();
  const isPublished = status === "PUBLISHED";
  const canPublish = isPublished || items.length > 0;

  // Sync builder cards after server actions add, save, or reorder fields.
  /* eslint-disable react-hooks/set-state-in-effect -- props to local drag state */
  useEffect(() => {
    setItems(fields);
    if (focusFieldId) setSelectedId(focusFieldId);
  }, [fields, focusFieldId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("orderedIds", JSON.stringify(next.map((item) => item.id)));
    startTransition(() => {
      void notifyAction(actions.reorderFields, formData);
    });
  }

  return (
    <BuilderActionsContext.Provider value={actions}>
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link
          href={backHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-background"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="min-w-0 truncate text-sm text-muted">
          {isTemplate
            ? "Template"
            : hasResponse
              ? "Submitted"
              : isPublished
                ? "Published"
                : "Draft"}
        </p>
        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 overflow-x-auto [&>*]:shrink-0">
          {isTemplate ? null : (
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-background disabled:opacity-50"
          >
            <Bookmark className="h-4 w-4" />
            Save as template
          </button>
          )}
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-background"
          >
            {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Edit" : "Preview"}
          </button>
          {isTemplate ? null : (
          <form
            action={async (formData) => {
              await notifyAction(
                actions.togglePublishForm,
                formData,
                isPublished ? "Form unpublished." : "Form published."
              );
            }}
          >
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="formId" value={formId} />
            <input
              type="hidden"
              name="action"
              value={isPublished ? "unpublish" : "publish"}
            />
            {canPublish ? (
              <PendingButton
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
                  isPublished
                    ? "border border-border bg-surface text-foreground hover:bg-background"
                    : "bg-accent text-on-accent hover:bg-accent-hover"
                )}
                pendingLabel={isPublished ? "Unpublishing…" : "Publishing…"}
              >
                <Globe className="h-4 w-4" />
                {isPublished ? "Unpublish" : "Publish"}
              </PendingButton>
            ) : (
              <Tooltip label="Add at least one field to publish" side="bottom">
                <span>
                  <PendingButton
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
                    pendingLabel="Publishing…"
                  >
                    <Globe className="h-4 w-4" />
                    Publish
                  </PendingButton>
                </span>
              </Tooltip>
            )}
          </form>
          )}
          {!isTemplate && isPublished ? (
            <a
              href={publicFormUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-background"
            >
              Open form
            </a>
          ) : null}
        </div>
      </header>
      {hasResponse && !isTemplate ? (
        <p className="border-b border-border bg-sage/10 px-4 py-2 text-sm text-muted">
          This public link already has a response and cannot be submitted again.
          Save this form as a template, then create a new form from the library for next month.
        </p>
      ) : null}

      {preview ? (
        <div className="flex-1 overflow-auto px-4 py-8">
          <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage">
              Client preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            ) : null}
            <div className="mt-6 space-y-6">
              {items.length === 0 ? (
                <p className="text-sm text-muted">No fields to preview yet.</p>
              ) : (
                items.map((field) => (
                  <div key={field.id}>
                    <p className="text-sm font-medium">
                      {field.label}
                      {field.required ? (
                        <span className="ml-1 text-rose-600">*</span>
                      ) : null}
                    </p>
                    <FieldView field={field} mode="preview" />
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 border-t border-border pt-5">
              <FormSubmitButton disabled />
              <p className="mt-2 text-xs text-muted">
                Send is live on the published URL. This preview does not submit.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="border-b border-border bg-card p-4 lg:h-full lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <p className="mb-3 text-sm font-semibold">Add fields</p>
            <div className="grid grid-cols-1 gap-1">
              {FIELD_TYPES.map((type) => {
                return (
                  <form
                    action={async (formData) => {
                      const result = await notifyAction(actions.addField, formData, "Field added.");
                      if (result.fieldId) setSelectedId(result.fieldId);
                    }}
                    key={type.value}
                    className="w-full"
                  >
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="formId" value={formId} />
                    <input type="hidden" name="type" value={type.value} />
                    <PendingButton className="grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl px-2 py-2 text-left transition duration-150 hover:bg-background">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-background text-accent">
                        {createElement(fieldIcon(type.value), { className: "h-4 w-4" })}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {type.label}
                        </span>
                        <span className="hidden truncate text-xs text-muted lg:block">
                          {type.hint}
                        </span>
                      </span>
                    </PendingButton>
                  </form>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-auto px-4 py-6">
            <div className="mx-auto max-w-2xl">
              <FormIdentityCard
                teamId={teamId}
                clientId={clientId}
                formId={formId}
                title={title}
                description={description}
                isTemplate={isTemplate}
              />

              {items.length === 0 ? (
                <div className="mt-4 rounded-2xl border-2 border-dashed border-border px-6 py-16 text-center">
                  <p className="font-semibold">{isTemplate ? "This template is empty" : "This form is empty"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {isTemplate
                      ? "Add a field type from the left to start this template."
                      : "Add a field type from the left to start building this form."}
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <div className="mt-4 space-y-3">
                      {items.map((field) => (
                        <SortableFieldCard
                          key={field.id}
                          field={field}
                          selected={selectedId === field.id}
                          onToggle={() =>
                            setSelectedId((current) =>
                              current === field.id ? null : field.id
                            )
                          }
                          teamId={teamId}
                          clientId={clientId}
                          formId={formId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </main>
        </div>
      )}

      <SideDrawer
        open={templateOpen}
        title="Save as template"
        description="Keep these questions in your library. Next month, create a new form from this template for a fresh public link."
        onClose={() => setTemplateOpen(false)}
      >
        <form
          action={async (formData) => {
            const result = await notifyAction(actions.saveAsTemplate, formData, "Template saved.");
            if (!result.error) setTemplateOpen(false);
          }}
        >
          <input type="hidden" name="formId" value={formId} />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Template name
            <input
              name="name"
              required
              minLength={2}
              maxLength={160}
              defaultValue={title}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              placeholder="Optional note for your team"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={() => setTemplateOpen(false)}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-hover"
            >
              Cancel
            </button>
            <PendingButton
              className="justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
              pendingLabel="Saving…"
            >
              Save template
            </PendingButton>
          </DrawerActions>
        </form>
      </SideDrawer>
    </div>
    </BuilderActionsContext.Provider>
  );
}
