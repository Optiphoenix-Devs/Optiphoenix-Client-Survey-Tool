import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateAccountForm } from "./create-account-form";
import { AuthShell } from "@/components/auth-shell";

export default async function CreateAccountPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your name, email, and password to get started.
      </p>
      <CreateAccountForm />
    </AuthShell>
  );
}
