"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  CheckSquare,
  ChevronDownSquare,
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
import {
  FIELD_TYPES,
  fieldNeedsOptions,
  fieldTypeMeta,
  parseOptionList,
  type FieldTypeValue,
} from "@/lib/question-types";
import { FieldView, FormSubmitButton } from "@/components/form/field-view";
import {
  ChoiceOptionEditor,
  ResourceRatingEditor,
} from "@/components/form/field-settings-controls";
import {
  addField,
  deleteField,
  reorderFields,
  togglePublishForm,
  updateField,
  updateForm,
} from "./actions";

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
  status: "DRAFT" | "PUBLISHED";
  publicFormUrl: string;
  focusFieldId?: string;
  fields: BuilderField[];
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

function SortableFieldCard({
  field,
  selected,
  onSelect,
  teamId,
  clientId,
  formId,
}: {
  field: BuilderField;
  selected: boolean;
  onSelect: () => void;
  teamId: string;
  clientId: string;
  formId: string;
}) {
  const meta = fieldTypeMeta(field.type);
  const Icon = fieldIcon(field.type);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  useEffect(() => {
    if (selected) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

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
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-2xl border bg-card p-4 transition",
        selected
          ? "border-accent ring-2 ring-accent/15"
          : "border-border hover:border-sage",
        isDragging && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-8 w-8 cursor-grab place-items-center rounded-lg text-muted hover:bg-background"
          aria-label="Drag to reorder"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-background text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex-1 truncate text-sm font-semibold">
          {field.label}
          {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </p>
        <span className="hidden rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted sm:inline">
          {meta?.label ?? field.type}
        </span>
        <form action={deleteField} onClick={(event) => event.stopPropagation()}>
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="formId" value={formId} />
          <input type="hidden" name="fieldId" value={field.id} />
          <button
            type="submit"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-800"
            aria-label="Remove field"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
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
    <form action={updateField} className="grid gap-4">
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
          className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
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
      <button
        type="submit"
        className="rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
      >
        Save field
      </button>
    </form>
  );
}

export function FormBuilder({
  teamId,
  clientId,
  formId,
  title,
  status,
  publicFormUrl,
  focusFieldId,
  fields,
}: FormBuilderProps) {
  const [preview, setPreview] = useState(false);
  const [items, setItems] = useState(fields);
  const [selectedId, setSelectedId] = useState(
    focusFieldId ?? fields[0]?.id ?? null
  );
  const [, startTransition] = useTransition();
  const isPublished = status === "PUBLISHED";
  const selected = items.find((item) => item.id === selectedId) ?? null;

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
      void reorderFields(formData);
    });
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] flex-col lg:min-h-screen">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
        <form action={updateForm} className="flex min-w-0 flex-1 items-center gap-2">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="formId" value={formId} />
          <input
            name="title"
            required
            defaultValue={title}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-semibold outline-none hover:bg-background focus:bg-background"
          />
          <button
            type="submit"
            className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium sm:inline"
          >
            Save
          </button>
        </form>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-background"
          >
            {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{preview ? "Edit" : "Preview"}</span>
          </button>
          <form action={togglePublishForm}>
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="formId" value={formId} />
            <input
              type="hidden"
              name="action"
              value={isPublished ? "unpublish" : "publish"}
            />
            <button
              type="submit"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-on-accent",
                isPublished
                  ? "bg-stone-700 hover:bg-stone-800"
                  : "bg-accent hover:bg-accent-hover"
              )}
            >
              <Globe className="h-4 w-4" />
              {isPublished ? "Unpublish" : "Publish"}
            </button>
          </form>
          {isPublished ? (
            <a
              href={publicFormUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-background"
            >
              Open form
            </a>
          ) : null}
        </div>
      </header>

      {preview ? (
        <div className="flex-1 overflow-auto px-4 py-8">
          <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage">
              Client preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
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
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="border-b border-border bg-card p-4 lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <p className="mb-3 text-sm font-semibold">Add fields</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {FIELD_TYPES.map((type) => {
                const Icon = fieldIcon(type.value);
                return (
                  <form action={addField} key={type.value}>
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="formId" value={formId} />
                    <input type="hidden" name="type" value={type.value} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-background"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {type.label}
                        </span>
                        <span className="hidden truncate text-xs text-muted lg:block">
                          {type.hint}
                        </span>
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-2xl">
              {items.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border px-6 py-16 text-center">
                  <p className="font-semibold">This form is empty</p>
                  <p className="mt-1 text-sm text-muted">
                    Add a field type from the left. It belongs only to this
                    client.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {items.map((field) => (
                        <SortableFieldCard
                          key={field.id}
                          field={field}
                          selected={selectedId === field.id}
                          onSelect={() => setSelectedId(field.id)}
                          teamId={teamId}
                          clientId={clientId}
                          formId={formId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {selected && items.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-border bg-card p-5 xl:hidden">
                  <p className="mb-3 text-sm font-semibold">Field settings</p>
                  <FieldSettings
                    key={selected.id}
                    field={selected}
                    teamId={teamId}
                    clientId={clientId}
                    formId={formId}
                  />
                </div>
              ) : null}
            </div>
          </main>

          <aside className="hidden w-[26rem] shrink-0 overflow-y-auto border-l border-border bg-card p-5 xl:block">
            <p className="mb-3 text-sm font-semibold">Field settings</p>
            {selected ? (
              <FieldSettings
                key={selected.id}
                field={selected}
                teamId={teamId}
                clientId={clientId}
                formId={formId}
              />
            ) : (
              <p className="text-sm text-muted">
                Add a field from the left. Its label opens here automatically.
              </p>
            )}
            <div className="mt-8 rounded-xl bg-background p-3 text-xs text-muted">
              <p className="font-medium text-foreground">Published form URL</p>
              {isPublished ? (
                <p className="mt-1 break-all">
                  <a
                    href={publicFormUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    {publicFormUrl}
                  </a>
                </p>
              ) : (
                <p className="mt-1">
                  Publish this form to get a shareable client link.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
