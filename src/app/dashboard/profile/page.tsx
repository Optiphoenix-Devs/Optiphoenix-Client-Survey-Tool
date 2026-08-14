import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfile } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatarUrl: true },
  });

  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted">
        Update how your name and avatar appear in the sidebar.
      </p>
      <ProfileForm
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
        updateAction={updateProfile}
      />
    </main>
  );
}
