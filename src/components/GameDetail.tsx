"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, credits, loadState, type AppState, type Game } from "@/lib/client";
import { Thumb } from "./GameArt";

type PlayResult = {
  win: boolean;
  payout: number;
  profit: number;
  multiplier: number;
  balance: number;
  detail: string;
  reveal: string;
  fairHash: string;
  cards: string[];
  mines: number[];
  picks: number[];
  roll: number;
  bin: number;
  crashPoint: number;
};

function PlayingCard({ label, delay }: { label: string; delay: number }) {
  const red = label.includes("♥") || label.includes("♦");
  return (
    <span
      className="playing-card deal-in inline-flex h-20 w-14 flex-col items-center justify-center font-serif"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`text-2xl leading-none ${red ? "text-red-700" : "text-neutral-900"}`}>
        {label.slice(0, -1)}
      </span>
      <span className={`text-xl ${red ? "text-red-700" : "text-neutral-900"}`}>
        {label.slice(-1)}
      </span>
    </span>
  );
}

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

function GameStage({
  engine,
  result,
  pending,
  target,
}: {
  engine: string;
  result: PlayResult | null;
  pending: boolean;
  target: number;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!pending && !result) return;
    const id = setInterval(() => setTick((x) => x + 1), 90);
    const stop = setTimeout(() => clearInterval(id), 2600);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [pending, result]);

  if (engine === "crash") {
    const crashPoint = result?.crashPoint ?? 3.5;
    const shown = pending ? Math.min(crashPoint, 1 + tick * 0.09) : result ? crashPoint : 1;
    const pts = Array.from({ length: 24 }, (_, i) => {
      const x = (i / 23) * 100;
      const y = 88 - Math.min(80, (Math.pow(1 + (shown - 1) * (i / 23), 1.6) - 1) * 26);
      return `${x},${y}`;
    }).join(" ");
    const busted = !!result && !pending && result.multiplier === 0;
    return (
      <div className="rounded-lg bg-black/60 p-4">
        <p className={`text-center font-serif text-5xl ${busted ? "text-[var(--danger)]" : "gold-text"}`}>
          {shown.toFixed(2)}x
        </p>
        <svg viewBox="0 0 100 92" className="mt-2 h-36 w-full">
          <polyline points={pts} fill="none" stroke={busted ? "#e07a7a" : "#f0d47a"} strokeWidth="2" />
          {busted && (
            <text x="62" y="30" fill="#e07a7a" fontSize="9" fontWeight="bold">
              BUST
            </text>
          )}
        </svg>
        <p className="text-center text-xs text-[var(--dim)]">
          {result
            ? busted
              ? `Crashed at ${crashPoint.toFixed(2)}x - cash-out at ${target}x missed`
              : `Cashed out at ${target}x before the ${crashPoint.toFixed(2)}x crash`
            : "The multiplier climbs - cash out before it bursts."}
        </p>
      </div>
    );
  }
  if (engine === "mines") {
    return (
      <div className="mx-auto grid max-w-sm grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => {
          const isMine = result?.mines.includes(i);
          const isPick = result?.picks.includes(i);
          const show = !!result && !pending && (isMine || isPick);
          return (
            <span
              key={i}
              className={`pop-in flex h-12 items-center justify-center rounded-lg border text-xl ${
                show
                  ? isMine
                    ? "border-red-500 bg-red-950"
                    : "border-emerald-500 bg-emerald-950"
                  : "border-[var(--border)] bg-white/5"
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {show ? (isMine ? "💣" : "💎") : "◆"}
            </span>
          );
        })}
      </div>
    );
  }
  if (engine === "slots") {
    const syms = ["7", "BAR", "♦", "♠", "♥", "♣", "★"];
    const reels =
      result && !pending
        ? result.cards
        : [syms[tick % 7] ?? "7", syms[(tick + 3) % 7] ?? "BAR", syms[(tick + 5) % 7] ?? "★"];
    return (
      <div className="flex items-stretch justify-center gap-3">
        {reels.map((s, i) => (
          <span
            key={i}
            className="pop-in flex h-24 w-20 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-black/70 font-serif text-3xl gold-text sm:w-24"
            style={{ animationDelay: `${i * 160}ms` }}
          >
            {s}
          </span>
        ))}
      </div>
    );
  }
  if (engine === "dice") {
    const shown = pending || !result ? tick * 37 % 100 : result.roll;
    return (
      <div className="text-center">
        <span className="pop-in inline-flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[var(--accent)] bg-black/70 font-serif text-4xl gold-text">
          {result && !pending ? result.roll.toFixed(0) : shown}
        </span>
        <p className="mt-2 text-sm text-[var(--dim)]">
          {result && !pending ? `Rolled ${result.roll.toFixed(2)}` : "Rolling..."}
        </p>
      </div>
    );
  }
  if (engine === "roulette") {
    const reds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    return (
      <div className="flex flex-col items-center">
        <div
          className={`relative h-44 w-44 rounded-full border-4 border-[var(--accent)] ${pending ? "wheel-spin" : ""}`}
          style={{
            background:
              "conic-gradient(#14532d 0deg 10deg, #7a1f1f 10deg 20deg, #111 20deg 30deg, #7a1f1f 30deg 40deg, #111 40deg 50deg, #7a1f1f 50deg 60deg, #111 60deg 70deg, #7a1f1f 70deg 80deg, #111 80deg 90deg, #7a1f1f 90deg 100deg, #111 100deg 110deg, #7a1f1f 110deg 120deg, #111 120deg 130deg, #7a1f1f 130deg 140deg, #111 140deg 150deg, #7a1f1f 150deg 160deg, #111 160deg 170deg, #7a1f1f 170deg 180deg, #111 180deg 190deg, #7a1f1f 190deg 200deg, #111 200deg 210deg, #7a1f1f 210deg 220deg, #111 220deg 230deg, #7a1f1f 230deg 240deg, #111 240deg 250deg, #7a1f1f 250deg 260deg, #111 260deg 270deg, #7a1f1f 270deg 280deg, #111 280deg 290deg, #7a1f1f 290deg 300deg, #111 300deg 310deg, #7a1f1f 310deg 320deg, #111 320deg 330deg, #7a1f1f 330deg 340deg, #111 340deg 350deg, #7a1f1f 350deg 360deg)",
          }}
        >
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/85 font-serif text-2xl gold-text">
              {result && !pending ? result.roll : "◉"}
            </span>
          </span>
        </div>
        {result && !pending && (
          <p className="pop-in mt-3 text-sm">
            {result.roll}{" "}
            {result.roll === 0 ? "green" : reds.has(result.roll) ? "red" : "black"}
          </p>
        )}
      </div>
    );
  }
  if (engine === "plinko") {
    const bins = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
    const ballBin =
      result && !pending
        ? result.bin
        : Math.min(8, Math.max(0, 4 + Math.round(Math.sin(tick / 2) * 2)));
    return (
      <div>
        <div className="mx-auto max-w-xs space-y-2 py-2">
          {Array.from({ length: 6 }, (_, r) => (
            <div key={r} className="flex justify-center gap-4">
              {Array.from({ length: r + 3 }, (_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-[var(--accent2)]" />
              ))}
            </div>
          ))}
          <div className="flex justify-center pt-1">
            <span
              className="pop-in h-5 w-5 rounded-full bg-[var(--accent)] shadow-[0_0_14px_rgba(240,212,122,0.8)]"
              style={{ transform: `translateX(${(ballBin - 4) * 18}px)` }}
            />
          </div>
        </div>
        <div className="mx-auto grid max-w-md grid-cols-9 gap-1">
          {bins.map((b, i) => (
            <span
              key={i}
              className={`rounded px-1 py-2 text-center text-[11px] font-bold ${
                result && !pending && result.bin === i
                  ? "bg-[var(--accent)] text-black pop-in"
                  : "bg-white/10 text-[var(--dim)]"
              }`}
            >
              {b}x
            </span>
          ))}
        </div>
      </div>
    );
  }
  // Card engines: teenpatti / blackjack / dragontiger / andarbahar
  const cards = result?.cards ?? [];
  if (engine === "blackjack" && cards.length > 2) {
    const sep = cards.indexOf("|");
    const you = cards.slice(0, sep);
    const dealer = cards.slice(sep + 1);
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs tracking-widest text-[var(--dim)]">DEALER</p>
          <div className="flex gap-2">
            {dealer.map((c, i) => (
              <PlayingCard key={i} label={c} delay={300 + i * 160} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs tracking-widest text-[var(--dim)]">YOUR HAND</p>
          <div className="flex gap-2">
            {you.map((c, i) => (
              <PlayingCard key={i} label={c} delay={i * 160} />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Chip amount="BET" color="#7a1f1f" />
          <Chip amount="3:2" color="#14532d" />
        </div>
      </div>
    );
  }
  if (cards.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--dim)]">
        Set your bet and press Play — the result is decided on the server.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {cards.map((c, i) => (
        <PlayingCard key={i} label={c} delay={i * 160} />
      ))}
    </div>
  );
}

function GameControls({
  engine,
  choice,
  setChoice,
  target,
  setTarget,
  count,
  setCount,
}: {
  engine: string;
  choice: string;
  setChoice: (v: string) => void;
  target: number;
  setTarget: (v: number) => void;
  count: number;
  setCount: (v: number) => void;
}) {
  if (engine === "crash") {
    return (
      <label className="block text-sm">
        Cash-out at multiplier (x)
        <input
          type="number"
          step="0.1"
          min="1.2"
          max="10"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value) || 2)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
        />
        <input
          type="range"
          min="1.2"
          max="10"
          step="0.1"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="mt-2 w-full"
          aria-label="Cash-out multiplier slider"
        />
      </label>
    );
  }
  if (engine === "mines") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Tiles to uncover
          <input
            type="number"
            min="1"
            max="10"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 3)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Mines on board (1-10)
          <input
            type="number"
            min="1"
            max="10"
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 3)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
          />
        </label>
      </div>
    );
  }
  if (engine === "dice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Target (5-95)
          <input
            type="number"
            min="5"
            max="95"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 50)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Roll
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
          >
            <option value="under">Under target</option>
            <option value="over">Over target</option>
          </select>
        </label>
      </div>
    );
  }
  if (engine === "roulette") {
    return (
      <label className="block text-sm">
        Bet on
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
        >
          <option value="red">Red (2x)</option>
          <option value="black">Black (2x)</option>
          <option value="green">Green 0 (36x)</option>
          <option value="even">Even (2x)</option>
          <option value="odd">Odd (2x)</option>
          {Array.from({ length: 37 }, (_, n) => (
            <option key={n} value={String(n)}>
              Number {n} (36x)
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (engine === "dragontiger") {
    return (
      <label className="block text-sm">
        Pick a side
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
        >
          <option value="dragon">Dragon (1.95x)</option>
          <option value="tiger">Tiger (1.95x)</option>
          <option value="tie">Tie (8x)</option>
        </select>
      </label>
    );
  }
  if (engine === "andarbahar") {
    return (
      <label className="block text-sm">
        Pick a side
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
        >
          <option value="andar">Andar (1.9x)</option>
          <option value="bahar">Bahar (2.0x)</option>
        </select>
      </label>
    );
  }
  return null;
}

export function GameDetail({ slug }: { slug: string }) {
  const [d, setD] = useState<AppState | null>(null);
  const [g, setG] = useState<Game | null>(null);
  const [bet, setBet] = useState("10");
  const [choice, setChoice] = useState("");
  const [target, setTarget] = useState(2);
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadState()
      .then((s) => {
        setD(s);
        const game = s.games.find((x) => x.slug === slug);
        if (!game) {
          setNotFound(true);
          return;
        }
        setG(game);
        setChoice(
          game.engine === "roulette"
            ? "red"
            : game.engine === "dragontiger"
              ? "dragon"
              : game.engine === "andarbahar"
                ? "andar"
                : game.engine === "dice"
                  ? "under"
                  : "",
        );
        setTarget(
          game.engine === "crash" ? 2 : game.engine === "dice" ? 50 : game.engine === "mines" ? 3 : 2,
        );
      })
      .catch((e) => setErr(e.message));
  }, [slug]);

  async function play() {
    if (!g) return;
    setErr("");
    setResult(null);
    setPending(true);
    try {
      const r = await api<PlayResult>("/api/play", {
        game: g.slug,
        bet: Number(bet) || 0,
        choice,
        target,
        count,
      });
      setResult(r);
      const next = await loadState();
      setD(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Play failed");
    } finally {
      setPending(false);
    }
  }

  async function fav() {
    if (!g) return;
    await api("/api/favorite", { slug: g.slug });
    const next = await loadState();
    setD(next);
  }

  if (notFound) {
    return (
      <p className="mt-10 text-center text-[var(--dim)]">
        Game not found.{" "}
        <Link href="/lobby" className="gold-text underline">
          Back to lobby
        </Link>
      </p>
    );
  }
  if (!d || !g) {
    return <p className="mt-10 text-center text-[var(--dim)]">Loading game...</p>;
  }

  const isFav = d.user?.favorites.includes(g.slug) ?? false;

  return (
    <section className="mt-4">
      <Link href="/lobby" className="text-sm text-[var(--dim)] underline">
        Back to lobby
      </Link>
      <div className="glass mt-3 overflow-hidden">
        <Thumb g={g} big />
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl">{g.name}</h1>
              <p className="mt-1 text-sm text-[var(--dim)]">
                {g.category} - RTP {g.rtp}% - {g.plays} rounds played - Server-settled, provably fair
              </p>
            </div>
            <button
              type="button"
              onClick={fav}
              aria-pressed={isFav}
              className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm gold-text"
            >
              {isFav ? "★ Favorite" : "☆ Add favorite"}
            </button>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed">{g.description}</p>
          <p className="mt-2 text-xs text-[var(--dim)]">
            How to play: set your bet in real money (USD), choose your options below and press
            Play. The result is decided on the server - the animation below replays exactly what
            the server settled. Balance low? Deposit via UPI or USDT in your Wallet.
          </p>
        </div>
      </div>

      <div className="glass mt-4 p-4">
        <GameStage engine={g.engine} result={result} pending={pending} target={target} />
        {result && !pending && (
          <div
            className={`mt-4 rounded-lg border p-4 pop-in ${
              result.win ? "border-[var(--good)] bg-emerald-950/60" : "border-[var(--border)] bg-black/40"
            }`}
            role="status"
          >
            <p className="font-serif text-2xl">{result.win ? "🏆 " : ""}{result.reveal}</p>
            <p className="mt-1 text-sm">{result.detail}</p>
            <p className="mt-2 text-sm">
              {result.payout > 0 ? (
                <>
                  Payout <strong className="gold-text">{credits(result.payout)}</strong> -{" "}
                </>
              ) : null}
              Profit{" "}
              <strong className={result.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>
                {result.profit >= 0 ? "+" : ""}
                {result.profit.toFixed(2)}
              </strong>
              {result.multiplier > 0 ? <> - {result.multiplier}x</> : null} - Balance{" "}
              {credits(result.balance)}
            </p>
            <p className="mt-1 break-all text-[11px] text-[var(--dim)]">
              Provably-fair hash: {result.fairHash}
            </p>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Bet (real money, USD)
            <input
              aria-label="Bet amount in USD"
              inputMode="decimal"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-lg"
            />
          </label>
          <div className="flex items-end gap-2">
            {[10, 25, 50, 100].map((v) => (
              <button key={v} type="button" onClick={() => setBet(String(v))} className="flex-1" aria-label={`Set bet to ${v} dollars`}>
                <Chip amount={String(v)} color={v === 10 ? "#7a1f1f" : v === 25 ? "#14532d" : v === 50 ? "#1e3a5f" : "#3b0764"} />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <GameControls
            engine={g.engine}
            choice={choice}
            setChoice={setChoice}
            target={target}
            setTarget={setTarget}
            count={count}
            setCount={setCount}
          />
        </div>
        {err && (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {err}
          </p>
        )}
        <button
          type="button"
          disabled={pending || !g.enabled}
          onClick={play}
          className="mt-4 w-full rounded-lg bg-[var(--accent)] py-3 font-serif text-xl tracking-wide text-black disabled:opacity-50"
        >
          {pending ? "Dealing..." : g.enabled ? `Play ${g.name}` : "Temporarily unavailable"}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--dim)]">
          Min ${g.minBet} - Max ${g.maxBet} - No buffering: results settle on the server, animations
          are lightweight CSS/SVG.
        </p>
      </div>

      {d.bets.length > 0 && (
        <>
          <h2 className="mt-8 font-serif text-2xl">Your Recent Rounds</h2>
          <ul className="glass mt-3 divide-y divide-[var(--border)]">
            {d.bets.slice(0, 8).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <strong>{b.game}</strong>{" "}
                  <span className="text-[var(--dim)]">- {b.detail}</span>
                </span>
                <span className={b.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>
                  {b.profit >= 0 ? "+" : ""}
                  {b.profit.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
