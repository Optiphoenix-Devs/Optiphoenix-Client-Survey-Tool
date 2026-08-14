"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { completeSignupAction } from "../login/actions";
import { toast } from "@/components/ui/toaster";

type SignupStatus = "PENDING" | "APPROVED" | "REJECTED" | "INVALID" | "EXPIRED";

export function WaitingStatus({ token }: { token: string }) {
  const [status, setStatus] = useState<SignupStatus>(token ? "PENDING" : "INVALID");
  const [pending, startTransition] = useTransition();
  const signingIn = useRef(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function poll() {
      const response = await fetch(`/api/signup-status?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { status?: SignupStatus };
      if (cancelled || !data.status) return;
      if (signingIn.current) return;
      setStatus(data.status);

      if (data.status === "APPROVED" && !signingIn.current) {
        signingIn.current = true;
        startTransition(async () => {
          const result = await completeSignupAction(token);
          if (result.error) {
            signingIn.current = false;
            toast(result.error, { tone: "error" });
          }
        });
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token]);

  if (status === "INVALID" || status === "EXPIRED") {
    return (
      <div className="mt-6 space-y-3 text-sm text-muted">
        <p>This waiting link is invalid or has expired. Create an account again.</p>
        <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
          Back to sign up
        </Link>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="mt-6 space-y-3 text-sm text-muted">
        <p>This account was not approved. Contact an admin if you think that is a mistake.</p>
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="skeleton h-1.5 w-full rounded-full" />
      <p className="text-sm text-muted">
        {pending || status === "APPROVED"
          ? "Approved. Signing you in…"
          : "Please wait. Keep this page open."}
      </p>
    </div>
  );
}
