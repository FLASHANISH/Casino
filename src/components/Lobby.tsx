"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, loadState, type AppState, type Game } from "@/lib/client";
import { CATEGORIES } from "@/lib/catalog";
import { Thumb } from "./GameArt";

function Chip({ amount, color }: { amount: string; color: string }) {
  return (
    <span
      className="chip inline-flex h-11 w-11 items-center justify-center rounded-full border-4 border-dashed border-white/70 text-[11px] font-bold text-white"
      style={{ background: color }}
    >
      {amount}
    </span>
  );
}

function GameCard({
  g,
  d,
  onFav,
}: {
  g: Game;
  d: AppState;
  onFav: (slug: string) => void;
}) {
  const isFav = d.user?.favorites.includes(g.slug) ?? false;
  return (
    <article className="glass overflow-hidden">
      <Link href={`/game/${g.slug}`} className="block w-full text-left">
        <Thumb g={g} />
      </Link>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif leading-tight">{g.name}</h3>
          <button
            type="button"
            onClick={() => onFav(g.slug)}
            aria-label={`${isFav ? "Remove" : "Add"} ${g.name} ${isFav ? "from" : "to"} favorites`}
            aria-pressed={isFav}
            className="text-lg leading-none gold-text"
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
        <p className="mt-0.5 text-xs text-[var(--dim)]">
          {g.category} - RTP {g.rtp}% - {g.plays} plays{g.enabled ? "" : " - Unavailable"}
        </p>
        <Link
          href={`/game/${g.slug}`}
          className={`mt-2 block w-full rounded-lg bg-[var(--accent)] py-1.5 text-center text-sm font-semibold text-black ${
            g.enabled ? "" : "pointer-events-none opacity-40"
          }`}
        >
          Play now
        </Link>
      </div>
    </article>
  );
}

export function Lobby() {
  const [d, setD] = useState<AppState | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadState().then(setD).catch((e) => setError(e.message));
  }, []);

  async function fav(slug: string) {
    try {
      await api("/api/favorite", { slug });
      const next = await loadState();
      setD(next);
    } catch {
      /* session expired — pages guard will redirect */
    }
  }

  if (error) return <p className="mt-10 text-center text-[var(--danger)]">{error}</p>;
  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading Quvanta...</p>;

  const games = d.games.filter(
    (g) =>
      (cat === "All" || g.category === cat) &&
      (q === "" || g.name.toLowerCase().includes(q.toLowerCase())),
  );
  const featured = d.games.filter((g) => g.tag === "Featured");
  const popular = [...d.games].sort((a, b) => b.plays - a.plays).slice(0, 10);
  const news = d.games.filter((g) => g.tag === "New");
  const favGames = d.games.filter((g) => d.user?.favorites.includes(g.slug));

  const section = (title: string, list: Game[]) =>
    list.length > 0 && (
      <section className="mt-8">
        <h2 className="font-serif text-2xl gold-text">{title}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.slice(0, 10).map((g) => (
            <GameCard key={g.slug} g={g} d={d} onFav={fav} />
          ))}
        </div>
      </section>
    );

  return (
    <>
      <section className="glass mt-4 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6">
            <p className="text-xs tracking-[0.3em] text-[var(--dim)]">
              200+ GAMES - SPORTSBOOK - IPL
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">
              Play premium. <span className="gold-text">Win real money.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--dim)]">
              {d.settings["promo_banner"] ||
                "Deposit via UPI or USDT - verified deposits, real money in and out."}{" "}
              Real-money games: deposit first, play, and withdraw your winnings after KYC.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/wallet"
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black"
              >
                Deposit / Withdraw
              </Link>
              <Link
                href="/sports"
                className="rounded-lg border border-[var(--accent)] px-5 py-2.5"
              >
                {d.hasLiveKeys ? "Live sportsbook" : "Sportsbook (demo data)"}
              </Link>
            </div>
            <div className="mt-5 flex gap-2" aria-hidden="true">
              <Chip amount="100" color="#7a1f1f" />
              <Chip amount="500" color="#14532d" />
              <Chip amount="1K" color="#1e3a5f" />
              <Chip amount="5K" color="#3b0764" />
            </div>
          </div>
          <div
            className="relative min-h-44"
            style={{ background: "linear-gradient(135deg,#241a04,#7a5b12 45%,#0b0b12)" }}
          >
            <span className="absolute inset-0 flex items-center justify-center font-serif text-7xl gold-text">
              Q
            </span>
            <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">
              {d.games.filter((g) => g.enabled).length} of {d.totalGames} games available -{" "}
              {d.hasLiveKeys ? "Sports API connected" : "Sports: DEMO data"}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <label className="block text-sm">
          Search games
          <input
            aria-label="Search games"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 200+ games..."
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Game categories">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`rounded-full px-4 py-1.5 text-sm ${
              cat === c ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {q || cat !== "All" ? (
        <section className="mt-6">
          <h2 className="font-serif text-2xl">
            {games.length} game{games.length === 1 ? "" : "s"} found
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(showAll ? games : games.slice(0, 30)).map((g) => (
              <GameCard key={g.slug} g={g} d={d} onFav={fav} />
            ))}
          </div>
          {games.length > 30 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 w-full rounded-lg border border-[var(--accent)] py-2.5"
            >
              Show all {games.length} games
            </button>
          )}
        </section>
      ) : (
        <>
          {section("Featured Games", featured)}
          {section("Popular Right Now", popular)}
          {section("New Releases", news)}
          {d.user && section("Your Favorites", favGames)}
          <section className="mt-8">
            <h2 className="font-serif text-2xl gold-text">Live Sports &amp; Tournaments</h2>
            <p className="mt-1 text-sm text-[var(--dim)]">
              {d.settings["tournament_note"] || ""} -{" "}
              {d.hasLiveKeys ? "Live API mode" : "Demo fixtures, clearly labelled - no fake live scores."}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Link href="/ipl" className="glass p-4 text-left">
                <span className="font-serif text-xl">IPL Dashboard</span>
                <span className="mt-1 block text-sm text-[var(--dim)]">
                  All 10 teams, schedule, points table, Orange &amp; Purple Cap.
                </span>
              </Link>
              <Link href="/worldcup" className="glass p-4 text-left">
                <span className="font-serif text-xl">World Cups</span>
                <span className="mt-1 block text-sm text-[var(--dim)]">
                  Cricket World Cup + FIFA World Cup: groups, fixtures, knockouts.
                </span>
              </Link>
              <Link href="/sports" className="glass p-4 text-left">
                <span className="font-serif text-xl">Full Sportsbook</span>
                <span className="mt-1 block text-sm text-[var(--dim)]">
                  Cricket, Football, Tennis, Basketball, F1, Esports and more.
                </span>
              </Link>
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-serif text-2xl gold-text">Wallet &amp; Rewards</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {[
                ["Real-Money Deposits", "Pay by UPI or USDT, submit your UTR / tx-hash - once verified, your balance credits."],
                ["Refer & Earn Rs 10", "Share your referral code or link - every signup with it credits Rs 10 real money to your wallet (added as 10.00 to your balance)."],
                ["Champions Cup", "Tournament: most wins this week tops the leaderboard."],
              ].map(([h, b]) => (
                <div key={h} className="glass p-4">
                  <h3 className="font-serif text-lg gold-text">{h}</h3>
                  <p className="mt-1 text-sm text-[var(--dim)]">{b}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
