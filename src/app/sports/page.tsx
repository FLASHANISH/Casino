import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { SportsPage } from "@/components/SportsPages";

export default async function SportsRoute() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <SportsPage />
    </Shell>
  );
}
