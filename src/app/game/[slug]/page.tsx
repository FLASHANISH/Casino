import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { GameDetail } from "@/components/GameDetail";

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <GameDetail slug={params.slug} />
    </Shell>
  );
}
