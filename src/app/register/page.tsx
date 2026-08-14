import { RegisterForm } from "./register-form";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your name, email, and password to get started.
      </p>
      <RegisterForm />
    </AuthShell>
  );
}
