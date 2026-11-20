import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { WorldCupPage } from "@/components/SportsPages";

export default async function WorldCupRoute() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <WorldCupPage />
    </Shell>
  );
}
