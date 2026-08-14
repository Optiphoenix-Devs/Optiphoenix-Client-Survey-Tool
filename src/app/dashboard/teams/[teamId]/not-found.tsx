import Link from "next/link";

export default function TeamNotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-4 px-6 py-16 text-foreground">
      <h1 className="text-2xl font-semibold">Team not found</h1>
      <p className="text-muted">
        This team does not exist, or you do not have access to it.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
