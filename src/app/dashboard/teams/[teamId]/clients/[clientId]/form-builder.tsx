"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  CheckCircle2,
  CheckSquare,
  ChevronDownSquare,
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronLeft,
  CircleDot,
  Eye,
  ImagePlus,
  Globe,
  GitBranch,
  GripVertical,
  LayoutList,
  Copy,
  Lightbulb,
  Link2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Star,
  ToggleLeft,
  Trash2,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { PendingButton, ActionButton } from "@/components/ui/pending-button";
import { toast, toastDebounced } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/action-result";
import {
  ADDABLE_FIELD_TYPES,
  SECTION_QUESTION_FIELD_TYPES,
  fieldNeedsOptions,
  fieldTypeMeta,
  getChoiceList,
  getFieldType,
  getMaxLength,
  type FieldTypeValue,
} from "@/lib/question-types";
import {
  DEFAULT_THANK_YOU_BG,
  THANK_YOU_BG_PRESETS,
  normalizeThankYouBg,
} from "@/lib/form-thank-you";
import { SurveyFlow } from "@/app/survey/survey-flow";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { Modal } from "@/components/ui/modal";
import { FieldView } from "@/components/form/field-view";
import {
  ChoiceOptionEditor,
  ResourceRatingEditor,
} from "@/components/form/field-settings-controls";
import {
  addField as addFormField,
  addSection as addFormSection,
  applyTemplate as applyFormTemplate,
  attachClient as attachFormClient,
  deleteField as deleteFormField,
  deleteSection as deleteFormSection,
  reorderFields as reorderFormFields,
  togglePublishForm as toggleFormPublish,
  updateField as updateFormField,
  updateSection as updateFormSection,
  updateForm as updateFormMeta,
  saveAsTemplate as saveFormAsTemplate,
  duplicateField as duplicateFormField,
  duplicateForm as duplicateClientForm,
} from "./actions";
import * as templateActions from "@/app/dashboard/templates/actions";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

type BuilderAction = (formData: FormData) => Promise<ActionResult>;

type BuilderActions = {
  addField: BuilderAction;
  addSection?: BuilderAction;
  deleteField: BuilderAction;
  deleteSection?: BuilderAction;
  reorderFields: BuilderAction;
  togglePublishForm: BuilderAction;
  updateField: BuilderAction;
  updateSection?: BuilderAction;
  updateForm: BuilderAction;
  saveAsTemplate: BuilderAction;
  duplicateField?: BuilderAction;
  duplicateForm?: BuilderAction;
  attachClient?: BuilderAction;
  applyTemplate?: BuilderAction;
};

const formActions: BuilderActions = {
  addField: addFormField,
  addSection: addFormSection,
  deleteField: deleteFormField,
  deleteSection: deleteFormSection,
  reorderFields: reorderFormFields,
  togglePublishForm: toggleFormPublish,
  updateField: updateFormField,
  updateSection: updateFormSection,
  updateForm: updateFormMeta,
  saveAsTemplate: saveFormAsTemplate,
  attachClient: attachFormClient,
  applyTemplate: applyFormTemplate,
  duplicateField: duplicateFormField,
  duplicateForm: duplicateClientForm,
};

const BuilderActionsContext = createContext<BuilderActions>(formActions);

function useBuilderActions() {
  return useContext(BuilderActionsContext);
}

type BuilderField = {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  required: boolean;
  options: unknown;
  sectionId?: string | null;
  order: number;
};

type BuilderSection = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  branchValue?: string | null;
  logic?: unknown;
};

type FormBuilderProps = {
  teamId: string;
  clientId: string;
  formId: string;
  title: string;
  description: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  headerImageUrl?: string | null;
  thankYouImageUrl?: string | null;
  thankYouBgColor?: string | null;
  status: "DRAFT" | "PUBLISHED";
  hasResponse?: boolean;
  publicFormUrl: string;
  focusFieldId?: string;
  sections?: BuilderSection[];
  fields: BuilderField[];
  backHref?: string;
  variant?: "form" | "template";
  templates?: Array<{ id: string; name: string; fieldCount: number }>;
  clients?: Array<{ id: string; name: string; teamId: string; teamName: string }>;
  sourceTemplateId?: string | null;
};

const FIELD_ICONS: Record<FieldTypeValue, LucideIcon> = {
  SHORT_TEXT: Type,
  LONG_TEXT: AlignLeft,
  COMMENT: MessageSquare,
  SINGLE_CHOICE: CircleDot,
  MULTIPLE_CHOICE: CheckSquare,
  DROPDOWN: ChevronDownSquare,
  BRANCHING_DROPDOWN: GitBranch,
  RATING: Star,
  RESOURCE_RATING: Users,
  SUGGESTION: Lightbulb,
  DATE: Calendar,
  YES_NO: ToggleLeft,
};

function fieldIcon(type: string) {
  return FIELD_ICONS[type as FieldTypeValue] ?? Type;
}

const BUILDER_AUTOSAVE_TOAST_KEY = "builder-autosave";
const BUILDER_AUTOSAVE_DEBOUNCE_MS = 1500;

async function notifyAction(
  action: (formData: FormData) => Promise<ActionResult>,
  formData: FormData,
  success?: string,
  options?: { debounceSuccess?: boolean }
) {
  const result = await action(formData);
  if (result.error) {
    toast(result.error, { tone: "error" });
    return result;
  }
  if (success) {
    if (options?.debounceSuccess) {
      toastDebounced(BUILDER_AUTOSAVE_TOAST_KEY, success, {
        tone: "success",
        delayMs: BUILDER_AUTOSAVE_DEBOUNCE_MS,
      });
    } else {
      toast(success, { tone: "success" });
    }
  }
  return result;
}

