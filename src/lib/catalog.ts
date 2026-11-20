// Quvanta game catalog — ported from the hosted build (server/src/actions.ts).
// 232 distinct games: 10 playable in-house core engines + 222 catalog
// listings (Slots 80, Table 32, Card 32, Arcade 32, Live Casino 22,
// Sports Mini 24). Every game has its own slug, name, category, engine,
// description and tag. No two listings share a slug.

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type CatalogGame = {
  slug: string;
  name: string;
  category: string;
  engine: string;
  rtp: number;
  description: string;
  tag: string;
  hue: number;
};

type CatDef = {
  category: string;
  engine: string;
  themes: string[];
  kinds: string[];
  blurb: string;
};

const CATALOG: CatDef[] = [
  {
    category: "Slots",
    engine: "slots",
    blurb:
      "reel slot with themed symbols, pair pays and a three-of-a-kind jackpot line",
    themes: [
      "Egyptian Gold", "Fruit Party", "Mega Fortune", "Dragon Pearl",
      "Aztec Temple", "Lucky Sevens", "Diamond Rush", "Pirate Bounty",
      "Neon Nights", "Wild West Gold", "Zeus Thunder", "Candy Kingdom",
      "Samurai Honor", "Viking Voyage", "Jungle King", "Space Odyssey",
      "Mermaid Treasure", "Pharaoh's Tomb", "Buffalo Stampede", "Royal Crown",
    ],
    kinds: ["Classic", "Mega", "Deluxe", "Jackpot"],
  },
  {
    category: "Table Games",
    engine: "blackjack",
    blurb: "table game with real cards, dealer rules and chip betting",
    themes: [
      "Blackjack Pro", "European Roulette", "American Roulette",
      "Baccarat Royale", "Three Card Poker", "Video Poker Deluxe",
      "Sic Bo Supreme", "Dragon Tiger Table", "Casino Hold'em",
      "Roulette Royale", "French Roulette", "Pontoon", "Red Dog",
      "Craps Table", "Mini Baccarat", "Lightning Roulette",
    ],
    kinds: ["Classic", "VIP"],
  },
  {
    category: "Card Games",
    engine: "teenpatti",
    blurb:
      "card game with dealt hands, ranked combinations and head-to-head showdown",
    themes: [
      "Teen Patti Gold", "Andar Bahar Nights", "Rummy Royale",
      "Call Break King", "Solitaire Classic", "Poker Texas Star",
      "Omaha Nights", "Blackjack Switch", "Teen Patti Joker",
      "Muflis Mania", "AK47 Showdown", "Dragon Tiger Cards",
      "Pool Rummy", "Points Rummy", "Deals Rummy", "Hearts Classic",
    ],
    kinds: ["Classic", "Pro"],
  },
  {
    category: "Arcade",
    engine: "crash",
    blurb:
      "fast arcade round with instant rounds, rising multipliers and cash-out timing",
    themes: [
      "Crash X", "Plinko Drop", "Mines Pro", "Dice Roll", "Limbo Line",
      "Wheel Spin", "Tower Climb", "Balloon Pop", "Hi-Lo Rush",
      "Keno Arcade", "Coin Flip", "Goal Rush", "Turbo Crash",
      "Mega Wheel", "Diamond Mines", "Rocket Crash",
    ],
    kinds: ["Classic", "Turbo"],
  },
  {
    category: "Live Casino",
    engine: "roulette",
    blurb:
      "live-style hosted table with a dealer shoe, real cards and streamed-table presentation",
    themes: [
      "Live Roulette VIP", "Live Blackjack Salon", "Live Baccarat Lounge",
      "Live Teen Patti Studio", "Live Dragon Tiger",
      "Live Andar Bahar Studio", "Immersive Roulette",
      "Speed Baccarat Live", "Live Mega Wheel", "Live Poker Room",
      "Live Sic Bo Studio",
    ],
    kinds: ["Live", "VIP Live"],
  },
  {
    category: "Sports Mini Games",
    engine: "dice",
    blurb:
      "sports mini game with quick rounds, animated action and instant results",
    themes: [
      "Virtual Cricket Clash", "Virtual Football League",
      "Penalty Shootout Pro", "Basketball Hoops Rush", "Turbo Racing",
      "Virtual Horse Racing", "Cricket Super Over",
      "Football Penalty Stars", "Derby Racing Gold", "Grand Prix Turbo",
      "Tennis Ace Rush", "Kabaddi Raid Rush",
    ],
    kinds: ["Virtual", "Turbo"],
  },
];

