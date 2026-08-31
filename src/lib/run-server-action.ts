import type { ActionResult } from "@/lib/action-result";
import { toast } from "@/components/ui/toaster";

type RunServerActionOptions = {
  action: (formData: FormData) => Promise<ActionResult>;
  formData: FormData;
  successMessage: string;
  onSuccess?: (result: ActionResult) => void | Promise<void>;
  refresh?: () => void;
};

export async function runServerAction({
  action,
  formData,
  successMessage,
  onSuccess,
  refresh,
}: RunServerActionOptions): Promise<ActionResult> {
  const result = await action(formData);
  if (result.error) {
    toast(result.error, { tone: "error" });
    return result;
  }

  toast(successMessage, { tone: "success" });
  await onSuccess?.(result);
  refresh?.();
  return result;
}
