import { LoginForm } from "./login-form";
import { AuthShell } from "@/components/auth-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">
        Login to your account
      </h1>
      <p className="mt-1 text-sm text-muted">
        Enter your credentials below to login to your account
      </p>
      <LoginForm notice={notice} />
    </AuthShell>
  );
}
