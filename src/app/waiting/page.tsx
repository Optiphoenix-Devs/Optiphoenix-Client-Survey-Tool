import { AuthShell } from "@/components/auth-shell";
import { WaitingStatus } from "./waiting-status";

export default async function WaitingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Account created</h1>
      <p className="mt-3 rounded-lg border border-sage/40 bg-sage/10 px-3 py-2.5 text-sm leading-6 text-muted">
        You can only login once the admin approved your account creation
        request. Please wait.
      </p>
      <WaitingStatus token={token ?? ""} />
    </AuthShell>
  );
}
