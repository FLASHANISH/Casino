// Live sports data — only ever fetched when API keys are configured.
// Without keys the caller must show DEMO fixtures. Quvanta never presents
// invented scores as live.

import prisma from "./prisma";

export type LiveMatch = {
  name: string;
  status: string;
  team1: string;
  team2: string;
  score1?: string;
  score2?: string;
  venue?: string;
  date?: string;
};

export type LiveOdds = {
  sport: string;
  home: string;
  away: string;
  bookmaker: string;
  homeOdds?: number;
  awayOdds?: number;
  commenceTime?: string;
};

async function getKey(name: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: name } });
  return row?.value.trim() ?? process.env[name.toUpperCase()] ?? "";
}

export async function fetchLiveScores(): Promise<{
  live: boolean;
  matches: LiveMatch[];
}> {
  const key = await getKey("cricapi_key");
  if (!key) return { live: false, matches: [] };
  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(key)}&offset=0`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { live: false, matches: [] };
    const json = (await res.json()) as {
      data?: {
        name?: string;
        status?: string;
        teams?: string[];
        score?: { r?: number; w?: number; o?: number; inning?: string }[];
        venue?: string;
        dateTimeGMT?: string;
      }[];
    };
    const matches: LiveMatch[] = (json.data ?? []).slice(0, 12).map((m) => ({
      name: m.name ?? "",
      status: m.status ?? "",
      team1: m.teams?.[0] ?? "",
      team2: m.teams?.[1] ?? "",
      score1: m.score?.[0]
        ? `${m.score[0].r}/${m.score[0].w} (${m.score[0].o} ov)`
        : undefined,
      score2: m.score?.[1]
        ? `${m.score[1].r}/${m.score[1].w} (${m.score[1].o} ov)`
        : undefined,
      venue: m.venue,
      date: m.dateTimeGMT,
    }));
    return { live: true, matches };
  } catch {
    return { live: false, matches: [] };
  }
}

export async function fetchLiveOdds(sportKey = "cricket"): Promise<{
  live: boolean;
  odds: LiveOdds[];
}> {
  const key = await getKey("odds_api_key");
  if (!key) return { live: false, odds: [] };
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds/?apiKey=${encodeURIComponent(key)}&regions=uk&markets=h2h&oddsFormat=decimal`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return { live: false, odds: [] };
    const json = (await res.json()) as {
      sport_key?: string;
      home_team?: string;
      away_team?: string;
      commence_time?: string;
      bookmakers?: {
        title?: string;
        markets?: {
          outcomes?: { name?: string; price?: number }[];
        }[];
      }[];
    }[];
    const odds: LiveOdds[] = json.slice(0, 12).map((e) => {
      const bm = e.bookmakers?.[0];
      const outcomes = bm?.markets?.[0]?.outcomes ?? [];
      return {
        sport: e.sport_key ?? sportKey,
        home: e.home_team ?? "",
        away: e.away_team ?? "",
        bookmaker: bm?.title ?? "",
        homeOdds: outcomes.find((o) => o.name === e.home_team)?.price,
        awayOdds: outcomes.find((o) => o.name === e.away_team)?.price,
        commenceTime: e.commence_time,
      };
    });
    return { live: true, odds };
  } catch {
    return { live: false, odds: [] };
  }
}