function SortableFieldCard({
  field,
  selected,
  onToggle,
  teamId,
  clientId,
  formId,
  allFields,
  linkedBranchValues,
  onSectionCreated,
  onDuplicate,
  onRemove,
}: {
  field: BuilderField;
  selected: boolean;
  onToggle: () => void;
  teamId: string;
  clientId: string;
  formId: string;
  allFields: BuilderField[];
  linkedBranchValues?: ReadonlySet<string>;
  onSectionCreated?: (sectionId: string, branchValue: string) => void;
  onDuplicate: (fieldId: string) => void;
  onRemove: (fieldId: string) => void;
}) {
  const router = useRouter();
  const { deleteField, duplicateField } = useBuilderActions();
  const meta = fieldTypeMeta(field.type);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dndReady, setDndReady] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled: !dndReady });

  useEffect(() => {
    setDndReady(true);
  }, []);

  useEffect(() => {
    if (dndReady && cardRef.current) {
      setNodeRef(cardRef.current);
    }
  }, [dndReady, setNodeRef, field.id]);

  useEffect(() => {
    if (selected) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  function removeField(event: React.MouseEvent) {
    event.stopPropagation();
    if (isDeleting) return;
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("fieldId", field.id);
    setIsDeleting(true);
    void (async () => {
      const result = await notifyAction(deleteField, formData, "Field removed.");
      if (result.error) {
        setIsDeleting(false);
        return;
      }
      onRemove(field.id);
      router.refresh();
    })();
  }

  function copyField(event: React.MouseEvent) {
    event.stopPropagation();
    if (!duplicateField || isDuplicating) return;
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("fieldId", field.id);
    setIsDuplicating(true);
    void (async () => {
      const result = await notifyAction(duplicateField, formData, "Field duplicated.");
      setIsDuplicating(false);
      if (result.fieldId) onDuplicate(result.fieldId);
    })();
  }

  return (
    <div
      ref={(node) => {
        cardRef.current = node;
      }}
      style={{
        ...(dndReady && transform
          ? {
              transform: CSS.Transform.toString(transform),
              transition,
            }
          : undefined),
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        "group app-radius border border-border bg-white shadow-sm transition-shadow",
        selected
          ? "border-accent ring-2 ring-accent/15"
          : "hover:border-sage/70",
        isDeleting && "pointer-events-none opacity-60",
        isDragging &&
          "z-20 border-accent bg-white shadow-lg ring-2 ring-accent/30 scale-[1.01]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        <Tooltip label="Drag to reorder" side="bottom">
          <button
            type="button"
            className={cn(
              "flex h-9 w-9 min-h-9 min-w-9 shrink-0 touch-none cursor-grab items-center justify-center app-radius border border-dashed border-border bg-surface text-muted transition active:cursor-grabbing hover:border-accent/40 hover:bg-accent/5 hover:text-accent",
              isDragging && "border-accent bg-accent/10 text-accent"
            )}
            aria-label="Drag to reorder"
            onClick={(event) => event.stopPropagation()}
            {...(dndReady ? attributes : {})}
            {...(dndReady ? listeners : {})}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </Tooltip>
        <span className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-background text-accent">
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
        </button>
        <div className="hidden shrink-0 md:block">
          <Tooltip label={meta?.label ?? field.type} side="bottom">
            <span className="max-w-[5.5rem] truncate rounded-md bg-background px-2 py-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
              {meta?.label ?? field.type}
            </span>
          </Tooltip>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {duplicateField ? (
            <Tooltip label="Duplicate field" side="bottom" className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center">
              <button
                type="button"
                onClick={copyField}
                disabled={isDuplicating || isDeleting}
                className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg text-muted transition hover:bg-background hover:text-accent disabled:opacity-50"
                aria-label="Duplicate field"
              >
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </Tooltip>
          ) : null}
          <Tooltip label="Remove field" side="bottom" className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center">
            <button
              type="button"
              onClick={removeField}
              disabled={isDeleting || isDuplicating}
              className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50"
              aria-label="Remove field"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-rose-700" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg text-muted hover:bg-background"
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
            linkedBranchValues={linkedBranchValues}
            onSectionCreated={onSectionCreated}
          />
        </div>
      ) : null}
    </div>
  );
}

function SectionSettings({
  section,
  teamId,
  clientId,
  formId,
}: {
  section: BuilderSection;
  teamId: string;
  clientId: string;
  formId: string;
}) {
  const { updateSection } = useBuilderActions();

  if (!updateSection) return null;

  const linkedOption = section.branchValue ?? section.title;

  return (
    <form
      action={async (formData) => {
        await notifyAction(updateSection, formData, "Section saved.");
      }}
      className="grid gap-4 border-t border-border px-4 py-4"
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="sectionId" value={section.id} />
      <div className="app-radius border border-border bg-background/60 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Linked branching option
        </p>
        <p className="mt-1 text-sm font-medium">{linkedOption}</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Section title matches this option. Rename the option on the section
          branching field to update it here.
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Section description
        <textarea
          name="description"
          defaultValue={section.description ?? ""}
          maxLength={500}
          rows={2}
          placeholder="Optional intro shown at the top of this section"
          className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <PendingButton className="justify-center app-btn-primary px-3 py-2.5 text-sm">
        Save section
      </PendingButton>
    </form>
  );
}

function SectionCard({
  section,
  fields,
  globalFields,
  selectedFieldId,
  onSelectField,
  teamId,
  clientId,
  formId,
  expanded,
  onToggle,
  onDuplicateField,
  onRemoveField,
}: {
  section: BuilderSection;
  fields: BuilderField[];
  globalFields: BuilderField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  teamId: string;
  clientId: string;
  formId: string;
  expanded: boolean;
  onToggle: () => void;
  onDuplicateField: (fieldId: string) => void;
  onRemoveField: (fieldId: string) => void;
}) {
  const { deleteSection, addField } = useBuilderActions();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [items, setItems] = useState(fields);
  const [fieldTypeToAdd, setFieldTypeToAdd] = useState<string>(
    SECTION_QUESTION_FIELD_TYPES[0]?.value ?? "SHORT_TEXT"
  );
  const [addingField, setAddingField] = useState(false);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const router = useRouter();
  const { reorderFields } = useBuilderActions();

  useEffect(() => {
    setItems(fields);
  }, [fields]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("orderedIds", JSON.stringify(next.map((item) => item.id)));
    void (async () => {
      const result = await reorderFields(formData);
      if (result.error) {
        setItems(previous);
        toast(result.error, { tone: "error" });
        return;
      }
      router.refresh();
    })();
  }

  function removeSection() {
    if (!deleteSection) return;
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("sectionId", section.id);
    void notifyAction(deleteSection, formData, "Section removed.");
  }

  async function addFieldToSection() {
    setAddingField(true);
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set("type", fieldTypeToAdd);
    formData.set("sectionId", section.id);
    const result = await notifyAction(addField, formData, "Field added.");
    setAddingField(false);
    if (result.fieldId) onSelectField(result.fieldId);
  }

  return (
    <div
      data-section-id={section.id}
      className="app-radius border border-dashed border-border bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-accent">
          <LayoutList className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold">{section.title}</p>
          <p className="text-xs text-muted">
            {section.branchValue
              ? `Shows when "${section.branchValue}" is chosen`
              : `${fields.length} question${fields.length === 1 ? "" : "s"}`}
          </p>
        </button>
        <Tooltip label="Remove section" side="bottom">
          <button
            type="button"
            onClick={removeSection}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-rose-50 hover:text-rose-800"
            aria-label="Remove section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
          aria-label={expanded ? "Collapse section" : "Expand section"}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      </div>
      {expanded ? (
        <>
          <SectionSettings
            section={section}
            teamId={teamId}
            clientId={clientId}
            formId={formId}
          />
          {items.length === 0 ? (
            <p className="border-t border-border px-4 py-4 text-center text-sm text-muted">
              No questions in this section yet.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 border-t border-border px-3 py-3">
                  {items.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      selected={selectedFieldId === field.id}
                      onToggle={() =>
                        onSelectField(selectedFieldId === field.id ? null : field.id)
                      }
                      teamId={teamId}
                      clientId={clientId}
                      formId={formId}
                      allFields={globalFields}
                      onDuplicate={onDuplicateField}
                      onRemove={onRemoveField}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <div className="grid grid-cols-1 gap-2 border-t border-border px-3 py-3 sm:grid-cols-2">
            <Select
              value={fieldTypeToAdd}
              onChange={(event) => setFieldTypeToAdd(event.target.value)}
              className="app-radius w-full min-w-0 py-2.5 text-sm"
            >
              {SECTION_QUESTION_FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            <ActionButton
              type="button"
              pending={addingField}
              onClick={() => void addFieldToSection()}
              className="w-full justify-center app-btn-primary px-3 py-2.5 text-sm"
            >
              Add field
            </ActionButton>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FieldSettings({
  field,
  teamId,
  clientId,
  formId,
  linkedBranchValues,
  onSectionCreated,
}: {
  field: BuilderField;
  teamId: string;
  clientId: string;
  formId: string;
  linkedBranchValues?: ReadonlySet<string>;
  onSectionCreated?: (sectionId: string, branchValue: string) => void;
}) {
  const { updateField, addSection } = useBuilderActions();
  const labelRef = useRef<HTMLInputElement>(null);
  const plugin = getFieldType(field.type);
  const [options, setOptions] = useState(() => {
    const parsed = getChoiceList(field.options);
    if (parsed.length > 0) return parsed;
    if (field.type === "RESOURCE_RATING") return ["Name 1"];
    if (fieldNeedsOptions(field.type)) return ["Option 1"];
    return [];
  });
  const [creatingOption, setCreatingOption] = useState<string | null>(null);

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
  const isBranchingField = field.type === "BRANCHING_DROPDOWN";

  async function createSectionForOption(option: string) {
    if (!addSection || !updateField) return;
    const trimmed = option.trim();
    if (!trimmed) return;
    setCreatingOption(trimmed);

    const saveData = new FormData();
    saveData.set("teamId", teamId);
    saveData.set("clientId", clientId);
    saveData.set("formId", formId);
    saveData.set("fieldId", field.id);
    saveData.set("label", labelRef.current?.value?.trim() || field.label);
    saveData.set("description", field.description ?? "");
    saveData.set("required", field.required ? "true" : "false");
    saveData.set("optionsText", options.join("\n"));

    const saved = await notifyAction(updateField, saveData);
    if (saved.error) {
      setCreatingOption(null);
      return;
    }

    const sectionData = new FormData();
    sectionData.set("teamId", teamId);
    sectionData.set("clientId", clientId);
    sectionData.set("formId", formId);
    sectionData.set("branchValue", trimmed);
    const created = await notifyAction(addSection, sectionData, "Section added.");
    setCreatingOption(null);
    if (created.sectionId) onSectionCreated?.(created.sectionId, trimmed);
  }

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
          className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Help text
        <textarea
          name="description"
          defaultValue={field.description ?? ""}
          maxLength={500}
          rows={2}
          placeholder="Optional hint shown below the question"
          className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      {field.type === "RATING" ? (
        <FieldView field={{ ...field, options }} mode="live" />
      ) : null}
      {field.type === "RESOURCE_RATING" ? (
        <ResourceRatingEditor options={options} onChange={setOptions} />
      ) : null}
      {choiceType ? (
        <ChoiceOptionEditor type={choiceType} options={options} onChange={setOptions} />
      ) : null}
      {isBranchingField ? (
        <div className="grid gap-2">
          <ChoiceOptionEditor
            type="DROPDOWN"
            options={options}
            onChange={setOptions}
            linkedOptions={linkedBranchValues}
            creatingOption={creatingOption}
            onCreateSection={createSectionForOption}
          />
          <FieldView field={{ ...field, options }} mode="live" />
        </div>
      ) : null}
      {plugin?.supportsMaxLength ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Character limit
          <input
            type="number"
            name="maxLength"
            min={1}
            max={5000}
            defaultValue={getMaxLength(field.options) ?? ""}
            placeholder="Optional"
            className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
      ) : null}
      {field.type === "SHORT_TEXT" ||
      field.type === "LONG_TEXT" ||
      field.type === "SUGGESTION" ||
      field.type === "DATE" ||
      field.type === "YES_NO" ? (
        <FieldView field={field} mode="live" />
      ) : null}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="required" defaultChecked={field.required} />
        Required
      </label>
      <PendingButton className="justify-center app-btn-primary px-3 py-2.5 text-sm">
        Save field
      </PendingButton>
    </form>
  );
}

function FormQuestionsCard({
  teamId,
  clientId,
  formId,
  title,
  description,
  thankYouTitle,
  thankYouMessage,
  headerImageUrl,
  isTemplate = false,
}: {
  teamId: string;
  clientId: string;
  formId: string;
  title: string;
  description: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  headerImageUrl?: string | null;
  isTemplate?: boolean;
}) {
  const { updateForm } = useBuilderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState(headerImageUrl);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    setImagePreview(headerImageUrl);
    setRemoveImage(false);
  }, [headerImageUrl]);

  function submitIfChanged(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextTitle = String(data.get("title") ?? "").trim();
    const nextDescription = String(data.get("description") ?? "");
    if (
      nextTitle === title.trim() &&
      nextDescription === (description ?? "") &&
      !removeImage &&
      !(data.get("headerImage") instanceof File && (data.get("headerImage") as File).size > 0)
    ) {
      return;
    }
    form.requestSubmit();
  }

  function pickHeaderImage(file: File | undefined) {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const allowed =
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp");
    if (!allowed) {
      toast("Use a PNG, JPG, or WebP image.", { tone: "error" });
      return;
    }
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        if (removeImage) formData.set("removeHeaderImage", "1");
        await notifyAction(updateForm, formData, "Saved.", { debounceSuccess: true });
        setRemoveImage(false);
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        submitIfChanged(event.currentTarget);
      }}
      className="overflow-hidden app-radius border border-border bg-white shadow-sm"
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="formId" value={formId} />
      <input type="hidden" name="thankYouTitle" value={thankYouTitle ?? ""} />
      <input type="hidden" name="thankYouMessage" value={thankYouMessage ?? ""} />
      {!isTemplate ? (
        <div className="relative border-b border-border bg-white">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt=""
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-36 items-center justify-center bg-white">
              <div className="text-center">
                <ImagePlus className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-2 text-sm text-muted">Add a header image</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/0 opacity-0 transition hover:bg-foreground/30 hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
            >
              {imagePreview ? "Change image" : "Upload image"}
            </button>
            {imagePreview ? (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setRemoveImage(true);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  queueMicrotask(() => formRef.current?.requestSubmit());
                }}
                className="rounded bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
              >
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="headerImage"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => pickHeaderImage(event.currentTarget.files?.[0])}
          />
        </div>
      ) : null}
      <div className="px-5 py-5">
        <input
          name="title"
          required
          defaultValue={title}
          aria-label={isTemplate ? "Template name" : "Form title"}
          placeholder={isTemplate ? "Template name" : "Form title"}
          className="w-full bg-white text-2xl font-semibold tracking-tight outline-none placeholder:text-muted"
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
          className="mt-2 w-full resize-none bg-white text-sm leading-6 text-muted outline-none placeholder:text-muted/80"
        />
      </div>
    </form>
  );
}

function FormResponseCard({
  teamId,
  clientId,
  formId,
  title,
  description,
  thankYouTitle,
  thankYouMessage,
  thankYouImageUrl,
  thankYouBgColor,
}: {
  teamId: string;
  clientId: string;
  formId: string;
  title: string;
  description: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  thankYouImageUrl?: string | null;
  thankYouBgColor?: string | null;
}) {
  const { updateForm } = useBuilderActions();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewTitle, setPreviewTitle] = useState(thankYouTitle ?? "");
  const [previewMessage, setPreviewMessage] = useState(thankYouMessage ?? "");
  const [imagePreview, setImagePreview] = useState(thankYouImageUrl);
  const [removeImage, setRemoveImage] = useState(false);
  const [bgColor, setBgColor] = useState(
    normalizeThankYouBg(thankYouBgColor ?? DEFAULT_THANK_YOU_BG)
  );

  useEffect(() => {
    setPreviewTitle(thankYouTitle ?? "");
    setPreviewMessage(thankYouMessage ?? "");
    setImagePreview(thankYouImageUrl);
    setRemoveImage(false);
    setBgColor(normalizeThankYouBg(thankYouBgColor ?? DEFAULT_THANK_YOU_BG));
  }, [thankYouTitle, thankYouMessage, thankYouImageUrl, thankYouBgColor]);

  function pickThankYouImage(file: File | undefined) {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    const allowed =
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp");
    if (!allowed) {
      toast("Use a PNG, JPG, or WebP image.", { tone: "error" });
      return;
    }
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
    queueMicrotask(() => formRef.current?.requestSubmit());
  }

  function submitIfChanged(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextThankYouTitle = String(data.get("thankYouTitle") ?? "");
    const nextThankYouMessage = String(data.get("thankYouMessage") ?? "");
    const nextBg = normalizeThankYouBg(String(data.get("thankYouBgColor") ?? ""));
    if (
      nextThankYouTitle === (thankYouTitle ?? "") &&
      nextThankYouMessage === (thankYouMessage ?? "") &&
      nextBg === normalizeThankYouBg(thankYouBgColor ?? DEFAULT_THANK_YOU_BG) &&
      !removeImage &&
      !(data.get("thankYouImage") instanceof File && (data.get("thankYouImage") as File).size > 0)
    ) {
      return;
    }
    form.requestSubmit();
  }

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={async (formData) => {
          if (removeImage) formData.set("removeThankYouImage", "1");
          await notifyAction(updateForm, formData, "Saved.", { debounceSuccess: true });
          setRemoveImage(false);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          submitIfChanged(event.currentTarget);
        }}
        className="overflow-hidden app-radius border border-border bg-white shadow-sm"
      >
        <input type="hidden" name="teamId" value={teamId} />
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="formId" value={formId} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description ?? ""} />
        <input type="hidden" name="thankYouBgColor" value={bgColor} />

        <div className="relative border-b border-border bg-white">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt=""
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-36 items-center justify-center bg-white">
              <div className="text-center">
                <ImagePlus className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-2 text-sm text-muted">Add a thank-you banner</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/0 opacity-0 transition hover:bg-foreground/30 hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
            >
              {imagePreview ? "Change image" : "Upload image"}
            </button>
            {imagePreview ? (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setRemoveImage(true);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  queueMicrotask(() => formRef.current?.requestSubmit());
                }}
                className="rounded bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
              >
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="thankYouImage"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => pickThankYouImage(event.currentTarget.files?.[0])}
          />
        </div>

        <div className="px-5 py-5">
          <p className="text-lg font-semibold tracking-tight">Thank-you page</p>
          <p className="mt-1 text-sm text-muted">
            Customize the confirmation clients see once they send feedback.
          </p>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Background color</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {THANK_YOU_BG_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => {
                    setBgColor(preset.value);
                    queueMicrotask(() => formRef.current?.requestSubmit());
                  }}
                  className={cn(
                    "h-9 w-9 rounded-md border-2 transition",
                    bgColor === preset.value
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-border hover:border-accent/50"
                  )}
                  style={{ backgroundColor: preset.value }}
                  aria-label={preset.label}
                />
              ))}
              <label
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2 text-xs font-medium text-muted transition hover:border-accent/50",
                  !THANK_YOU_BG_PRESETS.some((preset) => preset.value === bgColor)
                    ? "border-accent ring-2 ring-accent/20"
                    : "border-border"
                )}
              >
                <input
                  type="color"
                  value={bgColor}
                  onChange={(event) => {
                    setBgColor(normalizeThankYouBg(event.target.value));
                    queueMicrotask(() => formRef.current?.requestSubmit());
                  }}
                  className="h-6 w-6 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  aria-label="Pick a color"
                />
                More
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">
              Default is white. Use presets or More to choose any background.
            </p>
          </fieldset>
          <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium">
            Thank-you title
            <input
              name="thankYouTitle"
              defaultValue={thankYouTitle ?? ""}
              maxLength={120}
              placeholder="Thank you"
              onChange={(event) => setPreviewTitle(event.target.value)}
              className="app-radius border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium">
            Thank-you message
            <textarea
              name="thankYouMessage"
              defaultValue={thankYouMessage ?? ""}
              maxLength={1000}
              rows={3}
              placeholder="Your feedback was sent. This link cannot be used again."
              onChange={(event) => setPreviewMessage(event.target.value)}
              className="w-full resize-none app-radius border border-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-accent"
            />
          </label>
        </div>
      </form>

      <div
        className="app-radius border border-border/40 p-6"
        style={{ backgroundColor: bgColor }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Preview
        </p>
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt=""
            className="mt-3 h-32 w-full rounded-lg object-cover"
          />
        ) : null}
        <h3 className="mt-3 text-xl font-semibold">
          {previewTitle.trim() || "Thank you"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          {previewMessage.trim() ||
            "Your feedback was sent. This link cannot be used again."}
        </p>
      </div>
    </div>
  );
}

