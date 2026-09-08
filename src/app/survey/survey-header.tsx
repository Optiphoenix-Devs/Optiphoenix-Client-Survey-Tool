"use client";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SurveyHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <BrandLogo className="block w-[120px] text-foreground md:w-[140px]" />
      <ThemeToggle className="rounded-full border border-border bg-surface px-3" />
    </header>
  );
}