const ENGINE_ROTATE: Record<string, string[]> = {
  Slots: ["slots"],
  "Table Games": ["blackjack", "roulette", "dice", "teenpatti"],
  "Card Games": ["teenpatti", "blackjack", "dragontiger", "andarbahar"],
  Arcade: ["crash", "plinko", "mines", "dice"],
  "Live Casino": ["roulette", "blackjack", "teenpatti", "andarbahar", "dragontiger"],
  "Sports Mini Games": ["dice", "plinko", "crash", "mines"],
};

export function buildCatalog(): CatalogGame[] {
  const out: CatalogGame[] = [];
  CATALOG.forEach((c, ci) => {
    let i = 0;
    for (const theme of c.themes) {
      for (const kind of c.kinds) {
        const name = `${theme} ${kind}`;
        const engines = ENGINE_ROTATE[c.category] ?? ["slots"];
        const engine = engines[i % engines.length] ?? "slots";
        out.push({
          slug: slugify(name),
          name,
          category: c.category,
          engine,
          rtp: 95 + (((i * 7 + ci * 3) % 45) / 10),
          tag: i % 9 === 0 ? "Featured" : i % 7 === 0 ? "Popular" : i % 11 === 0 ? "New" : "",
          hue: (ci * 55 + i * 23) % 360,
          description: `${name} is a ${c.category.toLowerCase()} title on Quvanta: a ${c.blurb}. Played with real money from your Quvanta wallet (USD / USDT).`,
        });
        i++;
      }
    }
  });
  return out;
}

export const CORE_GAMES: CatalogGame[] = [
  { slug: "crash", name: "Crash", category: "Arcade", engine: "crash", rtp: 97, tag: "Featured", hue: 16, description: "The original Crash: watch the multiplier climb on a live chart and cash out before it bursts. Real-money play." },
  { slug: "mines", name: "Mines", category: "Arcade", engine: "mines", rtp: 97, tag: "Popular", hue: 150, description: "A 5x5 minefield. Uncover gems tile by tile, dodge the hidden mines and bank your multiplier. Real-money play." },
  { slug: "dice", name: "Dice", category: "Arcade", engine: "dice", rtp: 98, tag: "Popular", hue: 210, description: "Set your target and roll under or over it. The lower the chance, the bigger the payout. Real-money play." },
  { slug: "slots", name: "Slots Classic 7s", category: "Slots", engine: "slots", rtp: 96, tag: "Featured", hue: 45, description: "Three-reel classic: three 7s pay the 20x jackpot line, pairs pay too. Real-money play." },
  { slug: "teenpatti", name: "Teen Patti", category: "Card Games", engine: "teenpatti", rtp: 97, tag: "Featured", hue: 280, description: "India's favourite three-card showdown against the dealer - trio, pure sequence, pair and high card rankings. Real-money play." },
  { slug: "andarbahar", name: "Andar Bahar", category: "Card Games", engine: "andarbahar", rtp: 97, tag: "", hue: 330, description: "A joker card is drawn, then cards deal alternately to Andar and Bahar until the joker's rank matches. Real-money play." },
  { slug: "roulette", name: "Roulette European", category: "Table Games", engine: "roulette", rtp: 97.3, tag: "Popular", hue: 0, description: "Single-zero European wheel: red/black, even/odd, green zero or a straight number at 36x. Real-money play." },
  { slug: "dragontiger", name: "Dragon Tiger", category: "Card Games", engine: "dragontiger", rtp: 96.7, tag: "", hue: 25, description: "One card for Dragon, one for Tiger - higher card wins, ties pay 8x. Real-money play." },
  { slug: "blackjack", name: "Blackjack", category: "Table Games", engine: "blackjack", rtp: 99, tag: "Featured", hue: 120, description: "Beat the dealer to 21. Blackjack pays 3:2, dealer stands on 17. Real-money play." },
  { slug: "plinko", name: "Plinko", category: "Arcade", engine: "plinko", rtp: 97, tag: "New", hue: 190, description: "Drop the ball through 8 rows of pegs into 9 bins - the edges pay 5.6x. Real-money play." },
];

export function allGames(): CatalogGame[] {
  return [...CORE_GAMES, ...buildCatalog()];
}

export const CATEGORIES = [
  "All",
  "Slots",
  "Table Games",
  "Card Games",
  "Arcade",
  "Live Casino",
  "Sports Mini Games",
] as const;

export type FixtureSeed = {
  team1: string;
  team2: string;
  venue: string;
  startsAt: string;
  odds1: number;
  odds2: number;
  league: string;
  sport: string;
};