export function FormBuilder({
  teamId,
  clientId,
  formId,
  title,
  description,
  thankYouTitle = null,
  thankYouMessage = null,
  headerImageUrl = null,
  thankYouImageUrl = null,
  thankYouBgColor = null,
  status,
  hasResponse = false,
  publicFormUrl,
  focusFieldId,
  sections = [],
  fields,
  backHref = "/dashboard/forms",
  variant = "form",
  templates = [],
  clients = [],
  sourceTemplateId = null,
}: FormBuilderProps) {
  const router = useRouter();
  const isTemplate = variant === "template";
  const actions: BuilderActions = isTemplate
    ? {
        addField: templateActions.addField,
        deleteField: templateActions.deleteField,
        reorderFields: templateActions.reorderFields,
        togglePublishForm: templateActions.togglePublishForm,
        updateField: templateActions.updateField,
        updateForm: templateActions.updateForm,
        saveAsTemplate: templateActions.saveAsTemplate,
      }
    : formActions;
  const [preview, setPreview] = useState(false);
  const [builderTab, setBuilderTab] = useState<"questions" | "thankyou">("questions");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [items, setItems] = useState(fields);
  const [sectionBlocks, setSectionBlocks] = useState(sections);
  const [selectedId, setSelectedId] = useState<string | null>(
    focusFieldId ?? fields[0]?.id ?? null
  );
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);
  const [integrateTeamClient, setIntegrateTeamClient] = useState("");
  const [integrateOpen, setIntegrateOpen] = useState(false);
  const [integrateSuccessOpen, setIntegrateSuccessOpen] = useState(false);
  const isPublished = status === "PUBLISHED";
  const needsClient = !isTemplate && !clientId;
  const canPublish = !needsClient && (isPublished || items.length > 0);

  // Sync builder cards after server actions add, save, or reorder fields.
  /* eslint-disable react-hooks/set-state-in-effect -- props to local drag state */
  useEffect(() => {
    setItems(fields);
    setSectionBlocks(sections);
    if (focusFieldId) setSelectedId(focusFieldId);
  }, [fields, focusFieldId, sections]);

  useEffect(() => {
    if (!scrollToSectionId) return;
    if (!sectionBlocks.some((section) => section.id === scrollToSectionId)) return;
    const node = document.querySelector(`[data-section-id="${scrollToSectionId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setScrollToSectionId(null);
  }, [scrollToSectionId, sectionBlocks]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const globalFields = useMemo(
    () => items.filter((item) => !item.sectionId).sort((a, b) => a.order - b.order),
    [items]
  );
  const branchingField = useMemo(
    () => globalFields.find((field) => field.type === "BRANCHING_DROPDOWN"),
    [globalFields]
  );
  const linkedBranchValues = useMemo(() => {
    const values = sectionBlocks
      .map((section) => section.branchValue)
      .filter((value): value is string => Boolean(value));
    return new Set(values);
  }, [sectionBlocks]);
  const sidebarFieldTypes = useMemo(
    () =>
      ADDABLE_FIELD_TYPES.filter(
        (type) => type.value !== "BRANCHING_DROPDOWN" || !branchingField
      ),
    [branchingField]
  );
  const globalIds = useMemo(() => globalFields.map((item) => item.id), [globalFields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function removeFieldFromList(fieldId: string) {
    setItems((current) => current.filter((item) => item.id !== fieldId));
    setSelectedId((current) => (current === fieldId ? null : current));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = globalFields.findIndex((item) => item.id === active.id);
    const newIndex = globalFields.findIndex((item) => item.id === over.id);
    const previous = items;
    const reorderedGlobals = arrayMove(globalFields, oldIndex, newIndex);
    const sectionItems = items.filter((item) => item.sectionId);
    setItems([...reorderedGlobals, ...sectionItems]);

    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", formId);
    formData.set(
      "orderedIds",
      JSON.stringify([...reorderedGlobals, ...sectionItems].map((item) => item.id))
    );
    // Fire immediately (no transition delay) so errors toast faster.
    void (async () => {
      const result = await actions.reorderFields(formData);
      if (result.error) {
        setItems(previous);
        toast(result.error, { tone: "error" });
        return;
      }
      router.refresh();
    })();
  }

  return (
    <BuilderActionsContext.Provider value={actions}>
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-2 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:gap-3">
        <div className="flex w-full min-w-0 items-center justify-between gap-2 md:contents">
          <div className="flex min-w-0 items-center gap-2 md:contents">
            <button
              type="button"
              onClick={() => {
                // Soft navigations don't update document.referrer, so trust history.
                // Fallback is the forms list (not the linked client page).
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push(backHref);
              }}
              aria-label="Back"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 app-radius bg-accent text-white transition hover:bg-accent-hover md:w-auto md:border md:border-border md:bg-surface md:px-3 md:text-foreground md:hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
              <span className="hidden text-sm font-medium md:inline">Back</span>
            </button>
            <span
              className={cn(
                "min-w-0 truncate px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                isTemplate
                  ? "bg-zinc-100 text-zinc-600"
                  : hasResponse
                    ? "bg-sky-100 text-sky-800"
                    : isPublished
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-600"
              )}
            >
              {isTemplate
                ? "Template"
                : hasResponse
                  ? "Submitted"
                  : isPublished
                    ? "Published"
                    : "Draft"}
            </span>
          </div>
          <div className="flex flex-nowrap items-center gap-1.5 md:ml-auto">
          {needsClient ? (
            <Tooltip
              label="Integrate with a client — link before publishing and collecting responses."
              side="bottom"
            >
              <button
                type="button"
                onClick={() => setIntegrateOpen(true)}
                aria-label="Integrate with client"
                className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius border border-border bg-surface transition hover:bg-background lg:w-auto lg:px-3"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium">Integrate</span>
              </button>
            </Tooltip>
          ) : null}
          {isTemplate ? null : actions.duplicateForm ? (
            <Tooltip label="Duplicate form" side="bottom">
              <form
                action={async (formData) => {
                  const duplicateForm = actions.duplicateForm;
                  if (!duplicateForm) return;
                  formData.set("teamId", teamId);
                  formData.set("clientId", clientId);
                  formData.set("formId", formId);
                  const result = await notifyAction(
                    duplicateForm,
                    formData,
                    "Form duplicated."
                  );
                  if (result.formId) {
                    router.push(`/dashboard/forms/${result.formId}`);
                  }
                }}
              >
                <PendingButton
                  aria-label="Duplicate form"
                  className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius border border-border bg-surface transition hover:bg-background lg:w-auto lg:px-3"
                >
                  <Copy className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline text-sm font-medium">Duplicate form</span>
                </PendingButton>
              </form>
            </Tooltip>
          ) : null}
          {isTemplate ? null : (
            <Tooltip label="Save as template" side="bottom">
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                disabled={items.length === 0}
                aria-label="Save as template"
                className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius border border-border bg-surface transition hover:bg-background disabled:opacity-50 lg:w-auto lg:px-3"
              >
                <Bookmark className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium">Save as template</span>
              </button>
            </Tooltip>
          )}
          <Tooltip label={preview ? "Edit form" : "Preview form"} side="bottom">
            <button
              type="button"
              onClick={() => setPreview((value) => !value)}
              aria-label={preview ? "Edit form" : "Preview form"}
              className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius border border-border bg-surface transition hover:bg-background lg:w-auto lg:px-3"
            >
              {preview ? <Pencil className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
              <span className="hidden lg:inline text-sm font-medium">
                {preview ? "Edit" : "Preview"}
              </span>
            </button>
          </Tooltip>
          {isTemplate ? null : (
          <form
            action={async (formData) => {
              await notifyAction(
                actions.togglePublishForm,
                formData,
                isPublished ? "Form unpublished." : "Form published."
              );
              router.refresh();
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
              <Tooltip label={isPublished ? "Unpublish" : "Publish"} side="bottom">
                <PendingButton
                  aria-label={isPublished ? "Unpublish" : "Publish"}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius lg:w-auto lg:px-3",
                    isPublished
                      ? "border border-border bg-surface transition hover:bg-background"
                      : "app-brand-surface"
                  )}
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline text-sm font-medium">
                    {isPublished ? "Unpublish" : "Publish"}
                  </span>
                </PendingButton>
              </Tooltip>
            ) : (
              <Tooltip
                label={
                  needsClient
                    ? "Integrate with a client before publishing"
                    : "Add at least one field to publish"
                }
                side="bottom"
              >
                <span>
                  <PendingButton
                    disabled
                    aria-label="Publish"
                    className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-btn-primary lg:w-auto lg:px-3"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline text-sm font-medium">Publish</span>
                  </PendingButton>
                </span>
              </Tooltip>
            )}
          </form>
          )}
          {!isTemplate && isPublished ? (
            <Tooltip label="Open form" side="bottom">
              <a
                href={publicFormUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open form"
                className="inline-flex h-10 w-10 items-center justify-center gap-1.5 app-radius border border-border bg-surface transition hover:bg-background lg:w-auto lg:px-3"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium">Open form</span>
              </a>
            </Tooltip>
          ) : null}
          </div>
        </div>
      </header>
      {hasResponse && !isTemplate ? (
        <p className="border-b border-border bg-sage/10 px-4 py-2 text-xs leading-5 text-muted sm:text-sm">
          This public link already has a response and cannot be submitted again.
          Save this form as a template, then create a new form from the library for next month.
        </p>
      ) : null}

      {preview ? (
        <div className="flex-1 overflow-auto px-4 py-8">
          <div className="mx-auto flex max-w-2xl flex-col">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-sage">
              Client preview — stepped survey
            </p>
            <SurveyFlow
              token="preview"
              title={title}
              description={description}
              headerImageUrl={headerImageUrl}
              previewMode
              sections={sectionBlocks.map((section) => ({
                id: section.id,
                title: section.title,
                description: section.description,
                order: section.order,
                branchValue: section.branchValue,
                logic: section.logic,
              }))}
              questions={items.map((field) => ({
                id: field.id,
                type: field.type,
                label: field.label,
                description: field.description,
                required: field.required,
                options: field.options,
                sectionId: field.sectionId,
                order: field.order,
              }))}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="border-b border-border bg-card px-4 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setPaletteOpen((open) => !open)}
              className="inline-flex w-full items-center justify-center gap-1.5 app-radius border border-border bg-surface px-3 py-2.5 text-sm font-medium transition hover:bg-background"
              aria-expanded={paletteOpen}
            >
              <Plus className="h-4 w-4" />
              Add fields
            </button>
          </div>
          <aside
            className={cn(
              "flex-col border-b border-border bg-card lg:h-full lg:max-h-none lg:w-64 lg:shrink-0 lg:overflow-visible lg:border-b-0 lg:border-r",
              paletteOpen
                ? "flex max-h-48 overflow-y-auto lg:max-h-none"
                : "hidden lg:flex"
            )}
          >
            <div className="hidden border-b border-border px-4 py-4 lg:block lg:border-b-0">
              <p className="text-sm font-semibold tracking-tight">Add fields</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Click a field type to add it to the form.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 lg:px-4 lg:py-4">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col">
              {sidebarFieldTypes.map((type) => {
                return (
                  <form
                    action={async (formData) => {
                      const result = await notifyAction(actions.addField, formData, "Field added.");
                      if (result.fieldId) {
                        setSelectedId(result.fieldId);
                        if (builderTab === "thankyou") setBuilderTab("questions");
                      }
                      setPaletteOpen(false);
                    }}
                    key={type.value}
                    className="w-full"
                  >
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="formId" value={formId} />
                    <input type="hidden" name="type" value={type.value} />
                    <PendingButton className="flex w-full items-center gap-2 app-radius px-2.5 py-2 text-left transition duration-150 hover:bg-background lg:gap-3 lg:px-3 lg:py-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-accent">
                        {createElement(fieldIcon(type.value), { className: "h-4 w-4" })}
                      </span>
                      <span className="min-w-0 flex-1">
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
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-auto bg-background px-4 py-6">
            <div className="mx-auto max-w-2xl">
              {!isTemplate ? (
                <div className="mb-4 flex gap-1 border-b border-border">
                  <button
                    type="button"
                    onClick={() => setBuilderTab("questions")}
                    className={cn(
                      "border-b-2 px-4 py-2.5 text-sm font-medium transition",
                      builderTab === "questions"
                        ? "border-accent text-accent"
                        : "border-transparent text-muted hover:text-foreground"
                    )}
                  >
                    Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderTab("thankyou")}
                    className={cn(
                      "border-b-2 px-4 py-2.5 text-sm font-medium transition",
                      builderTab === "thankyou"
                        ? "border-accent text-accent"
                        : "border-transparent text-muted hover:text-foreground"
                    )}
                  >
                    Thank-you
                  </button>
                </div>
              ) : null}

              {builderTab === "thankyou" && !isTemplate ? (
                <FormResponseCard
                  teamId={teamId}
                  clientId={clientId}
                  formId={formId}
                  title={title}
                  description={description}
                  thankYouTitle={thankYouTitle}
                  thankYouMessage={thankYouMessage}
                  thankYouImageUrl={thankYouImageUrl}
                  thankYouBgColor={thankYouBgColor}
                />
              ) : (
                <>
              <FormQuestionsCard
                teamId={teamId}
                clientId={clientId}
                formId={formId}
                title={title}
                description={description}
                thankYouTitle={thankYouTitle}
                thankYouMessage={thankYouMessage}
                headerImageUrl={headerImageUrl}
                isTemplate={isTemplate}
              />

              <div className="mt-4 space-y-3">
                {globalFields.length === 0 && sectionBlocks.length === 0 ? (
                <div className="app-radius border-2 border-dashed border-border bg-white px-6 py-16 text-center">
                  <p className="font-semibold">{isTemplate ? "This template is empty" : "This form is empty"}</p>
                  <p className="mt-1 text-sm text-muted">
                    Add a field type from Add fields to get started.
                  </p>
                </div>
              ) : globalFields.length === 0 ? null : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext items={globalIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {globalFields.map((field) => (
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
                          allFields={globalFields}
                          linkedBranchValues={linkedBranchValues}
                          onSectionCreated={(sectionId, branchValue) => {
                            setExpandedSectionId(sectionId);
                            setScrollToSectionId(sectionId);
                            setSectionBlocks((current) => {
                              if (current.some((section) => section.id === sectionId)) {
                                return current;
                              }
                              return [
                                ...current,
                                {
                                  id: sectionId,
                                  title: branchValue,
                                  branchValue,
                                  order: current.length + 1,
                                },
                              ];
                            });
                            if (builderTab === "thankyou") setBuilderTab("questions");
                            router.refresh();
                          }}
                          onDuplicate={(fieldId) => setSelectedId(fieldId)}
                          onRemove={removeFieldFromList}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {sectionBlocks.length > 0 ? (
                <div className="space-y-3">
                  {sectionBlocks.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      fields={items
                        .filter((field) => field.sectionId === section.id)
                        .sort((a, b) => a.order - b.order)}
                      globalFields={globalFields}
                      selectedFieldId={selectedId}
                      onSelectField={setSelectedId}
                      teamId={teamId}
                      clientId={clientId}
                      formId={formId}
                      expanded={expandedSectionId === section.id}
                      onToggle={() =>
                        setExpandedSectionId((current) =>
                          current === section.id ? null : section.id
                        )
                      }
                      onDuplicateField={(fieldId) => setSelectedId(fieldId)}
                      onRemoveField={removeFieldFromList}
                    />
                  ))}
                </div>
              ) : null}
              </div>
                </>
              )}
            </div>
          </main>
        </div>
      )}

      <Modal
        open={integrateOpen}
        onClose={() => setIntegrateOpen(false)}
        labelledBy="integrate-title"
      >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center app-radius bg-sage/15 text-accent">
                <Link2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 id="integrate-title" className="text-lg font-semibold tracking-tight">
                  Integrate with client
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  This form was created independently. Choose a client to link before
                  you publish and collect responses.
                </p>
              </div>
            </div>
            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium">
              Client
              <Select
                value={integrateTeamClient}
                onChange={(event) => setIntegrateTeamClient(event.target.value)}
                className="app-radius py-2.5 pr-10"
                aria-label="Choose client"
              >
                <option value="">Select client…</option>
                {clients.map((client) => (
                  <option key={client.id} value={`${client.teamId}::${client.id}`}>
                    {client.name} · {client.teamName}
                  </option>
                ))}
              </Select>
            </label>
            <form
              className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
              action={async (formData) => {
                const selected = integrateTeamClient;
                const [nextTeamId, nextClientId] = selected.split("::");
                if (!nextTeamId || !nextClientId) {
                  toast("Choose a client.", { tone: "error" });
                  return;
                }
                formData.set("teamId", nextTeamId);
                formData.set("clientId", nextClientId);
                formData.set("formId", formId);
                if (!actions.attachClient) return;
                const result = await actions.attachClient(formData);
                if (result.error) {
                  toast(result.error, { tone: "error" });
                  return;
                }
                setIntegrateOpen(false);
                setIntegrateSuccessOpen(true);
                router.refresh();
              }}
            >
              <button
                type="button"
                onClick={() => setIntegrateOpen(false)}
                className="app-btn-secondary w-full justify-center px-4 py-2 text-sm sm:w-auto"
              >
                Cancel
              </button>
              <PendingButton className="w-full justify-center app-btn-primary px-4 py-2 text-sm sm:w-auto">
                Integrate client
              </PendingButton>
            </form>
      </Modal>

      <Modal
        open={integrateSuccessOpen}
        onClose={() => setIntegrateSuccessOpen(false)}
        labelledBy="integrate-success-title"
        className="text-center"
      >
            <span className="mx-auto grid h-12 w-12 place-items-center app-radius bg-sage/15 text-accent">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 id="integrate-success-title" className="mt-4 text-lg font-semibold tracking-tight">
              Integrated successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Your form is now linked to the client. You can publish from the header when
              you are ready.
            </p>
            <button
              type="button"
              onClick={() => setIntegrateSuccessOpen(false)}
              className="mt-6 app-btn-primary px-4 py-2 text-sm"
            >
              Done
            </button>
      </Modal>

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
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              placeholder="Optional note for your team"
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={() => setTemplateOpen(false)}
              className="app-btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <PendingButton
              className="justify-center app-btn-primary px-4 py-2 text-sm"
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
