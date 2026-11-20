import { currentPlayer } from "@/lib/auth";
import { pubUser } from "@/lib/state";
import { json } from "@/lib/api-helpers";

export async function GET() {
  const me = await currentPlayer();
  return json({ user: me ? pubUser(me) : null });
}
