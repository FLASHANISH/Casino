import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";

// First page = Login / Create Account only. Logged-out visitors see
// nothing else; a logged-in player goes straight to the dashboard.
export default async function HomePage() {
  const me = await currentPlayer();
  if (me) redirect("/lobby");
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--dim)]">Loading Quvanta...</div>}>
      <AuthGate />
    </Suspense>
  );
}
