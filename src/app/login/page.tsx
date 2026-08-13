import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations";

async function login(formData: FormData) {
  "use server";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=Check+your+email+and+password");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=Invalid+email+or+password");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16 text-foreground">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        OptiPhoenix
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        Sign in
      </h1>
      <p className="mt-2 text-base leading-7 text-muted">
        Admins and Team Leads use this page. Clients never log in — they only
        get a survey link.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error.replaceAll("+", " ")}
        </p>
      ) : null}

      <form
        action={login}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Password
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
