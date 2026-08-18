import { SummarizeDesignPreview } from "../design-preview";

export const dynamic = "force-dynamic";

export default function SummarizePreviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <SummarizeDesignPreview />
    </main>
  );
}
