import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth-security";
import { accessLevelLabel } from "@/lib/teams";
import { InviteJoinForm } from "./invite-join-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const invite = await prisma.teamInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { team: { select: { name: true } } },
  });

  if (!invite) notFound();

  const expired = invite.expiresAt.getTime() < Date.now();
  const unusable = invite.status !== "PENDING" || expired;

  const existingUser = unusable
    ? null
    : await prisma.user.findUnique({
        where: { email: invite.email.toLowerCase() },
        select: { id: true, name: true },
      });

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">Join team</h1>
      {unusable ? (
        <p className="mt-3 text-sm text-muted">
          {expired
            ? "This invite has expired. Ask an admin to send a new invitation."
            : "This invite is no longer valid. Ask an admin if you still need access."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            You&apos;re invited to{" "}
            <span className="font-medium text-foreground">{invite.team.name}</span>
            {" · "}
            {accessLevelLabel(invite.accessLevel)}
          </p>
          <InviteJoinForm
            token={token}
            email={invite.email}
            defaultName={existingUser?.name ?? undefined}
            isExistingUser={Boolean(existingUser)}
          />
        </>
      )}
    </AuthShell>
  );
}
