import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  approveUser,
  createUserResetLink,
  rejectUser,
  unlockUser,
} from "./actions";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lockedUntil: true,
      resetRequestedAt: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <UsersManager
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          lockedUntil: user.lockedUntil?.toISOString() ?? null,
          resetRequested: Boolean(user.resetRequestedAt),
          isSelf: user.id === session.user.id,
          createdAt: user.createdAt.toISOString(),
        }))}
        approveAction={approveUser}
        rejectAction={rejectUser}
        unlockAction={unlockUser}
        resetLinkAction={createUserResetLink}
      />
    </main>
  );
}
