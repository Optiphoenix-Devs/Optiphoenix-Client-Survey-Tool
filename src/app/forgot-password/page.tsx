import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we will take you to set a new password.
      </p>
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
