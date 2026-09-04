"use client";

import { useSyncExternalStore } from "react";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ name }: { name: string }) {
  const hello = useSyncExternalStore(
    () => () => {},
    () => greetingForHour(new Date().getHours()),
    () => "Welcome"
  );

  return (
    <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
      {hello}, {name}!
    </h1>
  );
}