// DEMO fixtures — always labelled DEMO in the UI until sports API keys
// are connected. Quvanta never presents invented scores as live.
export const FIXTURES: FixtureSeed[] = [
  { team1: "Mumbai Indians", team2: "Chennai Super Kings", venue: "Wankhede Stadium, Mumbai", startsAt: "Demo fixture - next IPL window", odds1: 1.85, odds2: 1.95, league: "IPL", sport: "Cricket" },
  { team1: "Royal Challengers Bengaluru", team2: "Kolkata Knight Riders", venue: "M. Chinnaswamy Stadium, Bengaluru", startsAt: "Demo fixture - next IPL window", odds1: 1.9, odds2: 1.9, league: "IPL", sport: "Cricket" },
  { team1: "Delhi Capitals", team2: "Sunrisers Hyderabad", venue: "Arun Jaitley Stadium, Delhi", startsAt: "Demo fixture - next IPL window", odds1: 2.0, odds2: 1.8, league: "IPL", sport: "Cricket" },
  { team1: "Rajasthan Royals", team2: "Punjab Kings", venue: "Sawai Mansingh Stadium, Jaipur", startsAt: "Demo fixture - next IPL window", odds1: 1.75, odds2: 2.05, league: "IPL", sport: "Cricket" },
  { team1: "Lucknow Super Giants", team2: "Gujarat Titans", venue: "Ekana Stadium, Lucknow", startsAt: "Demo fixture - next IPL window", odds1: 1.95, odds2: 1.85, league: "IPL", sport: "Cricket" },
  { team1: "India", team2: "Australia", venue: "Demo fixture - ICC World Cup window", startsAt: "Demo fixture - World Cup window", odds1: 1.8, odds2: 2.0, league: "ICC World Cup", sport: "Cricket" },
  { team1: "England", team2: "Pakistan", venue: "Demo fixture - ICC World Cup window", startsAt: "Demo fixture - World Cup window", odds1: 1.9, odds2: 1.9, league: "ICC World Cup", sport: "Cricket" },
  { team1: "Real Madrid", team2: "Manchester City", venue: "Demo fixture - Champions League window", startsAt: "Demo fixture - UCL window", odds1: 2.4, odds2: 2.6, league: "Champions League", sport: "Football" },
  { team1: "Arsenal", team2: "Liverpool", venue: "Demo fixture - Premier League window", startsAt: "Demo fixture - PL window", odds1: 2.2, odds2: 2.9, league: "Premier League", sport: "Football" },
  { team1: "Argentina", team2: "France", venue: "Demo fixture - FIFA World Cup window", startsAt: "Demo fixture - FIFA WC window", odds1: 2.5, odds2: 2.7, league: "FIFA World Cup", sport: "Football" },
];

export const IPL_TEAMS = [
  { name: "Mumbai Indians", short: "MI" },
  { name: "Chennai Super Kings", short: "CSK" },
  { name: "Royal Challengers Bengaluru", short: "RCB" },
  { name: "Kolkata Knight Riders", short: "KKR" },
  { name: "Delhi Capitals", short: "DC" },
  { name: "Sunrisers Hyderabad", short: "SRH" },
  { name: "Rajasthan Royals", short: "RR" },
  { name: "Punjab Kings", short: "PBKS" },
  { name: "Lucknow Super Giants", short: "LSG" },
  { name: "Gujarat Titans", short: "GT" },
];

// Demo standings / cap leaders — labelled DEMO in the UI, replaced by
// live API data when keys are connected.
export const DEMO_POINTS = IPL_TEAMS.map((t, i) => ({
  team: t.name,
  p: 14,
  w: [9, 9, 8, 8, 7, 7, 6, 5, 4, 3][i] ?? 5,
  l: [5, 5, 6, 6, 7, 7, 8, 9, 10, 11][i] ?? 7,
  pts: [18, 18, 16, 16, 14, 14, 12, 10, 8, 6][i] ?? 10,
  nrr: (0.45 - i * 0.11).toFixed(3),
}));
export const DEMO_ORANGE: [string, number][] = [
  ["Demo Batter A (MI)", 612],
  ["Demo Batter B (RCB)", 585],
  ["Demo Batter C (CSK)", 541],
  ["Demo Batter D (KKR)", 498],
  ["Demo Batter E (SRH)", 462],
];
export const DEMO_PURPLE: [string, number][] = [
  ["Demo Bowler A (CSK)", 24],
  ["Demo Bowler B (MI)", 22],
  ["Demo Bowler C (RR)", 21],
  ["Demo Bowler D (DC)", 19],
  ["Demo Bowler E (GT)", 18],
];
