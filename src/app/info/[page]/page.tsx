import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { InfoPage } from "@/components/InfoPage";

// Info pages are public (FAQ / Terms / Privacy / Responsible Gaming).
export default async function InfoRoute({
  params,
}: {
  params: { page: string };
}) {
  const me = await currentPlayer();
  if (me) {
    return (
      <Shell state={null}>
        <InfoPage page={params.page} />
      </Shell>
    );
  }
  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <main className="mx-auto max-w-7xl px-4 pb-16">
        <InfoPage page={params.page} />
        <p className="mt-8 text-sm text-[var(--dim)]">
          <a href="/" className="gold-text underline">
            Back to log in
          </a>
        </p>
      </main>
    </div>
  );
}
