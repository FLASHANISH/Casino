import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { ProfilePage } from "@/components/ProfilePage";

export default async function ProfileRoute() {
  const me = await currentPlayer();
  if (!me) redirect("/");
  return (
    <Shell state={null}>
      <ProfilePage />
    </Shell>
  );
}
