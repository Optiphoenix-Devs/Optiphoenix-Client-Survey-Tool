"use client";

import { useEffect, useState } from "react";

export function DashboardGreeting({ name }: { name: string }) {
  const [hello, setHello] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setHello("Good morning");
    else if (hour < 17) setHello("Good afternoon");
    else setHello("Good evening");
  }, []);

  return (
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      {hello}, {name}!
    </h1>
  );
}
