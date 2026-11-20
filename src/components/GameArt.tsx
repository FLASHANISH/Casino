// Unique per-game thumbnail art — ported from the hosted build.
// Every game gets its own generated SVG: the scene matches the engine
// (slot reels, roulette wheel, card hands, crash rocket + chart, mines
// grid, plinko pegs, dice), the motif matches keywords in the game's name,
// and a per-slug seed varies symbols, cards, colours and layout so no two
// games share the same image. The art is an inline data URI, so it can
// never 404 or show a broken box.

import type { Game } from "@/lib/client";

export const ENGINE_ICON: Record<string, string> = {
  crash: "↗",
  mines: "◆",
  dice: "⚄",
  slots: "7",
  teenpatti: "♠",
  andarbahar: "♥",
  roulette: "◉",
  dragontiger: "♦",
  blackjack: "♣",
  plinko: "●",
};

function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let x = (seed % 2147483646) + 1;
  return () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
}

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"];

function starPts(cx: number, cy: number, r: number): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    p.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}

function slotSymbol(kind: number, x: number, y: number, s: number): string {
  switch (kind % 8) {
    case 0:
      return `<text x="${x}" y="${y + s * 0.36}" font-size="${s * 1.05}" font-family="Georgia,serif" font-weight="bold" fill="#c9930a" text-anchor="middle">7</text>`;
    case 1:
      return `<polygon points="${x},${y - s * 0.5} ${x + s * 0.42},${y} ${x},${y + s * 0.5} ${x - s * 0.42},${y}" fill="#39c2d7" stroke="#8fd8e8" stroke-width="2"/>`;
    case 2:
      return `<polygon points="${starPts(x, y, s * 0.52)}" fill="#e8b93c"/>`;
    case 3:
      return `<path d="M ${x - s * 0.28} ${y + s * 0.16} Q ${x} ${y - s * 0.44} ${x + s * 0.34} ${y - s * 0.4}" stroke="#3f9e4d" stroke-width="3.5" fill="none"/><circle cx="${x - s * 0.28}" cy="${y + s * 0.3}" r="${s * 0.24}" fill="#d43a4e"/><circle cx="${x + s * 0.26}" cy="${y + s * 0.36}" r="${s * 0.2}" fill="#e8546a"/>`;
    case 4:
      return `<rect x="${x - s * 0.46}" y="${y - s * 0.2}" width="${s * 0.92}" height="${s * 0.4}" rx="4" fill="#1c1c22"/><text x="${x}" y="${y + s * 0.14}" font-size="${s * 0.3}" font-family="Georgia,serif" font-weight="bold" fill="#f5efe0" text-anchor="middle">BAR</text>`;
    case 5:
      return `<path d="M ${x - s * 0.38} ${y + s * 0.3} Q ${x - s * 0.34} ${y - s * 0.34} ${x} ${y - s * 0.4} Q ${x + s * 0.34} ${y - s * 0.34} ${x + s * 0.38} ${y + s * 0.3} Z" fill="#e8b93c" stroke="#d8a812" stroke-width="2"/><circle cx="${x}" cy="${y + s * 0.42}" r="${s * 0.1}" fill="#c9930a"/>`;
    case 6:
      return `<polygon points="${x - s * 0.4},${y - s * 0.18} ${x - s * 0.14},${y - s * 0.44} ${x + s * 0.14},${y - s * 0.44} ${x + s * 0.4},${y - s * 0.18} ${x},${y + s * 0.46}" fill="#9b6dd6" stroke="#c9aef0" stroke-width="2"/>`;
    default:
      return `<path d="M ${x - s * 0.44} ${y + s * 0.34} L ${x - s * 0.44} ${y - s * 0.3} L ${x - s * 0.2} ${y + s * 0.02} L ${x} ${y - s * 0.38} L ${x + s * 0.2} ${y + s * 0.02} L ${x + s * 0.44} ${y - s * 0.3} L ${x + s * 0.44} ${y + s * 0.34} Z" fill="#e8b93c" stroke="#d8a812" stroke-width="2"/>`;
  }
}

function cardSvg(
  x: number,
  y: number,
  rot: number,
  rank: string,
  suit: string,
  w = 62,
  h = 88,
): string {
  const red = suit === "♥" || suit === "♦";
  const col = red ? "#b3273a" : "#1c1c22";
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#fffdf5" stroke="#d8cfb4" stroke-width="1.5"/><text x="${-w / 2 + 7}" y="${-h / 2 + 21}" font-size="${Math.round(w * 0.3)}" font-family="Georgia,serif" font-weight="bold" fill="${col}">${rank}</text><text x="0" y="${Math.round(h * 0.2)}" font-size="${Math.round(w * 0.48)}" text-anchor="middle" fill="${col}">${suit}</text></g>`;
}

function motifFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("egypt") || n.includes("pharaoh") || n.includes("aztec"))
    return `<polygon points="322,152 368,62 414,152" fill="none" stroke="#f0d47a" stroke-width="3" opacity="0.35"/><circle cx="368" cy="42" r="12" fill="#f0d47a" opacity="0.35"/>`;
  if (n.includes("fruit") || n.includes("candy"))
    return `<circle cx="352" cy="70" r="17" fill="#d43a4e" opacity="0.4"/><circle cx="384" cy="84" r="13" fill="#e8546a" opacity="0.4"/><path d="M 352 56 Q 368 30 390 34" stroke="#3f9e4d" stroke-width="4" fill="none" opacity="0.5"/>`;
  if (n.includes("dragon"))
    return `<path d="M 340 150 Q 326 96 354 76 Q 344 108 364 112 Q 352 82 380 58 Q 374 100 398 108 Q 370 122 376 152 Z" fill="#e2703a" opacity="0.42"/>`;
  if (n.includes("space") || n.includes("neon") || n.includes("odyssey"))
    return `<circle cx="366" cy="70" r="19" fill="#7c5cff" opacity="0.45"/><ellipse cx="366" cy="70" rx="35" ry="10" fill="none" stroke="#b7a6ff" stroke-width="3" opacity="0.5" transform="rotate(-18 366 70)"/>`;
  if (n.includes("pirate") || n.includes("bounty"))
    return `<circle cx="366" cy="64" r="14" fill="#f5efe0" opacity="0.4"/><path d="M 342 142 L 390 96 M 390 142 L 342 96" stroke="#f5efe0" stroke-width="5" opacity="0.32"/>`;
  if (n.includes("jungle") || n.includes("wild") || n.includes("viking") || n.includes("samurai"))
    return `<ellipse cx="358" cy="70" rx="13" ry="29" fill="#3f9e4d" opacity="0.4" transform="rotate(28 358 70)"/><ellipse cx="390" cy="86" rx="10" ry="23" fill="#57b368" opacity="0.35" transform="rotate(52 390 86)"/>`;
  if (
    n.includes("cricket") || n.includes("football") || n.includes("racing") ||
    n.includes("horse") || n.includes("basketball") || n.includes("tennis") ||
    n.includes("penalty") || n.includes("kabaddi") || n.includes("derby") ||
    n.includes("prix") || n.includes("hoops") || n.includes("goal")
  )
    return `<circle cx="366" cy="72" r="21" fill="#f5efe0" opacity="0.26"/><path d="M 347 60 Q 366 74 385 60 M 349 88 Q 366 74 383 88" stroke="#101018" stroke-width="2.5" fill="none" opacity="0.3"/>`;
  return `<polygon points="${starPts(366, 68, 19)}" fill="#f0d47a" opacity="0.3"/>`;
}

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-19, -19], [19, 19]],
  3: [[-19, -19], [0, 0], [19, 19]],
  4: [[-19, -19], [19, -19], [-19, 19], [19, 19]],
  5: [[-19, -19], [19, -19], [0, 0], [-19, 19], [19, 19]],
  6: [[-19, -19], [19, -19], [-19, 0], [19, 0], [-19, 19], [19, 19]],
};

