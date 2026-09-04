import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "./forgot-form";
import { AuthShell } from "@/components/auth-shell";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we will take you to set a new password.
      </p>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
