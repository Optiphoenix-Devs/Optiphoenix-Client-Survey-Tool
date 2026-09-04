import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-grid relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-end p-4 sm:p-5">
        <div className="pointer-events-auto">
          <ThemeToggle className="rounded-full border border-border bg-card px-3 shadow-sm" />
        </div>
      </div>
      <div className="app-grid-body flex w-full max-w-md flex-col items-center">
        <BrandLogo className="block h-5 w-[120px] text-foreground md:h-[29px] md:w-[180px]" />
        <div className="card-enter mt-8 w-full app-radius border border-border bg-card p-6 pb-5 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
