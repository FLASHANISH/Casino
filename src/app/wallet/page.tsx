import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { WalletPage } from "@/components/WalletPage";

export default async function WalletRoute() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <WalletPage />
    </Shell>
  );
}
