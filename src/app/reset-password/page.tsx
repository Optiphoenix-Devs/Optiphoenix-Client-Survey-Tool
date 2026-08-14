import { ResetPasswordForm } from "./reset-form";
import { AuthShell } from "@/components/auth-shell";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-muted">
        Choose a new password for your account.
      </p>
      <ResetPasswordForm token={token ?? ""} />
    </AuthShell>
  );
}
