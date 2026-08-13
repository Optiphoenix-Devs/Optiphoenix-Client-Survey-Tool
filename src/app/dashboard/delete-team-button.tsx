"use client";

type DeleteTeamButtonProps = {
  teamName: string;
  teamId: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteTeamButton({
  teamName,
  teamId,
  deleteAction,
}: DeleteTeamButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Delete team "${teamName}"?\n\nThis also removes its clients, forms, and related data.`
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <button
        type="submit"
        className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
      >
        Delete
      </button>
    </form>
  );
}
