"use client";

import { useEffect } from "react";
import { toast, type ToastTone } from "@/components/ui/toaster";

export function PageFlash({
  title,
  message,
  tone = "error",
}: {
  title?: string;
  message?: string | null;
  tone?: ToastTone;
}) {
  useEffect(() => {
    if (!message) return;
    toast(title ?? message, {
      description: title ? message : undefined,
      tone,
    });
  }, [title, message, tone]);

  return null;
}
