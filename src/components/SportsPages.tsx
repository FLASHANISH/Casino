"use client";

import { useEffect, useState } from "react";
import { api, loadState, type AppState } from "@/lib/client";
import { DEMO_ORANGE, DEMO_POINTS, DEMO_PURPLE, IPL_TEAMS } from "@/lib/catalog";

const SPORTS = [
  "All Sports",
  "Cricket",
  "Football",
  "Tennis",
  "Basketball",
  "Volleyball",
  "Badminton",
  "Hockey",
  "Baseball",
  "Formula 1",
  "Esports",
];

const LEAGUES: Record<string, string[]> = {
  Cricket: [
    "IPL",
    "ICC World Cup",
    "T20 World Cup",
    "Champions Trophy",
    "Asia Cup",
    "Test / ODI / T20I",
    "BBL",
    "PSL",
    "CPL",
    "The Hundred",
  ],
  Football: [
    "FIFA World Cup",
    "Champions League",
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Europa League",
  ],
};

type LiveState = {
  liveScores: boolean;
  matches: { name: string; status: string; team1: string; team2: string; score1?: string; score2?: string; venue?: string }[];
  liveOdds: boolean;
  odds: { sport: string; home: string; away: string; bookmaker: string; homeOdds?: number; awayOdds?: number }[];
};

function DemoBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="rounded-full bg-emerald-900 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
      LIVE
    </span>
  ) : (
    <span className="rounded-full bg-amber-900 px-2 py-0.5 text-[11px] font-bold text-amber-300">
      DEMO
    </span>
  );
}

function useSportsState() {
  const [d, setD] = useState<AppState | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    loadState().then(setD).catch((e) => setErr(e.message));
    fetch("/api/sports-live")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => undefined);
  }, []);
  return { d, live, err };
}

