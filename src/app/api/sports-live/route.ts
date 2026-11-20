import { fetchLiveOdds, fetchLiveScores } from "@/lib/live";
import { json } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sport = new URL(req.url).searchParams.get("sport") ?? "cricket";
  const [scores, odds] = await Promise.all([
    fetchLiveScores(),
    fetchLiveOdds(sport),
  ]);
  return json({ liveScores: scores.live, matches: scores.matches, liveOdds: odds.live, odds: odds.odds });
}