function sceneFor(g: Game): string {
  const rand = rng(seedOf(g.slug));
  const pick = (n: number) => Math.floor(rand() * n);
  const rank = () => RANKS[pick(RANKS.length)] ?? "A";
  const suit = () => SUITS[pick(SUITS.length)] ?? "♠";
  if (g.engine === "slots") {
    const h = seedOf(g.slug);
    let k0 = h % 8;
    let k1 = (h >>> 4) % 8;
    let k2 = (h >>> 8) % 8;
    if (k1 === k0) k1 = (k1 + 3) % 8;
    if (k2 === k0 || k2 === k1) k2 = (k2 + 5) % 8;
    if (k2 === k0 || k2 === k1) k2 = (k2 + 1) % 8;
    const n = g.name.toLowerCase();
    if (n.includes("egypt") || n.includes("pharaoh") || n.includes("aztec")) {
      const set = [6, 1, 2];
      const r = h % 3;
      k0 = set[r] ?? 6;
      k1 = set[(r + 1) % 3] ?? 1;
      k2 = set[(r + 2) % 3] ?? 2;
    } else if (n.includes("fruit") || n.includes("candy")) {
      k0 = 3;
      if (k1 === 3) k1 = 5;
      k2 = k1 === 5 ? 0 : 5;
    } else if (n.includes("seven") || n.includes("7s")) {
      k0 = 0;
      if (k1 === 0) k1 = 2;
      if (k2 === 0) k2 = 4;
    } else if (n.includes("diamond")) {
      k0 = 1;
      if (k2 === 1) k2 = 6;
    }
    const kinds = [k0, k1, k2];
    const reels = kinds
      .map(
        (k, i) =>
          `<rect x="${102 + i * 66}" y="52" width="58" height="86" rx="8" fill="#fffdf5"/>${slotSymbol(k, 131 + i * 66, 95, 44)}`,
      )
      .join("");
    return `<rect x="86" y="36" width="222" height="122" rx="14" fill="#101018" stroke="#c9a227" stroke-width="3"/>${reels}<line x1="308" y1="52" x2="322" y2="30" stroke="#c9a227" stroke-width="4"/><circle cx="324" cy="27" r="7" fill="#d43a4e"/><text x="197" y="176" font-size="13" font-family="Georgia,serif" letter-spacing="4" fill="#f0d47a" text-anchor="middle">JACKPOT</text>`;
  }
  if (g.engine === "roulette") {
    const green = pick(12);
    let wedges = "";
    for (let i = 0; i < 12; i++) {
      const a1 = ((i * 30 - 90) * Math.PI) / 180;
      const a2 = (((i + 1) * 30 - 90) * Math.PI) / 180;
      const x1 = 200 + 78 * Math.cos(a1);
      const y1 = 106 + 78 * Math.sin(a1);
      const x2 = 200 + 78 * Math.cos(a2);
      const y2 = 106 + 78 * Math.sin(a2);
      wedges += `<path d="M 200 106 L ${x1.toFixed(1)} ${y1.toFixed(1)} A 78 78 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${i === green ? "#14532d" : i % 2 === 0 ? "#7a1f1f" : "#17171f"}" stroke="#c9a227" stroke-width="1"/>`;
    }
    return `${wedges}<circle cx="200" cy="106" r="80" fill="none" stroke="#c9a227" stroke-width="3"/><circle cx="200" cy="106" r="33" fill="#0b0b12" stroke="#c9a227" stroke-width="2"/><text x="200" y="116" font-size="26" font-family="Georgia,serif" font-weight="bold" fill="#f0d47a" text-anchor="middle">${pick(37)}</text>`;
  }
  if (g.engine === "crash") {
    const steep = 1.4 + rand() * 0.9;
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const x = 36 + i * 31;
      const y = 182 - Math.pow(i / 10, steep) * 138;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    const mult = (1.5 + rand() * 6).toFixed(1);
    return `<line x1="36" y1="182" x2="372" y2="182" stroke="#f0d47a" stroke-width="1" opacity="0.4"/><line x1="36" y1="182" x2="36" y2="26" stroke="#f0d47a" stroke-width="1" opacity="0.4"/><polyline points="${pts.join(" ")}" fill="none" stroke="#f0d47a" stroke-width="3"/><g transform="translate(352 40) rotate(38)"><polygon points="0,-16 7,8 0,3 -7,8" fill="#e8546a"/><polygon points="-4,8 0,20 4,8" fill="#e8b93c"/></g><text x="70" y="66" font-size="34" font-family="Georgia,serif" font-weight="bold" fill="#f0d47a">${mult}x</text>`;
  }
  if (g.engine === "mines") {
    const mineSet = new Set<number>();
    while (mineSet.size < 4) mineSet.add(pick(25));
    const gemSet = new Set<number>();
    while (gemSet.size < 5) {
      const v = pick(25);
      if (!mineSet.has(v)) gemSet.add(v);
    }
    let cells = "";
    for (let i = 0; i < 25; i++) {
      const cx = 112 + (i % 5) * 36;
      const cy = 22 + Math.floor(i / 5) * 36;
      const inner = mineSet.has(i)
        ? `<circle cx="${cx + 15}" cy="${cy + 15}" r="7" fill="#26262e" stroke="#8a8a96" stroke-width="1.5"/><path d="M ${cx + 15} ${cy + 4} L ${cx + 15} ${cy + 26} M ${cx + 4} ${cy + 15} L ${cx + 26} ${cy + 15}" stroke="#8a8a96" stroke-width="1.5"/>`
        : gemSet.has(i)
          ? `<polygon points="${cx + 15},${cy + 5} ${cx + 24},${cy + 15} ${cx + 15},${cy + 25} ${cx + 6},${cy + 15}" fill="#39c2d7"/>`
          : "";
      cells += `<rect x="${cx}" y="${cy}" width="30" height="30" rx="6" fill="#ffffff" opacity="${mineSet.has(i) || gemSet.has(i) ? 0.16 : 0.07}"/>${inner}`;
    }
    return cells;
  }
  if (g.engine === "plinko") {
    let pegs = "";
    for (let r = 0; r < 6; r++)
      for (let i = 0; i < r + 3; i++)
        pegs += `<circle cx="${200 + (i - (r + 2) / 2) * 27}" cy="${36 + r * 21}" r="3.2" fill="#f0d47a"/>`;
    const bin = pick(9);
    let bins = "";
    for (let i = 0; i < 9; i++)
      bins += `<rect x="${66 + i * 30}" y="176" width="27" height="18" rx="3" fill="${i === bin ? "#c9a227" : "#ffffff"}" opacity="${i === bin ? 1 : 0.14}"/>`;
    return `${pegs}<circle cx="${200 + (pick(5) - 2) * 14}" cy="24" r="7" fill="#e8546a"/>${bins}`;
  }
  if (g.engine === "dice") {
    const die = (cx: number, cy: number, rot: number, v: number) =>
      `<g transform="translate(${cx} ${cy}) rotate(${rot})"><rect x="-37" y="-37" width="74" height="74" rx="13" fill="#fffdf5" stroke="#d8cfb4" stroke-width="2"/>${(PIPS[v] ?? [[0, 0]])
        .map(([px, py]) => `<circle cx="${px}" cy="${py}" r="8" fill="#b3273a"/>`)
        .join("")}</g>`;
    return `${die(152, 104, -10, 1 + pick(6))}${die(248, 96, 12, 1 + pick(6))}`;
  }
  if (g.engine === "dragontiger") {
    return `${cardSvg(148, 106, -7, rank(), suit())}${cardSvg(252, 106, 7, rank(), suit())}<circle cx="200" cy="106" r="17" fill="#101018" stroke="#c9a227" stroke-width="2"/><text x="200" y="112" font-size="13" font-family="Georgia,serif" font-weight="bold" fill="#f0d47a" text-anchor="middle">VS</text>`;
  }
  if (g.engine === "andarbahar") {
    let row = "";
    for (let i = 0; i < 4; i++) row += cardSvg(128 + i * 48, 168, 0, rank(), suit(), 36, 50);
    return `${cardSvg(200, 78, 0, rank(), suit(), 66, 94)}<text x="200" y="146" font-size="11" font-family="Georgia,serif" letter-spacing="3" fill="#f0d47a" text-anchor="middle">JOKER</text>${row}`;
  }
  const chips =
    g.engine === "blackjack"
      ? `<circle cx="118" cy="168" r="15" fill="#7a1f1f" stroke="#f5efe0" stroke-width="3" stroke-dasharray="5 4"/><circle cx="282" cy="168" r="15" fill="#14532d" stroke="#f5efe0" stroke-width="3" stroke-dasharray="5 4"/>`
      : "";
  return `${cardSvg(158, 104, -13, rank(), suit())}${cardSvg(200, 98, 0, rank(), suit())}${cardSvg(242, 104, 13, rank(), suit())}${chips}`;
}

