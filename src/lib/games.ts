// Server-side game engines — ported from the hosted build
// (server/src/actions.ts `playGame`). Every round is settled here, on the
// server, with a provably-fair hash. The client only replays the result.

import { randomBytes, createHash } from "crypto";

export function fairHash(seed: string): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 16);
}

export function newRoundHash(game: string, userId: number): string {
  return fairHash(`${Date.now()}-${randomBytes(16).toString("hex")}-${game}-${userId}`);
}

type Card = { rank: number; suit: string; label: string };

function cardName(rank: number, suit: string): string {
  const r =
    rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : String(rank);
  return `${r}${suit}`;
}

function dealCards(n: number): Card[] {
  const suits = ["♠", "♥", "♦", "♣"];
  const used = new Set<string>();
  const out: Card[] = [];
  while (out.length < n) {
    const rank = 2 + Math.floor(Math.random() * 13);
    const suit = suits[Math.floor(Math.random() * 4)] ?? "♠";
    const key = `${rank}-${suit}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push({ rank, suit, label: cardName(rank, suit) });
  }
  return out;
}

function handValue(ranks: number[]): number {
  let total = 0;
  let aces = 0;
  for (const r of ranks) {
    if (r === 14) {
      aces++;
      total += 11;
    } else total += Math.min(r, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function tpScore(cards: Card[]): { score: number; label: string } {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const flush = cards.every((c) => c.suit === (cards[0]?.suit ?? ""));
  const uniq = [...new Set(ranks)];
  const straight = uniq.length === 3 && (uniq[0] ?? 0) - (uniq[2] ?? 0) === 2;
  const trio = uniq.length === 1;
  const pairRank = ranks.find((r, i) => ranks[i + 1] === r);
  const high = ranks[0] ?? 0;
  if (trio) return { score: 600 + high, label: "Trio (Trail)" };
  if (straight && flush) return { score: 500 + high, label: "Pure Sequence" };
  if (straight) return { score: 400 + high, label: "Sequence" };
  if (flush) return { score: 300 + high, label: "Colour / Flush" };
  if (pairRank !== undefined) return { score: 200 + pairRank, label: "Pair" };
  return { score: 100 + high, label: "High Card" };
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

export type PlayInput = {
  engine: string;
  bet: number;
  choice: string;
  target: number;
  count: number;
};

export type PlayOutcome = {
  multiplier: number;
  detail: string;
  reveal: string;
  cards: string[];
  mines: number[];
  picks: number[];
  roll: number;
  bin: number;
  crashPoint: number;
};

export function playRound(input: PlayInput): PlayOutcome {
  const { engine } = input;
  let multiplier = 0;
  let detail = "";
  let reveal = "";
  let cards: string[] = [];
  let minesArr: number[] = [];
  let picksArr: number[] = [];
  let roll = 0;
  let bin = 0;
  let crashPoint = 0;

  if (engine === "crash") {
    const target = Math.min(10, Math.max(1.2, input.target));
    const r = Math.random();
    const crash = Math.min(50, Math.max(1, 0.99 / (1 - r)));
    crashPoint = Math.round(crash * 100) / 100;
    multiplier = crash >= target ? target : 0;
    reveal = `Crashed at ${crash.toFixed(2)}x`;
    detail =
      multiplier > 0
        ? `Cashed out at ${target.toFixed(2)}x before the crash at ${crash.toFixed(2)}x`
        : `Crashed at ${crash.toFixed(2)}x - your ${target.toFixed(2)}x cash-out was too late`;
  } else if (engine === "mines") {
    const mines = Math.min(10, Math.max(1, input.count));
    const picks = Math.min(10, Math.max(1, Math.round(input.target)));
    const mineSet = new Set<number>();
    while (mineSet.size < mines) mineSet.add(Math.floor(Math.random() * 25));
    const pickSet = new Set<number>();
    while (pickSet.size < picks) pickSet.add(Math.floor(Math.random() * 25));
    minesArr = [...mineSet].sort((a, b) => a - b);
    picksArr = [...pickSet].sort((a, b) => a - b);
    const hit = picksArr.some((p) => mineSet.has(p));
    const fairMult = choose(25, picks) / Math.max(1, choose(25 - mines, picks));
    multiplier = hit ? 0 : Math.max(1.05, fairMult * 0.97);
    reveal = `Mines at tiles: ${minesArr.map((n) => n + 1).join(", ")}`;
    detail = hit
      ? `You uncovered ${picks} tiles and hit a mine (${mines} mines on the board)`
      : `Cleared ${picks} safe tiles with ${mines} mines hidden - ${multiplier.toFixed(2)}x`;
  } else if (engine === "dice") {
    const target = Math.min(95, Math.max(5, input.target));
    roll = Math.round(Math.random() * 10000) / 100;
    const under = input.choice !== "over";
    const win = under ? roll < target : roll > target;
    const chance = under ? target : 100 - target;
    multiplier = win ? (99 / chance) * 0.98 : 0;
    reveal = `Rolled ${roll.toFixed(2)}`;
    detail = win
      ? `${roll.toFixed(2)} ${under ? "under" : "over"} ${target} - win`
      : `${roll.toFixed(2)} missed ${under ? "under" : "over"} ${target}`;
  } else if (engine === "slots") {
    const syms = ["7", "BAR", "♦", "♠", "♥", "♣", "★"];
    const pays: Record<string, number> = {
      "7": 20,
      BAR: 10,
      "♦": 8,
      "♠": 5,
      "♥": 4,
      "♣": 3,
      "★": 6,
    };
    const reels = [0, 1, 2].map(
      () => syms[Math.floor(Math.random() * syms.length)] ?? "★",
    );
    cards = reels;
    const [a, b, c] = reels;
    if (a && a === b && b === c) multiplier = pays[a] ?? 3;
    else if (a === b || b === c || a === c) multiplier = 1.4;
    reveal = reels.join("  |  ");
    detail =
      multiplier >= 3
        ? `Three ${a} - jackpot line pays ${multiplier}x`
        : multiplier > 0
          ? "A pair on the reels pays 1.4x"
          : `No matching symbols - ${reveal}`;
  } else if (engine === "teenpatti") {
    const dealt = dealCards(6);
    const player = dealt.slice(0, 3);
    const dealer = dealt.slice(3, 6);
    cards = [...player.map((x) => x.label), ...dealer.map((x) => x.label)];
    const ps = tpScore(player);
    const ds = tpScore(dealer);
    multiplier = ps.score > ds.score ? 1.95 : ps.score === ds.score ? 1 : 0;
    reveal = `You: ${player.map((x) => x.label).join(" ")} (${ps.label}) - Dealer: ${dealer.map((x) => x.label).join(" ")} (${ds.label})`;
    detail =
      multiplier > 1
        ? `Your ${ps.label} beats dealer's ${ds.label}`
        : multiplier === 1
          ? "Tie - bet returned"
          : `Dealer's ${ds.label} beats your ${ps.label}`;
  } else if (engine === "andarbahar") {
    const joker = dealCards(1)[0] ?? { rank: 7, suit: "♠", label: "7♠" };
    cards = [joker.label];
    let dealt = 0;
    let winSide = "Andar";
    const deck = dealCards(30);
    for (let i = 0; i < deck.length; i++) {
      dealt = i + 1;
      const side = i % 2 === 0 ? "Andar" : "Bahar";
      if (i < 8) cards.push(deck[i]?.label ?? "");
      if ((deck[i]?.rank ?? 0) === joker.rank) {
        winSide = side;
        break;
      }
    }
    const pick = input.choice === "bahar" ? "Bahar" : "Andar";
    multiplier = pick === winSide ? (winSide === "Andar" ? 1.9 : 2.0) : 0;
    reveal = `Joker: ${joker.label} - Matched on ${winSide} after ${dealt} cards`;
    detail =
      multiplier > 0
        ? `${winSide} matched the joker rank - your ${pick} bet wins`
        : `Card matched on ${winSide}, you backed ${pick}`;
  } else if (engine === "roulette") {
    const reds = new Set([
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ]);
    const spin = Math.floor(Math.random() * 37);
    roll = spin;
    const color = spin === 0 ? "green" : reds.has(spin) ? "red" : "black";
    const choice = input.choice || "red";
    let win = false;
    let mult = 0;
    if (choice === "red" || choice === "black") {
      win = color === choice;
      mult = 2;
    } else if (choice === "green") {
      win = spin === 0;
      mult = 36;
    } else if (choice === "even") {
      win = spin !== 0 && spin % 2 === 0;
      mult = 2;
    } else if (choice === "odd") {
      win = spin % 2 === 1;
      mult = 2;
    } else {
      const n = parseInt(choice, 10);
      win = spin === n;
      mult = 36;
    }
    multiplier = win ? mult : 0;
    reveal = `Ball landed on ${spin} ${color}`;
    detail = win
      ? `${spin} ${color} - your ${choice} bet pays ${mult}x`
      : `${spin} ${color} - ${choice} misses`;
  } else if (engine === "dragontiger") {
    const [d, t] = dealCards(2);
    cards = [d?.label ?? "", t?.label ?? ""];
    const dr = d?.rank ?? 2;
    const tr = t?.rank ?? 2;
    const winner = dr > tr ? "dragon" : tr > dr ? "tiger" : "tie";
    const pick = input.choice || "dragon";
    multiplier = pick === winner ? (winner === "tie" ? 8 : 1.95) : 0;
    reveal = `Dragon ${d?.label ?? ""} vs Tiger ${t?.label ?? ""}`;
    detail =
      multiplier > 0
        ? `${winner} wins - your pick was right`
        : `${winner} wins - you backed ${pick}`;
  } else if (engine === "blackjack") {
    const dealt = dealCards(10);
    const player = [dealt[0], dealt[1]].filter(Boolean) as Card[];
    const dealer = [dealt[2], dealt[3]].filter(Boolean) as Card[];
    let idx = 4;
    let pv = handValue(player.map((x) => x.rank));
    while (pv < 15 && idx < dealt.length) {
      const c = dealt[idx++];
      if (c) player.push(c);
      pv = handValue(player.map((x) => x.rank));
    }
    let dv = handValue(dealer.map((x) => x.rank));
    while (dv < 17 && idx < dealt.length) {
      const c = dealt[idx++];
      if (c) dealer.push(c);
      dv = handValue(dealer.map((x) => x.rank));
    }
    cards = [
      ...player.map((x) => x.label),
      "|",
      ...dealer.map((x) => x.label),
    ];
    const bj = player.length === 2 && pv === 21;
    if (bj) multiplier = 2.5;
    else if (pv > 21) multiplier = 0;
    else if (dv > 21) multiplier = 2;
    else if (pv > dv) multiplier = 2;
    else if (pv === dv) multiplier = 1;
    reveal = `You: ${player.map((x) => x.label).join(" ")} = ${pv} - Dealer: ${dealer.map((x) => x.label).join(" ")} = ${dv}`;
    detail = bj
      ? "Blackjack! Pays 3:2"
      : pv > 21
        ? `Bust at ${pv}`
        : dv > 21
          ? `Dealer busts at ${dv} - you win`
          : pv > dv
            ? `${pv} beats ${dv}`
            : pv === dv
              ? `Push at ${pv} - bet returned`
              : `Dealer ${dv} beats your ${pv}`;
  } else if (engine === "plinko") {
    const bins = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
    let rights = 0;
    for (let r = 0; r < 8; r++) if (Math.random() < 0.5) rights++;
    bin = rights;
    multiplier = bins[bin] ?? 1;
    reveal = `Ball landed in bin ${bin + 1} of 9`;
    detail = `Plinko bin pays ${multiplier}x`;
  } else {
    throw new Error("Unknown game engine.");
  }

  return {
    multiplier: Math.round(multiplier * 100) / 100,
    detail,
    reveal,
    cards,
    mines: minesArr,
    picks: picksArr,
    roll,
    bin,
    crashPoint,
  };
}
