import { currentPlayer } from "@/lib/auth";
import { getState } from "@/lib/state";
import { json } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await currentPlayer();
  const state = await getState(me);
  return json(state);
}
