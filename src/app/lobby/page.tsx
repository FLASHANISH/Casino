import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Lobby } from "@/components/Lobby";

export default async function LobbyPage() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <Lobby />
    </Shell>
  );
}
