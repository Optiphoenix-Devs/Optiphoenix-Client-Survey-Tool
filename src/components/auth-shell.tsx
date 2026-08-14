import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-grid relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4 rounded-full border border-border bg-card px-3" />
      <BrandLogo className="block w-[120px] text-foreground md:w-[180px]" />
      <div className="card-enter mt-8 w-full max-w-md rounded-xl border border-border bg-card p-6 pb-5">
        {children}
      </div>
    </main>
  );
}
