"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  // Remount on route changes so internal state resets without setState-in-effect.
  return <NavigationProgressInner key={pathname} />;
}

function NavigationProgressInner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target || target.target === "_blank" || target.hasAttribute("download")) {
        return;
      }
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      setActive(true);
    }

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[shimmer_1s_ease-in-out_infinite] bg-accent" />
    </div>
  );
}
