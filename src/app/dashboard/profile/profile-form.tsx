"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { runServerAction } from "@/lib/run-server-action";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/action-result";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionButton } from "@/components/ui/pending-button";

export function ProfileForm({
  name,
  email,
  avatarUrl,
  updateAction,
  changePasswordAction,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  changePasswordAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [preview, setPreview] = useState(avatarUrl);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      <form
        className="space-y-4 app-radius border border-border bg-card app-shadow-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            await runServerAction({
              action: updateAction,
              formData,
              successMessage: "Profile saved",
            });
          });
        }}
      >
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-sage/20 text-lg font-semibold text-accent">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Avatar</p>
            <input
              ref={fileInputRef}
              type="file"
              name="avatar"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) {
                  setSelectedFileName(null);
                  return;
                }
                const fileName = file.name.toLowerCase();
                const allowedType =
                  file.type === "image/png" ||
                  file.type === "image/jpeg" ||
                  file.type === "";
                const allowedExt =
                  fileName.endsWith(".png") ||
                  fileName.endsWith(".jpg") ||
                  fileName.endsWith(".jpeg");
                if (!allowedExt || (file.type && !allowedType)) {
                  input.value = "";
                  setSelectedFileName(null);
                  toast("Avatar must be a .png, .jpg, or .jpeg file.", { tone: "error" });
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  input.value = "";
                  setSelectedFileName(null);
                  toast("Avatar must be 2 MB or smaller.", { tone: "error" });
                  return;
                }
                setSelectedFileName(file.name);
                setPreview(URL.createObjectURL(file));
              }}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-hover"
              >
                <ImagePlus className="h-4 w-4 text-accent" />
                Choose image
              </button>
              <span
                className={cn(
                  "inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-medium",
                  selectedFileName
                    ? "border border-sage/30 bg-sage/15 text-accent"
                    : "border border-dashed border-border bg-hover/60 text-muted"
                )}
              >
                {selectedFileName ? (
                  <span className="truncate" title={selectedFileName}>
                    {selectedFileName}
                  </span>
                ) : (
                  "No file chosen"
                )}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">PNG, JPG, or JPEG · max 2 MB</p>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input
            name="name"
            required
            minLength={2}
            defaultValue={name}
            className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <p className="text-sm text-muted">Email: {email}</p>
        <ActionButton
          pending={pending}
          className="app-btn-primary px-4 py-2.5 text-sm"
        >
          Save profile
        </ActionButton>
      </form>

      <form
        className="space-y-4 app-radius border border-border bg-card app-shadow-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          startPasswordTransition(async () => {
            await runServerAction({
              action: changePasswordAction,
              formData,
              successMessage: "Password updated",
              onSuccess: () => form.reset(),
            });
          });
        }}
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight">Change password</h2>
          <p className="mt-1 text-sm text-muted">
            Set a new password for your account (at least 8 characters).
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          New password
          <PasswordInput
            name="newPassword"
            autoComplete="new-password"
            placeholder="Create a strong password"
            showStrength
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Confirm new password
          <PasswordInput
            name="confirmNewPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
          />
        </label>
        <ActionButton
          pending={passwordPending}
          className="app-btn-primary px-4 py-2.5 text-sm"
        >
          Update password
        </ActionButton>
      </form>
    </div>
  );
}
