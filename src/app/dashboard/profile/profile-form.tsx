"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/action-result";

export function ProfileForm({
  name,
  email,
  avatarUrl,
  updateAction,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  updateAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(avatarUrl);

  return (
    <form
      className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await updateAction(formData);
          if (result.error) {
            toast(result.error, { tone: "error" });
            return;
          }
          toast("Profile updated", { tone: "success" });
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
        <label className="text-sm font-medium">
          Avatar
          <input
            type="file"
            name="avatar"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="mt-1 block text-sm"
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              const name = file.name.toLowerCase();
              const allowedType = file.type === "image/png" || file.type === "image/jpeg" || file.type === "";
              const allowedExt =
                name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg");
              if (!allowedExt || (file.type && !allowedType)) {
                input.value = "";
                toast("Avatar must be a .png, .jpg, or .jpeg file.", { tone: "error" });
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                input.value = "";
                toast("Avatar must be 2 MB or smaller.", { tone: "error" });
                return;
              }
              setPreview(URL.createObjectURL(file));
            }}
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            PNG, JPG, or JPEG · max 2 MB
          </span>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={name}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <p className="text-sm text-muted">Email: {email}</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