function FixtureCard({
  f,
  d,
  onBet,
}: {
  f: AppState["fixtures"][number];
  d: AppState;
  onBet: (fixtureId: number, team: string, stake: number) => Promise<void>;
}) {
  const [stake, setStake] = useState("10");
  const [pick, setPick] = useState(f.team1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tracking-widest text-[var(--dim)]">
          {f.sport} · {f.league}
        </span>
        <DemoBadge live={!f.isDemo} />
      </div>
      <p className="mt-2 font-serif text-lg">
        {f.team1} vs {f.team2}
      </p>
      <p className="text-xs text-[var(--dim)]">
        {f.venue} · {f.startsAt}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          [f.team1, f.odds1],
          [f.team2, f.odds2],
        ].map(([team, odds]) => (
          <button
            key={String(team)}
            type="button"
            onClick={() => setPick(String(team))}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              pick === team ? "border-[var(--accent)] bg-amber-950/50" : "border-[var(--border)]"
            }`}
          >
            <span className="block">{String(team)}</span>
            <span className="gold-text font-semibold">{String(odds)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          min="1"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="w-24 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-sm"
          aria-label="Stake in USD"
        />
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMsg("");
            try {
              await onBet(f.id, pick, Number(stake) || 0);
              setMsg("Bet placed.");
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Bet failed");
            } finally {
              setBusy(false);
            }
          }}
          className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Place bet — {pick} @ {pick === f.team1 ? f.odds1 : f.odds2}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-[var(--dim)]">{msg}</p>}
      <p className="mt-1 text-[11px] text-[var(--dim)]">
        {f.isDemo
          ? "DEMO fixture — labelled demo until sports API keys are connected. No fake live scores."
          : "Live fixture from the connected sports API."}
      </p>
    </div>
  );
}

export function SportsPage() {
  const { d, live, err } = useSportsState();
  const [sport, setSport] = useState("All Sports");
  const [note, setNote] = useState("");

  async function placeBet(fixtureId: number, team: string, stake: number) {
    await api("/api/sports-bet", { fixtureId, pickTeam: team, stake });
    setNote("Bet placed — see Profile for your open sports bets.");
  }

  if (err) return <p className="mt-10 text-center text-[var(--danger)]">{err}</p>;
  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading sportsbook...</p>;

  const fixtures = d.fixtures.filter(
    (f) => sport === "All Sports" || f.sport === sport,
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">Sportsbook</h1>
        <DemoBadge live={d.hasLiveKeys} />
      </div>
      <p className="mt-1 text-sm text-[var(--dim)]">
        {d.hasLiveKeys
          ? "Live mode — odds and scores come from the connected sports APIs."
          : "DEMO fixtures, clearly labelled — no fake live scores. Connect API keys in Settings to go live."}
      </p>
      {note && (
        <p className="mt-2 text-sm text-[var(--good)]" role="status">
          {note}
        </p>
      )}
      {live?.liveScores && live.matches.length > 0 && (
        <section className="mt-6">
          <h2 className="font-serif text-2xl gold-text">Live Scores</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {live.matches.map((m, i) => (
              <div key={i} className="glass p-4 text-sm">
                <p className="font-semibold">
                  {m.team1} vs {m.team2}
                </p>
                <p className="text-[var(--dim)]">{m.status}</p>
                {m.score1 && <p>{m.team1}: {m.score1}</p>}
                {m.score2 && <p>{m.team2}: {m.score2}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Sports">
        {SPORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSport(s)}
            aria-pressed={sport === s}
            className={`rounded-full px-4 py-1.5 text-sm ${
              sport === s ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fixtures.map((f) => (
          <FixtureCard key={f.id} f={f} d={d} onBet={placeBet} />
        ))}
      </div>
      {fixtures.length === 0 && (
        <p className="mt-6 text-sm text-[var(--dim)]">No fixtures for this sport yet.</p>
      )}
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Leagues</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.entries(LEAGUES).map(([sportName, leagues]) => (
            <div key={sportName} className="glass p-4">
              <h3 className="font-serif text-lg gold-text">{sportName}</h3>
              <p className="mt-1 text-sm text-[var(--dim)]">{leagues.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function IplPage() {
  const { d, live, err } = useSportsState();
  const [note, setNote] = useState("");

  async function placeBet(fixtureId: number, team: string, stake: number) {
    await api("/api/sports-bet", { fixtureId, pickTeam: team, stake });
    setNote("Bet placed — see Profile for your open sports bets.");
  }

  if (err) return <p className="mt-10 text-center text-[var(--danger)]">{err}</p>;
  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading IPL dashboard...</p>;

  const ipl = d.fixtures.filter((f) => f.league === "IPL");

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">IPL Dashboard</h1>
        <DemoBadge live={d.hasLiveKeys} />
      </div>
      <p className="mt-1 text-sm text-[var(--dim)]">
        {d.hasLiveKeys
          ? "Live mode — data from the connected cricket API."
          : "DEMO data, clearly labelled — points table and cap leaders are demo values until a cricket API key is connected."}
      </p>
      {note && (
        <p className="mt-2 text-sm text-[var(--good)]" role="status">
          {note}
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-serif text-2xl gold-text">Teams</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {IPL_TEAMS.map((t) => (
            <div key={t.short} className="glass p-3 text-center">
              <p className="font-serif text-lg">{t.short}</p>
              <p className="text-xs text-[var(--dim)]">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-2xl gold-text">Fixtures &amp; Schedule</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {ipl.map((f) => (
            <FixtureCard key={f.id} f={f} d={d} onBet={placeBet} />
          ))}
        </div>
      </section>

      {live?.liveScores && live.matches.length > 0 && (
        <section className="mt-6">
          <h2 className="font-serif text-2xl gold-text">Live Scores</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {live.matches.map((m, i) => (
              <div key={i} className="glass p-4 text-sm">
                <p className="font-semibold">{m.team1} vs {m.team2}</p>
                <p className="text-[var(--dim)]">{m.status}</p>
                {m.score1 && <p>{m.team1}: {m.score1}</p>}
                {m.score2 && <p>{m.team2}: {m.score2}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="glass p-4 md:col-span-2">
          <h2 className="font-serif text-xl gold-text">Points Table <span className="text-xs text-[var(--dim)]">(DEMO)</span></h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--dim)]">
                <th className="py-1">Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th><th>NRR</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_POINTS.map((r) => (
                <tr key={r.team} className="border-t border-[var(--border)]">
                  <td className="py-1.5">{r.team}</td><td>{r.p}</td><td>{r.w}</td><td>{r.l}</td><td>{r.pts}</td><td>{r.nrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="glass p-4">
            <h2 className="font-serif text-xl gold-text">Orange Cap <span className="text-xs text-[var(--dim)]">(DEMO)</span></h2>
            <ul className="mt-2 space-y-1 text-sm">
              {DEMO_ORANGE.map(([name, runs]) => (
                <li key={name} className="flex justify-between"><span>{name}</span><strong>{runs}</strong></li>
              ))}
            </ul>
          </div>
          <div className="glass p-4">
            <h2 className="font-serif text-xl gold-text">Purple Cap <span className="text-xs text-[var(--dim)]">(DEMO)</span></h2>
            <ul className="mt-2 space-y-1 text-sm">
              {DEMO_PURPLE.map(([name, wkts]) => (
                <li key={name} className="flex justify-between"><span>{name}</span><strong>{wkts}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorldCupPage() {
  const { d, err } = useSportsState();
  const [note, setNote] = useState("");

  async function placeBet(fixtureId: number, team: string, stake: number) {
    await api("/api/sports-bet", { fixtureId, pickTeam: team, stake });
    setNote("Bet placed — see Profile for your open sports bets.");
  }

  if (err) return <p className="mt-10 text-center text-[var(--danger)]">{err}</p>;
  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading World Cup pages...</p>;

  const wc = d.fixtures.filter((f) => f.league.includes("World Cup"));
  const groups = [
    { name: "Cricket World Cup — Group A", teams: ["India", "Australia", "New Zealand", "Sri Lanka"] },
    { name: "Cricket World Cup — Group B", teams: ["England", "Pakistan", "South Africa", "Bangladesh"] },
    { name: "FIFA World Cup — Group A", teams: ["Argentina", "Netherlands", "Japan", "Canada"] },
    { name: "FIFA World Cup — Group B", teams: ["France", "Brazil", "Germany", "Morocco"] },
  ];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">World Cups</h1>
        <DemoBadge live={d.hasLiveKeys} />
      </div>
      <p className="mt-1 text-sm text-[var(--dim)]">
        Cricket World Cup, T20 World Cup and FIFA Football World Cup — fixtures, groups and
        knockouts. {d.hasLiveKeys ? "Live mode." : "DEMO fixtures until API keys are connected."}
      </p>
      {note && (
        <p className="mt-2 text-sm text-[var(--good)]" role="status">
          {note}
        </p>
      )}
      <section className="mt-6">
        <h2 className="font-serif text-2xl gold-text">Fixtures</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {wc.map((f) => (
            <FixtureCard key={f.id} f={f} d={d} onBet={placeBet} />
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-2xl gold-text">Groups</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.name} className="glass p-4">
              <h3 className="font-serif text-lg">{g.name}</h3>
              <p className="mt-1 text-sm text-[var(--dim)]">{g.teams.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-2xl gold-text">Knockout Stages</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {["Quarter-finals", "Semi-finals", "Final"].map((stage) => (
            <div key={stage} className="glass p-4">
              <h3 className="font-serif text-lg">{stage}</h3>
              <p className="mt-1 text-sm text-[var(--dim)]">
                Fixtures appear here once the group stage is decided — live data replaces demo
                fixtures when API keys are connected.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