const FALLBACK_ART = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210"><rect width="400" height="210" fill="#171204"/><text x="200" y="128" font-size="72" font-family="Georgia,serif" fill="#c9a227" text-anchor="middle">Q</text></svg>`,
)}`;

const artCache = new Map<string, string>();

export function artFor(g: Game): string {
  const hit = artCache.get(g.slug);
  if (hit) return hit;
  const rand = rng(seedOf(`${g.slug}:bg`));
  let sparkles = "";
  for (let i = 0; i < 14; i++)
    sparkles += `<circle cx="${(rand() * 400).toFixed(0)}" cy="${(rand() * 200).toFixed(0)}" r="${(1 + rand() * 1.6).toFixed(1)}" fill="#ffffff" opacity="0.22"/>`;
  const h1 = g.hue;
  const h2 = (g.hue + 55) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 62% 15%)"/><stop offset="0.55" stop-color="hsl(${h2} 68% 27%)"/><stop offset="1" stop-color="hsl(${h1} 75% 9%)"/></linearGradient></defs><rect width="400" height="210" fill="url(#bg)"/>${sparkles}${motifFor(g.name)}${sceneFor(g)}<rect y="170" width="400" height="40" fill="#000000" opacity="0.25"/></svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  artCache.set(g.slug, uri);
  return uri;
}

export function Thumb({ g, big }: { g: Game; big?: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ height: big ? 190 : 104 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artFor(g)}
        alt={`${g.name} - ${g.category} game artwork`}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK_ART) e.currentTarget.src = FALLBACK_ART;
        }}
        className="h-full w-full object-cover"
      />
      {g.tag && (
        <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">
          {g.tag.toUpperCase()}
        </span>
      )}
      <span className="absolute bottom-1.5 right-2 text-[10px] tracking-widest text-white/80">
        {g.category.toUpperCase()}
      </span>
    </div>
  );
}
