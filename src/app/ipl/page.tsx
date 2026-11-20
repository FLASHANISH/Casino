import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { IplPage } from "@/components/SportsPages";

export default async function IplRoute() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <IplPage />
    </Shell>
  );
}
