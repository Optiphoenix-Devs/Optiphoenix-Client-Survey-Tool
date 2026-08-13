"use client";

type DeleteClientButtonProps = {
  teamId: string;
  clientId: string;
  clientName: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteClientButton({
  teamId,
  clientId,
  clientName,
  deleteAction,
}: DeleteClientButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Delete client "${clientName}"?\n\nTheir survey links and responses for this team will also be removed.`
        );
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="clientId" value={clientId} />
      <button
        type="submit"
        className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
      >
        Delete
      </button>
    </form>
  );
}
