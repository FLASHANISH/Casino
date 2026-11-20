
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import shotLobby from "./assets/shot-lobby.png";
import shotGame from "./assets/shot-game.png";
import shotWallet from "./assets/shot-wallet.png";
import shotAdmin from "./assets/shot-admin.png";

const FIELDS = actionFields<typeof Actions>();
type State = ApiResponse<typeof api, "getState">;
type Game = State["games"][number];
type PlayResult = ApiResponse<typeof api, "playGame">;

const ENGINE_ICON: Record<string, string> = { crash: "\u2197", mines: "\u25C6", dice: "\u2684", slots: "7", teenpatti: "\u2660", andarbahar: "\u2665", roulette: "\u25CE", dragontiger: "\u2666", blackjack: "\u2663", plinko: "\u25CF" };
const CATEGORIES = ["All", "Slots", "Table Games", "Card Games", "Arcade", "Live Casino", "Sports Mini Games"];
const SPORTS = ["All Sports", "Cricket", "Football", "Tennis", "Basketball", "Volleyball", "Badminton", "Hockey", "Baseball", "Formula 1", "Esports"];
const LEAGUES: Record<string, string[]> = {
  Cricket: ["IPL", "ICC World Cup", "T20 World Cup", "Champions Trophy", "Asia Cup", "Test / ODI / T20I", "BBL", "PSL", "CPL", "The Hundred"],
  Football: ["FIFA World Cup", "Champions League", "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Europa League"],
};
const IPL_TEAMS = [
  { name: "Mumbai Indians", short: "MI", color: "#2b6cb0" }, { name: "Chennai Super Kings", short: "CSK", color: "#d69e2e" },
  { name: "Royal Challengers Bengaluru", short: "RCB", color: "#c53030" }, { name: "Kolkata Knight Riders", short: "KKR", color: "#553c9a" },
  { name: "Delhi Capitals", short: "DC", color: "#2c5282" }, { name: "Sunrisers Hyderabad", short: "SRH", color: "#dd6b20" },
  { name: "Rajasthan Royals", short: "RR", color: "#b83280" }, { name: "Punjab Kings", short: "PBKS", color: "#9b2c2c" },
  { name: "Lucknow Super Giants", short: "LSG", color: "#2f855a" }, { name: "Gujarat Titans", short: "GT", color: "#744210" },
];
// Demo standings/caps - clearly labelled DEMO in the UI; replaced by live API data when keys are connected.
const DEMO_POINTS = IPL_TEAMS.map((t, i) => ({ team: t.name, p: 14, w: [9, 9, 8, 8, 7, 7, 6, 5, 4, 3][i] ?? 5, l: [5, 5, 6, 6, 7, 7, 8, 9, 10, 11][i] ?? 7, pts: [18, 18, 16, 16, 14, 14, 12, 10, 8, 6][i] ?? 10, nrr: (0.45 - i * 0.11).toFixed(3) }));
const DEMO_ORANGE = [["Demo Batter A (MI)", 612], ["Demo Batter B (RCB)", 585], ["Demo Batter C (CSK)", 541], ["Demo Batter D (KKR)", 498], ["Demo Batter E (SRH)", 462]] as const;
const DEMO_PURPLE = [["Demo Bowler A (CSK)", 24], ["Demo Bowler B (MI)", 22], ["Demo Bowler C (RR)", 21], ["Demo Bowler D (DC)", 19], ["Demo Bowler E (GT)", 18]] as const;
const WC_GROUPS = [
  { name: "Group A", teams: ["India", "Australia", "New Zealand", "Sri Lanka"] },
  { name: "Group B", teams: ["England", "Pakistan", "South Africa", "Bangladesh"] },
];
const FIFA_GROUPS = [
  { name: "Group A", teams: ["Argentina", "Netherlands", "Japan", "Canada"] },
  { name: "Group B", teams: ["France", "Brazil", "Germany", "Morocco"] },
];
const T = {
  en: { lobby: "Lobby", sports: "Sportsbook", wallet: "Wallet", profile: "Profile", login: "Log in", signup: "Sign up", logout: "Log out", search: "Search 200+ games...", play: "Play now", credits: "Real balance" },
  hi: { lobby: "\u0932\u0949\u092C\u0940", sports: "\u0938\u094D\u092A\u094B\u0930\u094D\u091F\u094D\u0938\u092C\u0941\u0915", wallet: "\u0935\u0949\u0932\u0947\u091F", profile: "\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932", login: "\u0932\u0949\u0917 \u0907\u0928", signup: "\u0938\u093E\u0907\u0928 \u0905\u092A", logout: "\u0932\u0949\u0917 \u0906\u0909\u091F", search: "200+ \u0917\u0947\u092E \u0916\u094B\u091C\u0947\u0902...", play: "\u0905\u092D\u0940 \u0916\u0947\u0932\u0947\u0902", credits: "\u0930\u093F\u092F\u0932 \u092C\u0948\u0932\u0947\u0902\u0938" },
} as const;

function credits(n: number) { return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function refLink(code: string) { return `${window.location.origin}${window.location.pathname}#/signup?ref=${code}`; }
function getRoute(): string { const h = window.location.hash.replace(/^#\/?/, ""); return h || "home"; }
function go(route: string) { window.location.hash = `#/${route}`; window.scrollTo({ top: 0 }); }
function token() { return localStorage.getItem("quvanta_token") ?? ""; }
// The operator portal uses its own separate session key, fully independent of
// the player session: a player login never opens the portal and vice versa.
function adminToken() { return localStorage.getItem("quvanta_admin_token") ?? ""; }
function recentSlugs(): string[] { try { return JSON.parse(localStorage.getItem("quvanta_recent") ?? "[]") as string[]; } catch { return []; } }
function pushRecent(slug: string) { const r = [slug, ...recentSlugs().filter((s) => s !== slug)].slice(0, 8); localStorage.setItem("quvanta_recent", JSON.stringify(r)); }

// ---------- Unique per-game thumbnail art ----------
// Every game gets its own generated SVG artwork: the scene matches the game's
// engine (slot reels, roulette wheel, card hands, crash rocket + chart, mines
// grid, plinko pegs, dice), the motif matches keywords in the game's name
// (Egyptian pyramid, fruit, dragon, space...), and a per-slug seed varies the
// symbols, cards, colours and layout so no two games share the same image.
// The art is an inline data URI, so it can never 404 or show a broken box;
// the <img> still lazy-loads and swaps to a gold fallback if decoding fails.
function seedOf(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let x = (seed % 2147483646) + 1; return () => { x = (x * 48271) % 2147483647; return x / 2147483647; }; }
const SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"];
function starPts(cx: number, cy: number, r: number): string { const p: string[] = []; for (let i = 0; i < 10; i++) { const rad = i % 2 === 0 ? r : r * 0.45; const a = (Math.PI / 5) * i - Math.PI / 2; p.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`); } return p.join(" "); }
function slotSymbol(kind: number, x: number, y: number, s: number): string {
  switch (kind % 8) {
    case 0: return `<text x="${x}" y="${y + s * 0.36}" font-size="${s * 1.05}" font-family="Georgia,serif" font-weight="bold" fill="#c9930a" text-anchor="middle">7</text>`;
    case 1: return `<polygon points="${x},${y - s * 0.5} ${x + s * 0.42},${y} ${x},${y + s * 0.5} ${x - s * 0.42},${y}" fill="#39c2d7" stroke="#8fd8e8" stroke-width="2"/>`;
    case 2: return `<polygon points="${starPts(x, y, s * 0.52)}" fill="#e8b93c"/>`;
    case 3: return `<path d="M ${x - s * 0.28} ${y + s * 0.16} Q ${x} ${y - s * 0.44} ${x + s * 0.34} ${y - s * 0.4}" stroke="#3f9e4d" stroke-width="3.5" fill="none"/><circle cx="${x - s * 0.28}" cy="${y + s * 0.3}" r="${s * 0.24}" fill="#d43a4e"/><circle cx="${x + s * 0.26}" cy="${y + s * 0.36}" r="${s * 0.2}" fill="#e8546a"/>`;
    case 4: return `<rect x="${x - s * 0.46}" y="${y - s * 0.2}" width="${s * 0.92}" height="${s * 0.4}" rx="4" fill="#1c1c22"/><text x="${x}" y="${y + s * 0.14}" font-size="${s * 0.3}" font-family="Georgia,serif" font-weight="bold" fill="#f5efe0" text-anchor="middle">BAR</text>`;
    case 5: return `<path d="M ${x - s * 0.38} ${y + s * 0.3} Q ${x - s * 0.34} ${y - s * 0.34} ${x} ${y - s * 0.4} Q ${x + s * 0.34} ${y - s * 0.34} ${x + s * 0.38} ${y + s * 0.3} Z" fill="#e8b93c" stroke="#d8a812" stroke-width="2"/><circle cx="${x}" cy="${y + s * 0.42}" r="${s * 0.1}" fill="#c9930a"/>`;
    case 6: return `<polygon points="${x - s * 0.4},${y - s * 0.18} ${x - s * 0.14},${y - s * 0.44} ${x + s * 0.14},${y - s * 0.44} ${x + s * 0.4},${y - s * 0.18} ${x},${y + s * 0.46}" fill="#9b6dd6" stroke="#c9aef0" stroke-width="2"/>`;
    default: return `<path d="M ${x - s * 0.44} ${y + s * 0.34} L ${x - s * 0.44} ${y - s * 0.3} L ${x - s * 0.2} ${y + s * 0.02} L ${x} ${y - s * 0.38} L ${x + s * 0.2} ${y + s * 0.02} L ${x + s * 0.44} ${y - s * 0.3} L ${x + s * 0.44} ${y + s * 0.34} Z" fill="#e8b93c" stroke="#d8a812" stroke-width="2"/>`;
  }
}
function cardSvg(x: number, y: number, rot: number, rank: string, suit: string, w = 62, h = 88): string {
  const red = suit === "\u2665" || suit === "\u2666"; const col = red ? "#b3273a" : "#1c1c22";
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#fffdf5" stroke="#d8cfb4" stroke-width="1.5"/><text x="${-w / 2 + 7}" y="${-h / 2 + 21}" font-size="${Math.round(w * 0.3)}" font-family="Georgia,serif" font-weight="bold" fill="${col}">${rank}</text><text x="0" y="${Math.round(h * 0.2)}" font-size="${Math.round(w * 0.48)}" text-anchor="middle" fill="${col}">${suit}</text></g>`;
}
function motifFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("egypt") || n.includes("pharaoh") || n.includes("aztec")) return `<polygon points="322,152 368,62 414,152" fill="none" stroke="#f0d47a" stroke-width="3" opacity="0.35"/><circle cx="368" cy="42" r="12" fill="#f0d47a" opacity="0.35"/>`;
  if (n.includes("fruit") || n.includes("candy")) return `<circle cx="352" cy="70" r="17" fill="#d43a4e" opacity="0.4"/><circle cx="384" cy="84" r="13" fill="#e8546a" opacity="0.4"/><path d="M 352 56 Q 368 30 390 34" stroke="#3f9e4d" stroke-width="4" fill="none" opacity="0.5"/>`;
  if (n.includes("dragon")) return `<path d="M 340 150 Q 326 96 354 76 Q 344 108 364 112 Q 352 82 380 58 Q 374 100 398 108 Q 370 122 376 152 Z" fill="#e2703a" opacity="0.42"/>`;
  if (n.includes("space") || n.includes("neon") || n.includes("odyssey")) return `<circle cx="366" cy="70" r="19" fill="#7c5cff" opacity="0.45"/><ellipse cx="366" cy="70" rx="35" ry="10" fill="none" stroke="#b7a6ff" stroke-width="3" opacity="0.5" transform="rotate(-18 366 70)"/>`;
  if (n.includes("pirate") || n.includes("bounty")) return `<circle cx="366" cy="64" r="14" fill="#f5efe0" opacity="0.4"/><path d="M 342 142 L 390 96 M 390 142 L 342 96" stroke="#f5efe0" stroke-width="5" opacity="0.32"/>`;
  if (n.includes("jungle") || n.includes("wild") || n.includes("viking") || n.includes("samurai")) return `<ellipse cx="358" cy="70" rx="13" ry="29" fill="#3f9e4d" opacity="0.4" transform="rotate(28 358 70)"/><ellipse cx="390" cy="86" rx="10" ry="23" fill="#57b368" opacity="0.35" transform="rotate(52 390 86)"/>`;
  if (n.includes("cricket") || n.includes("football") || n.includes("racing") || n.includes("horse") || n.includes("basketball") || n.includes("tennis") || n.includes("penalty") || n.includes("kabaddi") || n.includes("derby") || n.includes("prix") || n.includes("hoops") || n.includes("goal")) return `<circle cx="366" cy="72" r="21" fill="#f5efe0" opacity="0.26"/><path d="M 347 60 Q 366 74 385 60 M 349 88 Q 366 74 383 88" stroke="#101018" stroke-width="2.5" fill="none" opacity="0.3"/>`;
  return `<polygon points="${starPts(366, 68, 19)}" fill="#f0d47a" opacity="0.3"/>`;
}
const PIPS: Record<number, [number, number][]> = { 1: [[0, 0]], 2: [[-19, -19], [19, 19]], 3: [[-19, -19], [0, 0], [19, 19]], 4: [[-19, -19], [19, -19], [-19, 19], [19, 19]], 5: [[-19, -19], [19, -19], [0, 0], [-19, 19], [19, 19]], 6: [[-19, -19], [19, -19], [-19, 0], [19, 0], [-19, 19], [19, 19]] };
function sceneFor(g: Game): string {
  const rand = rng(seedOf(g.slug)); const pick = (n: number) => Math.floor(rand() * n);
  const rank = () => RANKS[pick(RANKS.length)] ?? "A"; const suit = () => SUITS[pick(SUITS.length)] ?? "\u2660";
  if (g.engine === "slots") {
    // Symbol triple comes from independent hash slices of the slug, so two
    // different slot games cannot land on the same reel set by coincidence;
    // themed titles get a forced themed symbol set on top.
    const h = seedOf(g.slug);
    let k0 = h % 8, k1 = (h >>> 4) % 8, k2 = (h >>> 8) % 8;
    if (k1 === k0) k1 = (k1 + 3) % 8;
    if (k2 === k0 || k2 === k1) k2 = (k2 + 5) % 8;
    if (k2 === k0 || k2 === k1) k2 = (k2 + 1) % 8;
    const n = g.name.toLowerCase();
    if (n.includes("egypt") || n.includes("pharaoh") || n.includes("aztec")) { const set = [6, 1, 2]; const r = h % 3; k0 = set[r] ?? 6; k1 = set[(r + 1) % 3] ?? 1; k2 = set[(r + 2) % 3] ?? 2; }
    else if (n.includes("fruit") || n.includes("candy")) { k0 = 3; if (k1 === 3) k1 = 5; k2 = k1 === 5 ? 0 : 5; }
    else if (n.includes("seven") || n.includes("7s")) { k0 = 0; if (k1 === 0) k1 = 2; if (k2 === 0) k2 = 4; }
    else if (n.includes("diamond")) { k0 = 1; if (k2 === 1) k2 = 6; }
    const kinds = [k0, k1, k2];
    const reels = kinds.map((k, i) => `<rect x="${102 + i * 66}" y="52" width="58" height="86" rx="8" fill="#fffdf5"/>${slotSymbol(k, 131 + i * 66, 95, 44)}`).join("");
    return `<rect x="86" y="36" width="222" height="122" rx="14" fill="#101018" stroke="#c9a227" stroke-width="3"/>${reels}<line x1="308" y1="52" x2="322" y2="30" stroke="#c9a227" stroke-width="4"/><circle cx="324" cy="27" r="7" fill="#d43a4e"/><text x="197" y="176" font-size="13" font-family="Georgia,serif" letter-spacing="4" fill="#f0d47a" text-anchor="middle">JACKPOT</text>`;
  }
  if (g.engine === "roulette") {
    const green = pick(12); let wedges = "";
    for (let i = 0; i < 12; i++) { const a1 = (i * 30 - 90) * Math.PI / 180, a2 = ((i + 1) * 30 - 90) * Math.PI / 180; const x1 = 200 + 78 * Math.cos(a1), y1 = 106 + 78 * Math.sin(a1), x2 = 200 + 78 * Math.cos(a2), y2 = 106 + 78 * Math.sin(a2); wedges += `<path d="M 200 106 L ${x1.toFixed(1)} ${y1.toFixed(1)} A 78 78 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${i === green ? "#14532d" : i % 2 === 0 ? "#7a1f1f" : "#17171f"}" stroke="#c9a227" stroke-width="1"/>`; }
    return `${wedges}<circle cx="200" cy="106" r="80" fill="none" stroke="#c9a227" stroke-width="3"/><circle cx="200" cy="106" r="33" fill="#0b0b12" stroke="#c9a227" stroke-width="2"/><text x="200" y="116" font-size="26" font-family="Georgia,serif" font-weight="bold" fill="#f0d47a" text-anchor="middle">${pick(37)}</text>`;
  }
  if (g.engine === "crash") {
    const steep = 1.4 + rand() * 0.9; const pts: string[] = [];
    for (let i = 0; i <= 10; i++) { const x = 36 + i * 31; const y = 182 - Math.pow(i / 10, steep) * 138; pts.push(`${x},${y.toFixed(1)}`); }
    const mult = (1.5 + rand() * 6).toFixed(1);
    return `<line x1="36" y1="182" x2="372" y2="182" stroke="#f0d47a" stroke-width="1" opacity="0.4"/><line x1="36" y1="182" x2="36" y2="26" stroke="#f0d47a" stroke-width="1" opacity="0.4"/><polyline points="${pts.join(" ")}" fill="none" stroke="#f0d47a" stroke-width="3"/><g transform="translate(352 40) rotate(38)"><polygon points="0,-16 7,8 0,3 -7,8" fill="#e8546a"/><polygon points="-4,8 0,20 4,8" fill="#e8b93c"/></g><text x="70" y="66" font-size="34" font-family="Georgia,serif" font-weight="bold" fill="#f0d47a">${mult}x</text>`;
  }
  if (g.engine === "mines") {
    const mineSet = new Set<number>(); while (mineSet.size < 4) mineSet.add(pick(25));
    const gemSet = new Set<number>(); while (gemSet.size < 5) { const v = pick(25); if (!mineSet.has(v)) gemSet.add(v); }
    let cells = "";
    for (let i = 0; i < 25; i++) { const cx = 112 + (i % 5) * 36, cy = 22 + Math.floor(i / 5) * 36; const inner = mineSet.has(i) ? `<circle cx="${cx + 15}" cy="${cy + 15}" r="7" fill="#26262e" stroke="#8a8a96" stroke-width="1.5"/><path d="M ${cx + 15} ${cy + 4} L ${cx + 15} ${cy + 26} M ${cx + 4} ${cy + 15} L ${cx + 26} ${cy + 15}" stroke="#8a8a96" stroke-width="1.5"/>` : gemSet.has(i) ? `<polygon points="${cx + 15},${cy + 5} ${cx + 24},${cy + 15} ${cx + 15},${cy + 25} ${cx + 6},${cy + 15}" fill="#39c2d7"/>` : ""; cells += `<rect x="${cx}" y="${cy}" width="30" height="30" rx="6" fill="#ffffff" opacity="${mineSet.has(i) || gemSet.has(i) ? 0.16 : 0.07}"/>${inner}`; }
    return cells;
  }
  if (g.engine === "plinko") {
    let pegs = "";
    for (let r = 0; r < 6; r++) for (let i = 0; i < r + 3; i++) pegs += `<circle cx="${200 + (i - (r + 2) / 2) * 27}" cy="${36 + r * 21}" r="3.2" fill="#f0d47a"/>`;
    const bin = pick(9); let bins = "";
    for (let i = 0; i < 9; i++) bins += `<rect x="${66 + i * 30}" y="176" width="27" height="18" rx="3" fill="${i === bin ? "#c9a227" : "#ffffff"}" opacity="${i === bin ? 1 : 0.14}"/>`;
    return `${pegs}<circle cx="${200 + (pick(5) - 2) * 14}" cy="24" r="7" fill="#e8546a"/>${bins}`;
  }
  if (g.engine === "dice") {
    const die = (cx: number, cy: number, rot: number, v: number) => `<g transform="translate(${cx} ${cy}) rotate(${rot})"><rect x="-37" y="-37" width="74" height="74" rx="13" fill="#fffdf5" stroke="#d8cfb4" stroke-width="2"/>${(PIPS[v] ?? [[0, 0]]).map(([px, py]) => `<circle cx="${px}" cy="${py}" r="8" fill="#b3273a"/>`).join("")}</g>`;
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
  // Card-hand engines: teenpatti, blackjack and every other card-based listing.
  const chips = g.engine === "blackjack" ? `<circle cx="118" cy="168" r="15" fill="#7a1f1f" stroke="#f5efe0" stroke-width="3" stroke-dasharray="5 4"/><circle cx="282" cy="168" r="15" fill="#14532d" stroke="#f5efe0" stroke-width="3" stroke-dasharray="5 4"/>` : "";
  return `${cardSvg(158, 104, -13, rank(), suit())}${cardSvg(200, 98, 0, rank(), suit())}${cardSvg(242, 104, 13, rank(), suit())}${chips}`;
}
const FALLBACK_ART = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210"><rect width="400" height="210" fill="#171204"/><text x="200" y="128" font-size="72" font-family="Georgia,serif" fill="#c9a227" text-anchor="middle">Q</text></svg>`)}`;
const artCache = new Map<string, string>();
function artFor(g: Game): string {
  const hit = artCache.get(g.slug); if (hit) return hit;
  const rand = rng(seedOf(`${g.slug}:bg`)); let sparkles = "";
  for (let i = 0; i < 14; i++) sparkles += `<circle cx="${(rand() * 400).toFixed(0)}" cy="${(rand() * 200).toFixed(0)}" r="${(1 + rand() * 1.6).toFixed(1)}" fill="#ffffff" opacity="0.22"/>`;
  const h1 = g.hue, h2 = (g.hue + 55) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 62% 15%)"/><stop offset="0.55" stop-color="hsl(${h2} 68% 27%)"/><stop offset="1" stop-color="hsl(${h1} 75% 9%)"/></linearGradient></defs><rect width="400" height="210" fill="url(#bg)"/>${sparkles}${motifFor(g.name)}${sceneFor(g)}<rect y="170" width="400" height="40" fill="#000000" opacity="0.25"/></svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  artCache.set(g.slug, uri); return uri;
}
function Thumb({ g, big }: { g: Game; big?: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ height: big ? 190 : 104 }}>
      <img src={artFor(g)} alt={`${g.name} - ${g.category} game artwork`} loading="lazy" decoding="async" onError={(e) => { if (e.currentTarget.src !== FALLBACK_ART) e.currentTarget.src = FALLBACK_ART; }} className="h-full w-full object-cover" />
      {g.tag && <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">{g.tag.toUpperCase()}</span>}
      <span className="absolute bottom-1.5 right-2 text-[10px] tracking-widest text-white/80">{g.category.toUpperCase()}</span>
    </div>
  );
}
function PlayingCard({ label, delay }: { label: string; delay: number }) {
  const red = label.includes("\u2665") || label.includes("\u2666");
  return <span className="playing-card deal-in inline-flex h-20 w-14 flex-col items-center justify-center font-serif" style={{ animationDelay: `${delay}ms` }}><span className={`text-2xl leading-none ${red ? "text-red-700" : "text-neutral-900"}`}>{label.slice(0, -1)}</span><span className={`text-xl ${red ? "text-red-700" : "text-neutral-900"}`}>{label.slice(-1)}</span></span>;
}
function Chip({ amount, color }: { amount: string; color: string }) {
  return <span className="chip inline-flex h-11 w-11 items-center justify-center rounded-full border-4 border-dashed border-white/70 text-[11px] font-bold text-white" style={{ background: color }}>{amount}</span>;
}

export function App() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => { const on = () => setRoute(getRoute()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  // The old dashboard route is disabled: anyone landing on it is bounced to
  // the player lobby, where nothing about the portal is shown.
  useEffect(() => { if (route === "admin") go("home"); }, [route]);
  const [tk, setTk] = useState(token());
  const [aTk, setATk] = useState(adminToken());
  const qc = useQueryClient();
  const state = useQuery({ queryKey: ["state", tk], queryFn: () => api.getState({ token: tk }) });
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [showNotifs, setShowNotifs] = useState(false);
  const t = T[lang];
  const logout = useMutation({ mutationFn: async () => await api.logout({ token: tk }), onSuccess: () => { localStorage.removeItem("quvanta_token"); setTk(""); qc.invalidateQueries(); go("login"); } });
  const fav = useMutation({ mutationFn: async (slug: string) => await api.toggleFavorite({ token: tk, slug }), onSuccess: () => qc.invalidateQueries({ queryKey: ["state"] }), onError: () => go("login") });

  const d = state.data;
  const user = d?.user ?? null;
  const gameSlug = route.startsWith("game/") ? route.slice(5) : "";
  const game = d?.games.find((g) => g.slug === gameSlug);
  // A logged-in user who lands on the auth routes is sent into the dashboard.
  useEffect(() => { if (user && (route === "login" || route.startsWith("signup"))) go("home"); }, [user, route]);

  // Operator portal: reachable ONLY by typing its hidden address directly.
  // Nothing on the player site links to or mentions it. Login and dashboard
  // share the single hidden route - there is no separate dashboard address,
  // and the old "admin" route is disabled (it just bounces to the lobby).
  if (route === "admin-login") return <AdminPage tk={aTk} setTk={setATk} />;

  // FIRST PAGE = Login / Create Account. Logged-out visitors see ONLY the
  // auth gate (or a public info page) - the lobby, 232 games, sportsbook,
  // IPL, World Cups, wallet, profile and refer & earn all live inside the
  // dashboard below and render only with a logged-in user.
  if (!user) {
    if (route.startsWith("info/")) return (<div className="felt min-h-screen text-[var(--text)]"><main className="mx-auto max-w-7xl px-4 pb-16"><InfoPage page={route.slice(5)} /></main></div>);
    return <AuthGate setTk={setTk} route={route} loading={state.isPending} loadError={!!state.error} />;
  }

  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[#07070b]/92 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <button type="button" onClick={() => go("home")} className="text-left" aria-label="Quvanta home">
            <span className="font-serif text-xl tracking-[0.18em] gold-text sm:text-2xl">QUVANTA</span>
            <span className="block text-[10px] tracking-[0.3em] text-[var(--dim)]">PREMIUM CASINO &amp; SPORTS</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLang(lang === "en" ? "hi" : "en")} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs" aria-label="Switch language English Hindi">{lang === "en" ? "EN \u00B7 \u0939\u093F" : "HI \u00B7 EN"}</button>
            <div className="relative">
              <button type="button" onClick={() => setShowNotifs(!showNotifs)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm" aria-label="Notifications" aria-expanded={showNotifs}>{"🔔"}</button>
              {showNotifs && (
                <div className="glass absolute right-0 top-11 w-72 p-3 text-sm shadow-2xl" role="status">
                  <p className="font-semibold gold-text">Notifications</p>
                  <p className="mt-2">{d?.settings["promo_banner"] || "Welcome to Quvanta."}</p>
                  <p className="mt-2 text-[var(--dim)]">{d?.settings["tournament_note"] || ""}</p>
                  <p className="mt-2 text-[var(--dim)]">{user ? `Refer & Earn: share your code ${user.referralCode} - you get Rs 10 real money (credited as 10.00 in your wallet balance) for every signup. See Wallet.` : "Log in to deposit real money via UPI or USDT."}</p>
                </div>
              )}
            </div>
            {user ? (
              <>
                <button type="button" onClick={() => go("wallet")} className="rounded-full border border-[var(--accent)] px-3 py-1.5 text-left" aria-label="Open wallet">
                  <span className="block text-[9px] tracking-widest text-[var(--dim)]">{t.credits.toUpperCase()} - REAL MONEY</span>
                  <span className="block font-serif leading-none gold-text">{credits(user.balance)}</span>
                </button>
                <button type="button" onClick={() => go("profile")} className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black" aria-label="Open profile">{user.name.split(" ")[0]}</button>
                <button type="button" onClick={() => logout.mutate()} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm" aria-label="Log out">{t.logout}</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => go("login")} className="rounded-full border border-[var(--accent)] px-4 py-1.5 text-sm" aria-label="Log in">{t.login}</button>
                <button type="button" onClick={() => go("signup")} className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-black" aria-label="Sign up">{t.signup}</button>
              </>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Main sections">
          {([["home", t.lobby], ["sports", t.sports], ["ipl", "IPL"], ["worldcup", "World Cups"], ["wallet", t.wallet], ["profile", t.profile]] as const).map(([r, label]) => (
            <button key={r} type="button" onClick={() => go(r)} aria-pressed={route === r} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${route === r ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{label}</button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16">
        {state.isPending && <p className="mt-10 text-center text-[var(--dim)]">Loading Quvanta...</p>}
        {state.error && <p className="mt-10 text-center text-[var(--danger)]">Could not load Quvanta. Pull to retry.</p>}
        {d && route === "home" && <Home d={d} t={t} fav={(s) => fav.mutate(s)} />}
        {d && route === "sports" && <Sports d={d} tk={tk} />}
        {d && route === "ipl" && <Ipl d={d} tk={tk} />}
        {d && route === "worldcup" && <WorldCup d={d} tk={tk} />}
        {d && route === "wallet" && <WalletPage d={d} tk={tk} />}
        {d && route === "profile" && <ProfilePage d={d} tk={tk} onLogout={() => logout.mutate()} />}
        {d && game && route.startsWith("game/") && <GameDetail key={game.slug} g={game} d={d} tk={tk} fav={(s) => fav.mutate(s)} />}
        {d && route.startsWith("game/") && !game && <p className="mt-10 text-center text-[var(--dim)]">Game not found. <button type="button" className="gold-text underline" onClick={() => go("home")}>Back to lobby</button></p>}
        {route.startsWith("info/") && <InfoPage page={route.slice(5)} />}
        <footer className="mt-14 border-t border-[var(--border)] pt-5 text-xs leading-relaxed text-[var(--dim)]">
          <p>18+ only. Quvanta is a <strong className="text-[var(--text)]">real-money</strong> platform: deposits via UPI / USDT and withdrawals are approved manually after verification, and KYC is required before withdraw. Real-money play is in demo mode until the operator adds a valid Curacao / Anjouan licence, KYC and payment compliance. Play responsibly.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["faq", "terms", "privacy", "responsible"] as const).map((p) => (<button key={p} type="button" onClick={() => go(`info/${p}`)} className="rounded-full border border-[var(--border)] px-3 py-1.5 capitalize" aria-label={`Open ${p} page`}>{p === "responsible" ? "Responsible Gaming" : p}</button>))}
          </div>
          <p className="mt-3">Sports data: {d?.hasLiveKeys ? "API keys connected - live mode" : "DEMO fixtures (labelled) until API keys are connected"}. Support: {d?.settings["support_email"] || "support email will appear here once set"}.</p>
        </footer>
      </main>
    </div>
  );
}

function GameCard({ g, d, fav }: { g: Game; d: State; fav: (s: string) => void }) {
  const isFav = d.user?.favorites.includes(g.slug) ?? false;
  return (
    <article className="glass overflow-hidden">
      <button type="button" onClick={() => { pushRecent(g.slug); go(`game/${g.slug}`); }} className="block w-full text-left" aria-label={`Open ${g.name} detail page`}><Thumb g={g} /></button>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif leading-tight">{g.name}</h3>
          <button type="button" onClick={() => fav(g.slug)} aria-label={`${isFav ? "Remove" : "Add"} ${g.name} ${isFav ? "from" : "to"} favorites`} aria-pressed={isFav} className="text-lg leading-none gold-text">{isFav ? "\u2605" : "\u2606"}</button>
        </div>
        <p className="mt-0.5 text-xs text-[var(--dim)]">{g.category} - RTP {g.rtp}% - {g.plays} plays{g.enabled ? "" : " - Unavailable"}</p>
        <button type="button" disabled={!g.enabled} onClick={() => { pushRecent(g.slug); go(`game/${g.slug}`); }} className="mt-2 w-full rounded-lg bg-[var(--accent)] py-1.5 text-sm font-semibold text-black disabled:opacity-40" aria-label={`Play ${g.name}`}>Play now</button>
      </div>
    </article>
  );
}

function Home({ d, t, fav }: { d: State; t: (typeof T)["en"] | (typeof T)["hi"]; fav: (s: string) => void }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState("All"); const [showAll, setShowAll] = useState(false);
  const games = d.games.filter((g) => (cat === "All" || g.category === cat) && (q === "" || g.name.toLowerCase().includes(q.toLowerCase())));
  const featured = d.games.filter((g) => g.tag === "Featured");
  const popular = [...d.games].sort((a, b) => b.plays - a.plays).slice(0, 10);
  const news = d.games.filter((g) => g.tag === "New");
  const recent = recentSlugs().map((s) => d.games.find((g) => g.slug === s)).filter(Boolean) as Game[];
  const favGames = d.games.filter((g) => d.user?.favorites.includes(g.slug));
  const section = (title: string, list: Game[]) => list.length > 0 && (
    <section className="mt-8"><h2 className="font-serif text-2xl gold-text">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{list.slice(0, 10).map((g) => <GameCard key={g.slug} g={g} d={d} fav={fav} />)}</div></section>
  );
  return (
    <>
      <section className="glass mt-4 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6">
            <p className="text-xs tracking-[0.3em] text-[var(--dim)]">200+ GAMES - SPORTSBOOK - IPL</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight">Play premium. <span className="gold-text">Win real money.</span></h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--dim)]">{d.settings["promo_banner"] || "Deposit via UPI or USDT - verified deposits, real money in and out."} Real-money games: deposit first, play, and withdraw your winnings after KYC.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => go(d.user ? "wallet" : "signup")} className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Deposit real money">{d.user ? "Deposit / Withdraw" : "Create account - start at $0.00"}</button>
              <button type="button" onClick={() => go("sports")} className="rounded-lg border border-[var(--accent)] px-5 py-2.5" aria-label="Open sportsbook">{d.hasLiveKeys ? "Live sportsbook" : "Sportsbook (demo data)"}</button>
            </div>
            <div className="mt-5 flex gap-2" aria-hidden="true"><Chip amount="100" color="#7a1f1f" /><Chip amount="500" color="#14532d" /><Chip amount="1K" color="#1e3a5f" /><Chip amount="5K" color="#3b0764" /></div>
          </div>
          <div className="relative min-h-44" style={{ background: "linear-gradient(135deg,#241a04,#7a5b12 45%,#0b0b12)" }}>
            <span className="absolute inset-0 flex items-center justify-center font-serif text-7xl gold-text">Q</span>
            <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">{d.games.filter((g) => g.enabled).length} of {d.totalGames} games available - {d.hasLiveKeys ? "Sports API connected" : "Sports: DEMO data"}</span>
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm">Search games
          <input aria-label="Search games" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" /></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Game categories">
        {CATEGORIES.map((c) => (<button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full px-4 py-1.5 text-sm ${cat === c ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{c}</button>))}
      </div>

      {(q || cat !== "All") ? (
        <section className="mt-6"><h2 className="font-serif text-2xl">{games.length} game{games.length === 1 ? "" : "s"} found</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{(showAll ? games : games.slice(0, 30)).map((g) => <GameCard key={g.slug} g={g} d={d} fav={fav} />)}</div>
          {games.length > 30 && !showAll && <button type="button" onClick={() => setShowAll(true)} className="mt-4 w-full rounded-lg border border-[var(--accent)] py-2.5" aria-label="Show all matching games">Show all {games.length} games</button>}
        </section>
      ) : (<>
        {section("Featured Games", featured)}
        {section("Popular Right Now", popular)}
        {section("New Releases", news)}
        {d.user && section("Your Favorites", favGames)}
        {section("Recently Played", recent)}
        <section className="mt-8"><h2 className="font-serif text-2xl gold-text">Live Sports &amp; Tournaments</h2>
          <p className="mt-1 text-sm text-[var(--dim)]">{d.settings["tournament_note"] || ""} - {d.hasLiveKeys ? "Live API mode" : "Demo fixtures, clearly labelled - no fake live scores."}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <button type="button" onClick={() => go("ipl")} className="glass p-4 text-left" aria-label="Open IPL dashboard"><span className="font-serif text-xl">IPL Dashboard</span><span className="mt-1 block text-sm text-[var(--dim)]">All 10 teams, schedule, points table, Orange &amp; Purple Cap.</span></button>
            <button type="button" onClick={() => go("worldcup")} className="glass p-4 text-left" aria-label="Open World Cup pages"><span className="font-serif text-xl">World Cups</span><span className="mt-1 block text-sm text-[var(--dim)]">Cricket World Cup + FIFA World Cup: groups, fixtures, knockouts.</span></button>
            <button type="button" onClick={() => go("sports")} className="glass p-4 text-left" aria-label="Open full sportsbook"><span className="font-serif text-xl">Full Sportsbook</span><span className="mt-1 block text-sm text-[var(--dim)]">Cricket, Football, Tennis, Basketball, F1, Esports and more.</span></button>
          </div>
        </section>
        <section className="mt-8"><h2 className="font-serif text-2xl gold-text">Wallet &amp; Rewards</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[["Real-Money Deposits", "Pay by UPI or USDT, submit your UTR / tx-hash - once verified, your balance credits."], ["Refer & Earn Rs 10", "Share your referral code or link - every signup with it credits Rs 10 real money to your wallet (added as 10.00 to your balance)."], ["Champions Cup", "Tournament: most wins this week tops the leaderboard."]].map(([h, b]) => (
              <div key={h} className="glass p-4"><h3 className="font-serif text-lg gold-text">{h}</h3><p className="mt-1 text-sm text-[var(--dim)]">{b}</p></div>
            ))}
          </div>
        </section>
      </>)}
    </>
  );
}

function GameDetail({ g, d, tk, fav }: { g: Game; d: State; tk: string; fav: (s: string) => void }) {
  const qc = useQueryClient();
  const [bet, setBet] = useState("10"); const [choice, setChoice] = useState(g.engine === "roulette" ? "red" : g.engine === "dragontiger" ? "dragon" : g.engine === "andarbahar" ? "andar" : g.engine === "dice" ? "under" : "");
  const [target, setTarget] = useState(g.engine === "crash" ? 2 : g.engine === "dice" ? 50 : g.engine === "mines" ? 3 : 2);
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<PlayResult | null>(null); const [err, setErr] = useState("");
  const play = useMutation({
    mutationFn: async () => await api.playGame({ token: tk, game: g.slug, bet: Number(bet) || 0, choice, target, count }),
    onSuccess: (r) => { setResult(r); setErr(""); qc.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => { setErr(e instanceof Error ? e.message : "Play failed"); if (!tk) go("login"); },
  });
  const isFav = d.user?.favorites.includes(g.slug) ?? false;
  return (
    <section className="mt-4">
      <button type="button" onClick={() => go("home")} className="text-sm text-[var(--dim)] underline" aria-label="Back to lobby">Back to lobby</button>
      <div className="glass mt-3 overflow-hidden">
        <Thumb g={g} big />
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="font-serif text-3xl">{g.name}</h1><p className="mt-1 text-sm text-[var(--dim)]">{g.category} - RTP {g.rtp}% - {g.plays} rounds played - Server-settled, provably fair</p></div>
            <button type="button" onClick={() => fav(g.slug)} aria-pressed={isFav} className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm gold-text" aria-label={`${isFav ? "Remove" : "Add"} ${g.name} ${isFav ? "from" : "to"} favorites`}>{isFav ? "\u2605 Favorite" : "\u2606 Add favorite"}</button>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed">{g.description}</p>
          <p className="mt-2 text-xs text-[var(--dim)]">How to play: set your bet in real money (USD), choose your options below and press Play. The result is decided on the server - the animation below replays exactly what the server settled. Balance low? Deposit via UPI or USDT in your Wallet.</p>
        </div>
      </div>

      <div className="glass mt-4 p-4">
        <GameStage key={`${g.slug}-${result ? "r" : "i"}-${play.isPending ? "p" : "s"}`} engine={g.engine} result={result} pending={play.isPending} target={target} />
        {result && !play.isPending && (
          <div className={`mt-4 rounded-lg border p-4 pop-in ${result.win ? "border-[var(--good)] bg-emerald-950/60" : "border-[var(--border)] bg-black/40"}`} role="status">
            <p className="font-serif text-2xl">{result.win ? "\uD83C\uDFC6 " : ""}{result.reveal}</p>
            <p className="mt-1 text-sm">{result.detail}</p>
            <p className="mt-2 text-sm">{result.payout > 0 ? <>Payout <strong className="gold-text">{credits(result.payout)}</strong> - </> : null}Profit <strong className={result.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>{result.profit >= 0 ? "+" : ""}{result.profit.toFixed(2)}</strong>{result.multiplier > 0 ? <> - {result.multiplier}x</> : null} - Balance {credits(result.balance)}</p>
            <p className="mt-1 break-all text-[11px] text-[var(--dim)]">Provably-fair hash: {result.fairHash}</p>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Bet (real money, USD)
            <input aria-label="Bet amount in USD" {...FIELDS.playGame.bet} value={bet} onChange={(e) => setBet(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-lg" /></label>
          <div className="flex items-end gap-2">{[10, 25, 50, 100].map((v) => (<button key={v} type="button" onClick={() => setBet(String(v))} className="flex-1" aria-label={`Set bet to ${v} dollars`}><Chip amount={String(v)} color={v === 10 ? "#7a1f1f" : v === 25 ? "#14532d" : v === 50 ? "#1e3a5f" : "#3b0764"} /></button>))}</div>
        </div>
        <GameControls slug={g.engine} choice={choice} setChoice={setChoice} target={target} setTarget={setTarget} count={count} setCount={setCount} />
        {err && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{err}{!tk ? " Please log in or sign up to play." : ""}</p>}
        <button type="button" disabled={play.isPending || !g.enabled} onClick={() => { if (!tk) { go("login"); return; } setResult(null); play.mutate(); }} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-3 font-serif text-xl tracking-wide text-black disabled:opacity-50">
          {play.isPending ? "Dealing..." : !tk ? "Log in to play" : g.enabled ? `Play ${g.name}` : "Temporarily unavailable"}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--dim)]">Min ${g.minBet} - Max ${g.maxBet} - No buffering: results settle on the server, animations are lightweight CSS/SVG.</p>
      </div>

      {d.bets.length > 0 && (<><h2 className="mt-8 font-serif text-2xl">Your Recent Rounds</h2>
        <ul className="glass mt-3 divide-y divide-[var(--border)]">{d.bets.slice(0, 8).map((b) => (<li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span><strong>{b.game}</strong> <span className="text-[var(--dim)]">- {b.detail}</span></span><span className={b.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>{b.profit >= 0 ? "+" : ""}{b.profit.toFixed(2)}</span></li>))}</ul></>)}
    </section>
  );
}

function GameStage({ engine, result, pending, target }: { engine: string; result: PlayResult | null; pending: boolean; target: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { if (!pending && !result) return; const id = setInterval(() => setTick((x) => x + 1), 90); const stop = setTimeout(() => clearInterval(id), 2600); return () => { clearInterval(id); clearTimeout(stop); }; }, [pending, result]);
  if (engine === "crash") {
    const crashPoint = result?.crashPoint ?? 3.5; const shown = pending ? Math.min(crashPoint, 1 + tick * 0.09) : result ? crashPoint : 1;
    const pts = Array.from({ length: 24 }, (_, i) => { const x = (i / 23) * 100; const y = 88 - Math.min(80, (Math.pow(1 + (shown - 1) * (i / 23), 1.6) - 1) * 26); return `${x},${y}`; }).join(" ");
    const busted = !!result && !pending && result.multiplier === 0;
    return (<div className="rounded-lg bg-black/60 p-4" role="img" aria-label={`Crash chart showing multiplier ${shown.toFixed(2)}x`}>
      <p className={`text-center font-serif text-5xl ${busted ? "text-[var(--danger)]" : "gold-text"}`}>{shown.toFixed(2)}x</p>
      <svg viewBox="0 0 100 92" className="mt-2 h-36 w-full"><polyline points={pts} fill="none" stroke={busted ? "#e07a7a" : "#f0d47a"} strokeWidth="2" />{busted && <text x="62" y="30" fill="#e07a7a" fontSize="9" fontWeight="bold">BUST</text>}</svg>
      <p className="text-center text-xs text-[var(--dim)]">{result ? (busted ? `Crashed at ${crashPoint.toFixed(2)}x - cash-out at ${target}x missed` : `Cashed out at ${target}x before the ${crashPoint.toFixed(2)}x crash`) : "The multiplier climbs - cash out before it bursts."}</p></div>);
  }
  if (engine === "mines") {
    return (<div className="mx-auto grid max-w-sm grid-cols-5 gap-2" role="img" aria-label="Mines 5 by 5 grid">
      {Array.from({ length: 25 }, (_, i) => {
        const isMine = result?.mines.includes(i); const isPick = result?.picks.includes(i);
        const show = !!result && !pending && (isMine || isPick);
        return <span key={i} className={`pop-in flex h-12 items-center justify-center rounded-lg border text-xl ${show ? (isMine ? "border-red-500 bg-red-950" : "border-emerald-500 bg-emerald-950") : "border-[var(--border)] bg-white/5"}`} style={{ animationDelay: `${i * 30}ms` }}>{show ? (isMine ? "\uD83D\uDCA3" : "\uD83D\uDC8E") : "\u25C6"}</span>;
      })}</div>);
  }
  if (engine === "slots") {
    const syms = ["7", "BAR", "\u2666", "\u2660", "\u2665", "\u2663", "\u2605"];
    const reels = result && !pending ? result.cards : [syms[tick % 7] ?? "7", syms[(tick + 3) % 7] ?? "BAR", syms[(tick + 5) % 7] ?? "\u2605"];
    return (<div className="flex items-stretch justify-center gap-3" role="img" aria-label={`Slot reels showing ${reels.join(", ")}`}>
      {reels.map((s, i) => (<span key={i} className="pop-in flex h-24 w-20 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-black/70 font-serif text-3xl gold-text sm:w-24" style={{ animationDelay: `${i * 160}ms` }}>{s}</span>))}
    </div>);
  }
  if (engine === "dice") {
    const shown = pending || !result ? (tick * 37 % 100) : result.roll;
    return (<div className="text-center" role="img" aria-label={`Dice roll ${result && !pending ? result.roll.toFixed(2) : "rolling"}`}>
      <span className="pop-in inline-flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[var(--accent)] bg-black/70 font-serif text-4xl gold-text">{result && !pending ? result.roll.toFixed(0) : shown}</span>
      <p className="mt-2 text-sm text-[var(--dim)]">{result && !pending ? `Rolled ${result.roll.toFixed(2)}` : "Rolling..."}</p></div>);
  }
  if (engine === "roulette") {
    const reds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    return (<div className="flex flex-col items-center" role="img" aria-label={`Roulette wheel, ball on ${result && !pending ? result.roll : "spinning"}`}>
      <div className={`relative h-44 w-44 rounded-full border-4 border-[var(--accent)] ${pending ? "wheel-spin" : ""}`} style={{ background: "conic-gradient(#14532d 0deg 10deg, #7a1f1f 10deg 20deg, #111 20deg 30deg, #7a1f1f 30deg 40deg, #111 40deg 50deg, #7a1f1f 50deg 60deg, #111 60deg 70deg, #7a1f1f 70deg 80deg, #111 80deg 90deg, #7a1f1f 90deg 100deg, #111 100deg 110deg, #7a1f1f 110deg 120deg, #111 120deg 130deg, #7a1f1f 130deg 140deg, #111 140deg 150deg, #7a1f1f 150deg 160deg, #111 160deg 170deg, #7a1f1f 170deg 180deg, #111 180deg 190deg, #7a1f1f 190deg 200deg, #111 200deg 210deg, #7a1f1f 210deg 220deg, #111 220deg 230deg, #7a1f1f 230deg 240deg, #111 240deg 250deg, #7a1f1f 250deg 260deg, #111 260deg 270deg, #7a1f1f 270deg 280deg, #111 280deg 290deg, #7a1f1f 290deg 300deg, #111 300deg 310deg, #7a1f1f 310deg 320deg, #111 320deg 330deg, #7a1f1f 330deg 340deg, #111 340deg 350deg, #7a1f1f 350deg 360deg)" }}>
        <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/85 font-serif text-2xl gold-text">{result && !pending ? result.roll : "\u25CE"}</span></span>
      </div>
      {result && !pending && <p className="pop-in mt-3 text-sm">{result.roll} {result.roll === 0 ? "green" : reds.has(result.roll) ? "red" : "black"}</p>}</div>);
  }
  if (engine === "plinko") {
    const bins = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
    const ballBin = result && !pending ? result.bin : Math.min(8, Math.max(0, 4 + Math.round(Math.sin(tick / 2) * 2)));
    return (<div role="img" aria-label={`Plinko board, ball heading to bin ${ballBin + 1}`}>
      <div className="mx-auto max-w-xs space-y-2 py-2">{Array.from({ length: 6 }, (_, r) => (<div key={r} className="flex justify-center gap-4">{Array.from({ length: r + 3 }, (_, i) => (<span key={i} className="h-2 w-2 rounded-full bg-[var(--accent2)]" />))}</div>))}
        <div className="flex justify-center pt-1"><span className="pop-in h-5 w-5 rounded-full bg-[var(--accent)] shadow-[0_0_14px_rgba(240,212,122,0.8)]" style={{ transform: `translateX(${(ballBin - 4) * 18}px)` }} /></div></div>
      <div className="mx-auto grid max-w-md grid-cols-9 gap-1">{bins.map((b, i) => (<span key={i} className={`rounded px-1 py-2 text-center text-[11px] font-bold ${result && !pending && result.bin === i ? "bg-[var(--accent)] text-black pop-in" : "bg-white/8 text-[var(--dim)]"}`}>{b}x</span>))}</div></div>);
  }
  // Card engines: teenpatti / blackjack / dragontiger / andarbahar
  const cards = result?.cards ?? [];
  if (engine === "blackjack" && cards.length > 2) {
    const sep = cards.indexOf("|"); const you = cards.slice(0, sep); const dealer = cards.slice(sep + 1);
    return (<div className="space-y-4" role="img" aria-label="Blackjack table with your cards and dealer cards">
      <div><p className="mb-2 text-xs tracking-widest text-[var(--dim)]">DEALER</p><div className="flex gap-2">{dealer.map((c, i) => <PlayingCard key={i} label={c} delay={300 + i * 160} />)}</div></div>
      <div><p className="mb-2 text-xs tracking-widest text-[var(--dim)]">YOUR HAND</p><div className="flex gap-2">{you.map((c, i) => <PlayingCard key={i} label={c} delay={i * 160} />)}</div></div>
      <div className="flex gap-2"><Chip amount="BET" color="#7a1f1f" /><Chip amount="3:2" color="#14532d" /></div></div>);
  }
  if (engine === "teenpatti" && cards.length === 6) {
    return (<div className="space-y-4" role="img" aria-label="Teen Patti hands">
      <div><p className="mb-2 text-xs tracking-widest text-[var(--dim)]">DEALER</p><div className="flex gap-2">{cards.slice(3).map((c, i) => <PlayingCard key={i} label={c} delay={480 + i * 160} />)}</div></div>
      <div><p className="mb-2 text-xs tracking-widest text-[var(--dim)]">YOUR HAND</p><div className="flex gap-2">{cards.slice(0, 3).map((c, i) => <PlayingCard key={i} label={c} delay={i * 160} />)}</div></div></div>);
  }
  if (engine === "dragontiger" && cards.length === 2) {
    return (<div className="flex items-center justify-center gap-4" role="img" aria-label="Dragon versus Tiger cards">
      <div className="text-center"><p className="mb-2 text-xs tracking-widest text-red-300">DRAGON</p><PlayingCard label={cards[0] ?? "?"} delay={0} /></div>
      <span className="font-serif text-2xl gold-text">VS</span>
      <div className="text-center"><p className="mb-2 text-xs tracking-widest text-amber-300">TIGER</p><PlayingCard label={cards[1] ?? "?"} delay={220} /></div></div>);
  }
  if (engine === "andarbahar" && cards.length > 0) {
    return (<div role="img" aria-label="Andar Bahar table with joker card">
      <p className="mb-2 text-center text-xs tracking-widest text-[var(--dim)]">JOKER</p>
      <div className="flex justify-center"><PlayingCard label={cards[0] ?? "?"} delay={0} /></div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">{cards.slice(1).map((c, i) => <PlayingCard key={i} label={c} delay={200 + i * 130} />)}</div>
      <p className="mt-2 text-center text-xs text-[var(--dim)]">Cards deal alternately: Andar, Bahar, Andar... until the joker rank matches.</p></div>);
  }
  return (<div className="flex justify-center gap-2 py-6" aria-hidden="true">{["?", "?", "?"].map((c, i) => (<span key={i} className="playing-card inline-flex h-20 w-14 items-center justify-center font-serif text-2xl" style={{ background: "linear-gradient(145deg,#3b0764,#1e1b4b)", color: "#f0d47a" }}>{c}</span>))}</div>);
}

function GameControls({ slug, choice, setChoice, target, setTarget, count, setCount }: { slug: string; choice: string; setChoice: (v: string) => void; target: number; setTarget: (v: number) => void; count: number; setCount: (v: number) => void }) {
  const btn = (val: string, label: string) => (<button key={val} type="button" onClick={() => setChoice(val)} aria-pressed={choice === val} className={`rounded-lg px-3 py-2 text-sm ${choice === val ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{label}</button>);
  if (slug === "crash") return (<div className="mt-3"><label className="block text-sm">Auto cash-out at<span className="mt-1 flex items-center gap-3"><input aria-label="Crash cash-out multiplier" {...FIELDS.playGame.target} type="range" min={1.2} max={10} step={0.1} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="flex-1" /><strong className="font-serif text-xl gold-text">{target.toFixed(1)}x</strong></span></label><p className="text-xs text-[var(--dim)]">Cash out below the crash point and you win {target.toFixed(1)}x.</p></div>);
  if (slug === "mines") return (<div className="mt-3 grid grid-cols-2 gap-3">
    <label className="block text-sm">Mines on board (25 tiles)<input aria-label="Number of mines" {...FIELDS.playGame.count} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
    <label className="block text-sm">Tiles to uncover<input aria-label="Tiles to uncover" {...FIELDS.playGame.target} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label></div>);
  if (slug === "dice") return (<div className="mt-3"><label className="block text-sm">Target number<span className="mt-1 flex items-center gap-3"><input aria-label="Dice target" {...FIELDS.playGame.target} type="range" min={5} max={95} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="flex-1" /><strong className="font-serif text-xl gold-text">{target}</strong></span></label><div className="mt-2 flex gap-2">{btn("under", `Roll under ${target}`)}{btn("over", `Roll over ${target}`)}</div></div>);
  if (slug === "andarbahar") return <div className="mt-3 flex gap-2" role="group" aria-label="Andar Bahar side">{btn("andar", "Andar - pays 1.9x")}{btn("bahar", "Bahar - pays 2.0x")}</div>;
  if (slug === "dragontiger") return <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Dragon Tiger pick">{btn("dragon", "Dragon - 1.95x")}{btn("tiger", "Tiger - 1.95x")}{btn("tie", "Tie - 8x")}</div>;
  if (slug === "roulette") return (<div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Roulette bet type">{btn("red", "Red - 2x")}{btn("black", "Black - 2x")}{btn("green", "Green 0 - 36x")}{btn("even", "Even - 2x")}{btn("odd", "Odd - 2x")}<label className="text-sm">Straight number <input aria-label="Roulette straight number" type="number" min={0} max={36} placeholder="0-36" onChange={(e) => e.target.value !== "" && setChoice(e.target.value)} className="ml-1 w-20 rounded-lg border border-[var(--border)] bg-black/50 px-2 py-1" /></label></div>);
  if (slug === "slots") return <p className="mt-3 text-sm text-[var(--dim)]">Classic 3-reel line: three 7s pay 20x, three BAR 10x, any pair 1.4x.</p>;
  if (slug === "blackjack") return <p className="mt-3 text-sm text-[var(--dim)]">One-tap round: two cards dealt, auto-hit below 15, dealer stands on 17. Blackjack pays 3:2.</p>;
  if (slug === "teenpatti") return <p className="mt-3 text-sm text-[var(--dim)]">Trio beats pure sequence, sequence, flush, pair, then high card. Win pays 1.95x, tie returns your bet.</p>;
  if (slug === "plinko") return <p className="mt-3 text-sm text-[var(--dim)]">Ball drops through 8 rows into 9 bins - edges pay 5.6x, centre 0.5x.</p>;
  return null;
}

function FixtureCard({ f, tk, stake }: { f: State["fixtures"][number]; tk: string; stake: string }) {
  const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const bet = useMutation({ mutationFn: async (pickTeam: string) => await api.placeSportsBet({ token: tk, fixtureId: f.id, pickTeam, stake: Number(stake) || 0 }),
    onSuccess: () => { setMsg("Bet placed with real money - see My Bets."); qc.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => { setMsg(e instanceof Error ? e.message : "Bet failed"); if (!tk) go("login"); } });
  return (
    <article className="glass p-4">
      <p className="text-xs tracking-widest text-[var(--dim)]">{f.sport} - {f.league} - {f.isDemo && !tk ? "DEMO" : f.isDemo ? "DEMO FIXTURE" : "LIVE"} - {f.startsAt}</p>
      <h3 className="mt-1 font-serif text-xl leading-snug">{f.team1} <span className="text-[var(--dim)]">vs</span> {f.team2}</h3>
      <p className="text-sm text-[var(--dim)]">{f.venue}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => bet.mutate(f.team1)} className="rounded-lg border border-[var(--accent)] px-3 py-2 text-left" aria-label={`Bet on ${f.team1} at odds ${f.odds1}`}><span className="block text-sm">{f.team1}</span><strong className="font-serif text-lg gold-text">{f.odds1.toFixed(2)}</strong></button>
        <button type="button" onClick={() => bet.mutate(f.team2)} className="rounded-lg border border-[var(--accent)] px-3 py-2 text-left" aria-label={`Bet on ${f.team2} at odds ${f.odds2}`}><span className="block text-sm">{f.team2}</span><strong className="font-serif text-lg gold-text">{f.odds2.toFixed(2)}</strong></button>
      </div>
      {msg && <p className="mt-2 text-sm text-[var(--accent2)]" role="status">{msg}</p>}
    </article>
  );
}
function MySportsBets({ d }: { d: State }) {
  if (!d.user) return <p className="mt-3 text-sm text-[var(--dim)]">Log in to place bets and see your sports history.</p>;
  return d.sportsBets.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">No sports bets yet.</p> : (
    <ul className="glass mt-3 divide-y divide-[var(--border)]">{d.sportsBets.map((s) => (<li key={s.id} className="px-4 py-3 text-sm"><strong>{s.pick}</strong> - {s.fixtureLabel} @ {s.odds} - Stake {credits(s.stake)} - To win {credits(s.potential)} - <span className="gold-text">{s.status}</span></li>))}</ul>
  );
}
function Sports({ d, tk }: { d: State; tk: string }) {
  const [sport, setSport] = useState("All Sports"); const [league, setLeague] = useState("All Leagues"); const [stake, setStake] = useState("25");
  const fixtures = d.fixtures.filter((f) => (sport === "All Sports" || f.sport === sport) && (league === "All Leagues" || f.league === league));
  const leagues = sport === "Cricket" || sport === "Football" ? LEAGUES[sport] ?? [] : [];
  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-serif text-3xl">Sportsbook</h1>
        <span className={`rounded px-2 py-1 text-xs tracking-widest ${d.hasLiveKeys ? "bg-[var(--good)] text-black" : "border border-[var(--accent)] gold-text"}`}>{d.hasLiveKeys ? "LIVE API CONNECTED" : "DEMO DATA - NO FAKE LIVE SCORES"}</span></div>
      <p className="mt-1 text-sm text-[var(--dim)]">Cricket, Football, Tennis, Basketball, Volleyball, Badminton, Hockey, Baseball, Formula 1 and Esports. Fixtures for sports without a connected feed show as demo/upcoming - scores are never faked; live scores appear only when a live sports feed is connected.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by sport">{SPORTS.map((s) => (<button key={s} type="button" onClick={() => { setSport(s); setLeague("All Leagues"); }} aria-pressed={sport === s} className={`rounded-full px-3 py-1.5 text-sm ${sport === s ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{s}</button>))}</div>
      {leagues.length > 0 && <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by league">{["All Leagues", ...leagues].map((l) => (<button key={l} type="button" onClick={() => setLeague(l)} aria-pressed={league === l} className={`rounded-full px-3 py-1.5 text-xs ${league === l ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{l}</button>))}</div>}
      <label className="mt-4 block max-w-xs text-sm">Stake (real money, USD)<input aria-label="Sports stake in USD" {...FIELDS.placeSportsBet.stake} value={stake} onChange={(e) => setStake(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" /></label>
      {fixtures.length === 0 ? <p className="mt-6 text-sm text-[var(--dim)]">No fixtures loaded for this filter yet. This league's feed activates when the sports API is connected - until then Quvanta does not invent fixtures or scores for it.</p> :
        <div className="mt-4 grid gap-3 md:grid-cols-2">{fixtures.map((f) => <FixtureCard key={f.id} f={f} tk={tk} stake={stake} />)}</div>}
      <h2 className="mt-8 font-serif text-2xl">My Sports Bets</h2><MySportsBets d={d} />
    </section>
  );
}
function Ipl({ d, tk }: { d: State; tk: string }) {
  const [stake, setStake] = useState("25");
  const fixtures = d.fixtures.filter((f) => f.league === "IPL");
  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-serif text-3xl">IPL Dashboard</h1><span className="rounded border border-[var(--accent)] px-2 py-1 text-xs tracking-widest gold-text">{d.hasLiveKeys ? "LIVE API MODE" : "DEMO DATA"}</span></div>
      <p className="mt-1 text-sm text-[var(--dim)]">Teams, schedule, points table, Orange Cap and Purple Cap. {d.hasLiveKeys ? "Live feed connected." : "Standings and caps below are clearly-labelled demo data until the cricket feed is connected - live scores are never faked."}</p>
      <h2 className="mt-6 font-serif text-2xl gold-text">All 10 Teams</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{IPL_TEAMS.map((tm) => (
        <div key={tm.short} className="glass p-4 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full font-serif font-bold text-white" style={{ background: tm.color }}>{tm.short}</span><p className="mt-2 text-sm leading-tight">{tm.name}</p></div>))}</div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="glass overflow-hidden lg:col-span-1"><h2 className="p-4 font-serif text-xl gold-text">Points Table (DEMO)</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-[var(--dim)]"><th className="px-3 py-2">Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th><th>NRR</th></tr></thead>
          <tbody>{DEMO_POINTS.map((r) => (<tr key={r.team} className="border-t border-[var(--border)]"><td className="px-3 py-2">{r.team}</td><td>{r.p}</td><td>{r.w}</td><td>{r.l}</td><td className="font-bold gold-text">{r.pts}</td><td>{r.nrr}</td></tr>))}</tbody></table></div>
        <div className="glass p-4"><h2 className="font-serif text-xl gold-text">Orange Cap (DEMO)</h2><p className="text-xs text-[var(--dim)]">Most runs - demo leaders</p>
          <ul className="mt-3 space-y-2 text-sm">{DEMO_ORANGE.map(([n, r], i) => (<li key={n} className="flex justify-between"><span>{i + 1}. {n}</span><strong className="gold-text">{r} runs</strong></li>))}</ul>
          <h2 className="mt-6 font-serif text-xl gold-text">Purple Cap (DEMO)</h2><p className="text-xs text-[var(--dim)]">Most wickets - demo leaders</p>
          <ul className="mt-3 space-y-2 text-sm">{DEMO_PURPLE.map(([n, w], i) => (<li key={n} className="flex justify-between"><span>{i + 1}. {n}</span><strong className="gold-text">{w} wkts</strong></li>))}</ul></div>
        <div><h2 className="font-serif text-xl gold-text">Schedule &amp; Betting</h2>
          <label className="mt-2 block text-sm">Stake (real money, USD)<input aria-label="IPL stake in USD" {...FIELDS.placeSportsBet.stake} value={stake} onChange={(e) => setStake(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" /></label>
          <div className="mt-3 space-y-3">{fixtures.map((f) => <FixtureCard key={f.id} f={f} tk={tk} stake={stake} />)}</div></div>
      </div>
    </section>
  );
}
function WorldCup({ d, tk }: { d: State; tk: string }) {
  const [stake, setStake] = useState("25");
  const cricket = d.fixtures.filter((f) => f.league === "ICC World Cup"); const fifa = d.fixtures.filter((f) => f.league === "FIFA World Cup");
  const groupBlock = (title: string, groups: typeof WC_GROUPS) => (
    <div className="glass p-4"><h3 className="font-serif text-lg gold-text">{title}</h3>
      {groups.map((g) => (<div key={g.name} className="mt-3"><p className="text-xs tracking-widest text-[var(--dim)]">{g.name.toUpperCase()}</p><ul className="mt-1 space-y-1 text-sm">{g.teams.map((tm, i) => (<li key={tm} className="flex justify-between"><span>{tm}</span><span className="text-[var(--dim)]">{i < 2 ? "Knockout zone" : ""}</span></li>))}</ul></div>))}
      <p className="mt-3 text-xs text-[var(--dim)]">Knockouts: top 2 per group - Semi-finals, then the Final. Demo structure until the live feed is connected.</p></div>
  );
  return (
    <section className="mt-4">
      <h1 className="font-serif text-3xl">World Cups</h1>
      <p className="mt-1 text-sm text-[var(--dim)]">Cricket World Cup and FIFA World Cup hubs: groups, fixtures, points structure and knockouts. {d.hasLiveKeys ? "Live API connected." : "Demo data, clearly labelled."}</p>
      <label className="mt-4 block max-w-xs text-sm">Stake (real money, USD)<input aria-label="World Cup stake in USD" {...FIELDS.placeSportsBet.stake} value={stake} onChange={(e) => setStake(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" /></label>
      <h2 className="mt-6 font-serif text-2xl gold-text">ICC Cricket World Cup</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">{groupBlock("Groups & Points Structure", WC_GROUPS)}<div className="space-y-3 lg:col-span-2">{cricket.map((f) => <FixtureCard key={f.id} f={f} tk={tk} stake={stake} />)}</div></div>
      <h2 className="mt-8 font-serif text-2xl gold-text">FIFA Football World Cup</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">{groupBlock("Groups & Points Structure", FIFA_GROUPS)}<div className="space-y-3 lg:col-span-2">{fifa.map((f) => <FixtureCard key={f.id} f={f} tk={tk} stake={stake} />)}</div></div>
    </section>
  );
}
function WalletPage({ d, tk }: { d: State; tk: string }) {
  const qc = useQueryClient(); const [msg, setMsg] = useState("");
  const [depMethod, setDepMethod] = useState<"UPI" | "USDT">("UPI"); const [depAmt, setDepAmt] = useState(""); const [depRef, setDepRef] = useState(""); const [depShot, setDepShot] = useState("");
  const [wdMethod, setWdMethod] = useState<"UPI" | "USDT">("UPI"); const [wdAmt, setWdAmt] = useState(""); const [wdDest, setWdDest] = useState("");
  const [depLimit, setDepLimit] = useState(""); const [lossLimit, setLossLimit] = useState(""); const [copied, setCopied] = useState("");
  const inv = () => qc.invalidateQueries({ queryKey: ["state"] });
  const deposit = useMutation({ mutationFn: async () => await api.requestDeposit({ token: tk, method: depMethod, amount: Number(depAmt) || 0, ref: depRef, screenshotRef: depShot }),
    onSuccess: () => { setMsg("Deposit request sent. Our verification team will check your UTR / tx-hash and credit your real balance on approval."); setDepAmt(""); setDepRef(""); setDepShot(""); inv(); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Deposit request failed") });
  const withdraw = useMutation({ mutationFn: async () => await api.requestWithdraw({ token: tk, method: wdMethod, amount: Number(wdAmt) || 0, destination: wdDest }),
    onSuccess: () => { setMsg("Withdraw request sent. Your balance will be debited only when the payout is approved and paid out."); setWdAmt(""); setWdDest(""); inv(); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Withdraw request failed") });
  const saveLimits = useMutation({ mutationFn: async () => await api.setLimits({ token: tk, depositLimit: Number(depLimit) || 0, lossLimit: Number(lossLimit) || 0 }),
    onSuccess: () => { setMsg("Responsible-gaming limits saved."); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Could not save limits") });
  if (!d.user) return (<section className="glass mx-auto mt-8 max-w-md p-6 text-center"><h1 className="font-serif text-2xl">Real-Money Wallet</h1><p className="mt-2 text-sm text-[var(--dim)]">Log in to deposit via UPI or USDT, withdraw winnings and see your full money ledger.</p><button type="button" onClick={() => go("login")} className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Log in to open wallet">Log in</button></section>);
  const u = d.user;
  const link = refLink(u.referralCode);
  const copy = async (text: string, label: string) => { try { await navigator.clipboard.writeText(text); setCopied(label); } catch { setCopied(""); setMsg(`Copy manually: ${text}`); } };
  const methodBtn = (cur: string, val: "UPI" | "USDT", set: (v: "UPI" | "USDT") => void, label: string) => (<button key={val} type="button" onClick={() => set(val)} aria-pressed={cur === val} className={`rounded-lg px-4 py-2 text-sm ${cur === val ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{label}</button>);
  return (
    <section className="mt-4">
      <h1 className="font-serif text-3xl">Real-Money Wallet</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--dim)]">This wallet holds <strong className="text-[var(--text)]">real money</strong>. Deposits and withdrawals are manual (UPI / USDT) and every request is verified and approved before money moves. KYC verification is required before withdraw.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="glass p-5"><p className="text-xs tracking-widest text-[var(--dim)]">TOTAL BALANCE - REAL MONEY</p><p className="mt-1 font-serif text-4xl gold-text">{credits(u.balance)}</p></div>
        <div className="glass p-5"><p className="text-xs tracking-widest text-[var(--dim)]">USD BALANCE</p><p className="mt-1 font-serif text-2xl">{credits(u.balanceUsd)}</p><p className="mt-1 text-xs text-[var(--dim)]">UPI deposits credit here</p></div>
        <div className="glass p-5"><p className="text-xs tracking-widest text-[var(--dim)]">USDT BALANCE</p><p className="mt-1 font-serif text-2xl">{u.balanceUsdt.toFixed(2)} USDT</p><p className="mt-1 text-xs text-[var(--dim)]">USDT deposits credit here</p></div>
      </div>
      {msg && <p className="mt-3 text-sm text-[var(--accent2)]" role="status">{msg}</p>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h2 className="font-serif text-xl gold-text">Deposit - Real Money</h2>
          <div className="mt-3 flex gap-2" role="group" aria-label="Deposit method">{methodBtn(depMethod, "UPI", setDepMethod, "UPI")}{methodBtn(depMethod, "USDT", setDepMethod, "USDT (crypto)")}</div>
          <div className="mt-3 rounded-lg bg-black/50 p-3 text-sm">
            {depMethod === "UPI" ? (<><p>Pay to this UPI ID:</p><p className="mt-1 font-mono text-base gold-text">{d.settings["upi_id"] || "Payment details are being updated - please check back shortly"}</p></>) : (<><p>Send USDT (TRC20) to this address:</p><p className="mt-1 break-all font-mono text-sm gold-text">{d.settings["usdt_address"] || "Payment details are being updated - please check back shortly"}</p></>)}
            <p className="mt-1 text-xs text-[var(--dim)]">Pay first, then submit the form - balance credits only after your payment proof is verified and approved.</p>
          </div>
          <label className="mt-3 block text-sm">Amount ({depMethod === "USDT" ? "USDT" : "USD"})<input aria-label="Deposit amount" {...FIELDS.requestDeposit.amount} value={depAmt} onChange={(e) => setDepAmt(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <label className="mt-3 block text-sm">{depMethod === "UPI" ? "UTR number" : "Transaction hash (tx-hash)"}<input aria-label="Deposit UTR or transaction hash" {...FIELDS.requestDeposit.ref} value={depRef} onChange={(e) => setDepRef(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <label className="mt-3 block text-sm">Screenshot reference (file name / link / note)<input aria-label="Deposit screenshot reference" {...FIELDS.requestDeposit.screenshotRef} value={depShot} onChange={(e) => setDepShot(e.target.value)} placeholder="e.g. upi-payment-12jan.png" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <button type="button" disabled={deposit.isPending} onClick={() => { if (!depAmt || Number(depAmt) <= 0) { setMsg("Enter the deposit amount you paid."); return; } if (depRef.trim().length < 4) { setMsg("Enter your UTR number / tx-hash so the payment can be verified."); return; } deposit.mutate(); }} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black disabled:opacity-50" aria-label="Submit deposit request for verification">{deposit.isPending ? "Sending..." : "Submit deposit - for verification"}</button>
        </div>
        <div className="glass p-5">
          <h2 className="font-serif text-xl gold-text">Withdraw - Real Money</h2>
          <p className="mt-2 text-sm text-[var(--dim)]">KYC status: <strong className="text-[var(--text)]">{u.kycStatus}</strong>{u.kycStatus.includes("pending") ? " - verify your email in Profile to complete KYC before withdrawing." : " - verified, withdraw is open."}</p>
          <div className="mt-3 flex gap-2" role="group" aria-label="Withdraw method">{methodBtn(wdMethod, "UPI", setWdMethod, "UPI")}{methodBtn(wdMethod, "USDT", setWdMethod, "USDT (crypto)")}</div>
          <label className="mt-3 block text-sm">Amount ({wdMethod === "USDT" ? "USDT" : "USD"})<input aria-label="Withdraw amount" {...FIELDS.requestWithdraw.amount} value={wdAmt} onChange={(e) => setWdAmt(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <label className="mt-3 block text-sm">{wdMethod === "UPI" ? "Your UPI ID" : "Your USDT address (TRC20)"}<input aria-label="Withdraw destination UPI ID or USDT address" {...FIELDS.requestWithdraw.destination} value={wdDest} onChange={(e) => setWdDest(e.target.value)} placeholder={wdMethod === "UPI" ? "yourname@upi" : "T..."} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <p className="mt-2 text-xs text-[var(--dim)]">Your balance is debited only when the withdraw is approved and paid out - not when you submit.</p>
          <button type="button" disabled={withdraw.isPending} onClick={() => { if (!wdAmt || Number(wdAmt) <= 0) { setMsg("Enter the withdraw amount."); return; } if (wdDest.trim().length < 4) { setMsg(wdMethod === "UPI" ? "Enter your UPI ID to receive the payout." : "Enter your USDT address to receive the payout."); return; } withdraw.mutate(); }} className="mt-4 w-full rounded-lg border border-[var(--accent)] py-2.5 font-semibold gold-text disabled:opacity-50" aria-label="Submit withdraw request for verification">{withdraw.isPending ? "Sending..." : "Request withdraw"}</button>
          <h3 className="mt-6 font-serif text-lg gold-text">Refer &amp; Earn - Rs 10 per signup</h3>
          <p className="mt-1 text-sm text-[var(--dim)]">Share your code or link. When someone signs up with it, <strong className="text-[var(--text)]">Rs 10 real money</strong> is credited to your wallet instantly - it appears as +10.00 in your wallet balance and ledger.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-lg bg-black/50 px-3 py-2 font-mono text-lg gold-text">{u.referralCode}</span>
            <button type="button" onClick={() => copy(u.referralCode, "code")} className="rounded-lg border border-[var(--accent)] px-3 py-2 text-sm" aria-label="Copy my referral code">{copied === "code" ? "Copied!" : "Copy code"}</button>
            <button type="button" onClick={() => copy(link, "link")} className="rounded-lg border border-[var(--accent)] px-3 py-2 text-sm" aria-label="Copy my referral link">{copied === "link" ? "Link copied!" : "Copy referral link"}</button></div>
          <p className="mt-2 break-all text-xs text-[var(--dim)]">{link}</p>
          <p className="mt-3 text-sm">Total earned from referrals: <strong className="gold-text">Rs {d.referralEarned}</strong> ({d.referrals.length} referral{d.referrals.length === 1 ? "" : "s"})</p>
          {d.referrals.length === 0 ? <p className="mt-1 text-sm text-[var(--dim)]">No referrals yet - share your link to earn Rs 10 per signup.</p> : (
            <ul className="mt-2 divide-y divide-[var(--border)] rounded-lg bg-black/30">{d.referrals.map((r) => (<li key={r.id} className="flex justify-between gap-3 px-3 py-2 text-sm"><span>{r.name} <span className="text-[var(--dim)]">({r.email})</span></span><strong className="text-[var(--good)]">+ Rs {r.earned}</strong></li>))}</ul>)}
        </div>
      </div>
      <h2 className="mt-8 font-serif text-2xl">Deposit / Withdraw Requests</h2>
      {d.requests.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">No requests yet.</p> : (
        <ul className="glass mt-3 divide-y divide-[var(--border)]">{d.requests.slice(0, 15).map((r) => (<li key={r.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span className="capitalize"><strong>{r.kind}</strong> - {r.method} - {r.amount.toFixed(2)} {r.currency}{r.ref ? ` - UTR/Tx: ${r.ref}` : ""}{r.destination ? ` - to ${r.destination}` : ""}</span><span className={r.status === "approved" ? "text-[var(--good)]" : r.status === "rejected" ? "text-[var(--danger)]" : "gold-text"}>{r.status}{r.status === "rejected" && r.rejectReason ? ` - ${r.rejectReason}` : ""}</span></li>))}</ul>)}
      <div className="glass mt-6 p-4">
        <h2 className="font-serif text-xl gold-text">Responsible Gaming Controls</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">Daily deposit limit (USD, 0 = none)<input aria-label="Daily deposit limit in USD" {...FIELDS.setLimits.depositLimit} value={depLimit || (u.depositLimit ? String(u.depositLimit) : "")} onChange={(e) => setDepLimit(e.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <label className="block text-sm">Daily loss limit (USD, 0 = none)<input aria-label="Daily loss limit in USD" {...FIELDS.setLimits.lossLimit} value={lossLimit || (u.lossLimit ? String(u.lossLimit) : "")} onChange={(e) => setLossLimit(e.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
          <div className="flex items-end"><button type="button" onClick={() => saveLimits.mutate()} className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-black" aria-label="Save responsible gaming limits">Save limits</button></div>
        </div>
        <p className="mt-2 text-xs text-[var(--dim)]">Deposit requests that would cross your daily deposit limit are blocked, and play pauses for the day once your daily loss limit is hit. Full guidance is on the Responsible Gaming page; ask support for self-exclusion at any time.</p>
      </div>
      <h2 className="mt-8 font-serif text-2xl">Wallet Ledger - Every Deposit, Bet, Win &amp; Withdraw</h2>
      {d.ledger.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">No transactions yet. Deposit to start playing.</p> : (
        <ul className="glass mt-3 divide-y divide-[var(--border)]">{d.ledger.slice(0, 20).map((l) => (<li key={l.id} className="flex justify-between gap-3 px-4 py-3 text-sm"><span className="capitalize">{l.type} - <span className="text-[var(--dim)]">{l.note}</span> <span className="text-[var(--dim)]">({l.currency})</span></span><span className={l.amount >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>{l.amount >= 0 ? "+" : ""}{l.amount.toFixed(2)}</span></li>))}</ul>)}
    </section>
  );
}
function ProfilePage({ d, tk, onLogout }: { d: State; tk: string; onLogout: () => void }) {
  const qc = useQueryClient(); const [code, setCode] = useState(""); const [msg, setMsg] = useState("");
  const verify = useMutation({ mutationFn: async () => await api.verifyEmail({ token: tk, code }), onSuccess: () => { setMsg("Email verified. KYC status updated."); qc.invalidateQueries({ queryKey: ["state"] }); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Verification failed") });
  if (!d.user) return (<section className="glass mx-auto mt-8 max-w-md p-6 text-center"><h1 className="font-serif text-2xl">Profile</h1><p className="mt-2 text-sm text-[var(--dim)]">Log in to see your dashboard, favorites and history.</p><button type="button" onClick={() => go("login")} className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Log in to open profile">Log in</button></section>);
  const favGames = d.games.filter((g) => d.user?.favorites.includes(g.slug));
  return (
    <section className="mt-4">
      <h1 className="font-serif text-3xl">My Dashboard</h1>
      <div className="glass mt-4 p-5">
        <p className="font-serif text-2xl gold-text">{d.user.name}</p>
        <p className="mt-1 text-sm text-[var(--dim)]">{d.user.email} - Role: {d.user.role} - KYC: {d.user.kycStatus}</p>
        <p className="mt-1 text-sm">Real-money balance: <strong className="gold-text">{credits(d.user.balance)}</strong> (USD {credits(d.user.balanceUsd)} + {d.user.balanceUsdt.toFixed(2)} USDT)</p>
        <div className="mt-3 rounded-lg bg-black/40 p-3 text-sm"><p>Refer &amp; Earn: your code <strong className="font-mono gold-text">{d.user.referralCode}</strong> - every signup with it credits you <strong>Rs 10 real money</strong> (10.00 in your wallet balance). Total earned: <strong className="gold-text">Rs {d.referralEarned}</strong> from {d.referrals.length} referral{d.referrals.length === 1 ? "" : "s"}. Full referral link and history are in your Wallet.</p></div>
        {d.user.kycStatus.includes("pending") && (<div className="mt-3 flex flex-wrap gap-2"><label className="text-sm">Email verification code (shown at signup)<input aria-label="Email verification code" {...FIELDS.verifyEmail.code} value={code} onChange={(e) => setCode(e.target.value)} className="ml-2 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-1.5" /></label>
          <button type="button" onClick={() => verify.mutate()} className="rounded-lg bg-[var(--accent)] px-4 py-1.5 font-semibold text-black" aria-label="Verify email with code">Verify email</button></div>)}
        {msg && <p className="mt-2 text-sm text-[var(--accent2)]" role="status">{msg}</p>}
        <button type="button" onClick={onLogout} className="mt-4 rounded-lg border border-[var(--danger)] px-4 py-2 text-sm text-[var(--danger)]" aria-label="Log out of Quvanta">Log out</button>
      </div>
      <h2 className="mt-8 font-serif text-2xl gold-text">Favorite Games</h2>
      {favGames.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">No favorites yet - tap the star on any game.</p> : <div className="mt-3 flex flex-wrap gap-2">{favGames.map((g) => (<button key={g.slug} type="button" onClick={() => go(`game/${g.slug}`)} className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm" aria-label={`Play favorite ${g.name}`}>\u2605 {g.name}</button>))}</div>}
      <h2 className="mt-8 font-serif text-2xl gold-text">Game History</h2>
      {d.bets.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">No rounds played yet.</p> : (
        <ul className="glass mt-3 divide-y divide-[var(--border)]">{d.bets.slice(0, 15).map((b) => (<li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span><strong>{b.game}</strong> <span className="text-[var(--dim)]">- {b.detail}</span></span><span className={b.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>{b.profit >= 0 ? "+" : ""}{b.profit.toFixed(2)}</span></li>))}</ul>)}
      <h2 className="mt-8 font-serif text-2xl gold-text">Match History</h2><MySportsBets d={d} />
    </section>
  );
}

// ---------- First page: Login / Create Account gate ----------
// This is the ONLY thing a logged-out visitor sees. Login and Create Account
// are tabs on this one page; a successful login enters the dashboard at once,
// and a successful signup shows its confirmation (with the verification code)
// here before the Enter button takes the user into the dashboard. There is
// deliberately no link or mention of the operator portal anywhere on it.
function AuthGate({ setTk, route, loading, loadError }: { setTk: (t: string) => void; route: string; loading: boolean; loadError: boolean }) {
  const [tab, setTab] = useState<"login" | "signup">(route.startsWith("signup") ? "signup" : "login");
  useEffect(() => { if (route.startsWith("signup")) setTab("signup"); else if (route === "login") setTab("login"); }, [route]);
  if (loading) return (<div className="felt flex min-h-screen items-center justify-center px-4 text-[var(--text)]"><div className="text-center"><p className="font-serif text-3xl tracking-[0.18em] gold-text">QUVANTA</p><p className="mt-3 text-sm text-[var(--dim)]">Loading...</p></div></div>);
  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-safe">
        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="font-serif text-3xl tracking-[0.18em] gold-text sm:text-4xl">QUVANTA</p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-[var(--dim)]">PREMIUM CASINO &amp; SPORTS</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--dim)]">Everything lives inside the dashboard - 200+ games, sportsbook, IPL, World Cups, your real-money wallet and Refer &amp; Earn. Log in or create an account to enter.</p>
        </div>
        <div className="mx-auto mt-5 flex max-w-md gap-2" role="tablist" aria-label="Login or create account">
          <button type="button" role="tab" aria-selected={tab === "login"} onClick={() => setTab("login")} className={`flex-1 rounded-lg py-2.5 text-sm ${tab === "login" ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>Log in</button>
          <button type="button" role="tab" aria-selected={tab === "signup"} onClick={() => setTab("signup")} className={`flex-1 rounded-lg py-2.5 text-sm ${tab === "signup" ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>Create Account</button>
        </div>
        {loadError && <p className="mx-auto mt-4 max-w-md text-center text-sm text-[var(--danger)]" role="alert">Could not load Quvanta. Check your connection and refresh.</p>}
        {tab === "login" ? <LoginPage setTk={setTk} onSwitch={() => setTab("signup")} /> : <SignupPage setTk={setTk} onSwitch={() => setTab("login")} />}
        <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-2">
          {(["faq", "terms", "privacy", "responsible"] as const).map((p) => (<button key={p} type="button" onClick={() => go(`info/${p}`)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs capitalize" aria-label={`Open ${p} page`}>{p === "responsible" ? "Responsible Gaming" : p}</button>))}
        </div>
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-[var(--dim)]">18+ only. Quvanta is a real-money platform: deposits via UPI / USDT, withdrawals after KYC verification. Play responsibly.</p>
      </main>
    </div>
  );
}

function LoginPage({ setTk, onSwitch }: { setTk: (t: string) => void; onSwitch?: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [resetEmail, setResetEmail] = useState(""); const [resetCode, setResetCode] = useState(""); const [newPw, setNewPw] = useState(""); const [resetMsg, setResetMsg] = useState("");
  const login = useMutation({ mutationFn: async () => await api.login({ identifier: email, password }),
    onSuccess: (r) => { localStorage.setItem("quvanta_token", r.token); setTk(r.token); qc.invalidateQueries(); go("home"); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Login failed") });
  const reqReset = useMutation({ mutationFn: async () => await api.requestReset({ email: resetEmail }), onSuccess: (r) => setResetMsg(`Demo reset code (no email service connected, shown here only for demo): ${r.resetCode}`), onError: (e) => setResetMsg(e instanceof Error ? e.message : "Reset failed") });
  const doReset = useMutation({ mutationFn: async () => await api.resetPassword({ email: resetEmail, code: resetCode, newPassword: newPw }), onSuccess: () => setResetMsg("Password reset done. Log in with the new password."), onError: (e) => setResetMsg(e instanceof Error ? e.message : "Reset failed") });
  return (
    <section className="glass mx-auto mt-8 max-w-md p-6">
      <h1 className="font-serif text-3xl">Log in to Quvanta</h1>
      <p className="mt-1 text-sm text-[var(--dim)]">Your session stays logged in after reload until you log out.</p>
      <label className="mt-4 block text-sm">Email<input aria-label="Login email" {...FIELDS.login.identifier} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
      <label className="mt-3 block text-sm">Password<input aria-label="Login password" {...FIELDS.login.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
      {err && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{err}</p>}
      <button type="button" disabled={login.isPending} onClick={() => login.mutate()} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black disabled:opacity-50" aria-label="Log in with email and password">{login.isPending ? "Checking..." : "Log in"}</button>
      <p className="mt-4 text-center text-sm text-[var(--dim)]">New here? <button type="button" onClick={() => (onSwitch ? onSwitch() : go("signup"))} className="gold-text underline" aria-label="Go to sign up">Create an account</button></p>
      <details className="mt-5">
        <summary className="cursor-pointer text-sm gold-text">Forgot password?</summary>
        <label className="mt-3 block text-sm">Account email<input aria-label="Password reset email" {...FIELDS.requestReset.email} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <button type="button" onClick={() => reqReset.mutate()} className="mt-2 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm" aria-label="Request password reset code">Get reset code</button>
        <label className="mt-3 block text-sm">Reset code<input aria-label="Password reset code" {...FIELDS.resetPassword.code} value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-2 block text-sm">New password<input aria-label="New password" {...FIELDS.resetPassword.newPassword} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <button type="button" onClick={() => doReset.mutate()} className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black" aria-label="Reset password with code">Reset password</button>
        {resetMsg && <p className="mt-2 text-sm text-[var(--accent2)]" role="status">{resetMsg}</p>}
      </details>
    </section>
  );
}
function SignupPage({ setTk, onSwitch }: { setTk: (t: string) => void; onSwitch?: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [dob, setDob] = useState("");
  const [refCode, setRefCode] = useState(() => { const m = window.location.hash.match(/[?&]ref=([A-Za-z0-9]+)/); return m?.[1]?.toUpperCase() ?? ""; });
  const [err, setErr] = useState(""); const [done, setDone] = useState(""); const [pendingToken, setPendingToken] = useState("");
  const signup = useMutation({ mutationFn: async () => await api.signup({ name, email, password, dob, referralCode: refCode }),
    onSuccess: (r) => { localStorage.setItem("quvanta_token", r.token); setPendingToken(r.token); setDone(`Account created with a $0.00 real-money balance - deposit via UPI or USDT in your Wallet to start playing. Your own referral code is ${r.user.referralCode}. Your email verification code is ${r.verifyCode} - enter it in Profile to finish KYC verification (demo: no email service connected, so the code is shown here).`); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Signup failed") });
  return (
    <section className="glass mx-auto mt-8 max-w-md p-6">
      <h1 className="font-serif text-3xl">Create your account</h1>
      <p className="mt-1 text-sm text-[var(--dim)]">18+ only - date of birth is checked. New accounts start at $0.00 real balance; deposit via UPI or USDT after signup. Have a referral code? The referrer earns Rs 10 real money (10.00 wallet credit) when you sign up with it.</p>
      {done ? (<div role="status"><p className="mt-3 text-sm leading-relaxed text-[var(--accent2)]">{done}</p><button type="button" onClick={() => { setTk(pendingToken); qc.invalidateQueries(); go("home"); }} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black" aria-label="Enter dashboard after signup">Enter dashboard</button></div>) : (<>
        <label className="mt-4 block text-sm">Full name<input aria-label="Signup full name" {...FIELDS.signup.name} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Email<input aria-label="Signup email" {...FIELDS.signup.email} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Password (min 6 characters)<input aria-label="Signup password" {...FIELDS.signup.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Date of birth (18+)<input aria-label="Signup date of birth" {...FIELDS.signup.dob} type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Referral code (optional)<input aria-label="Signup referral code" {...FIELDS.signup.referralCode} value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="e.g. QVAB12CD" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        {err && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{err}</p>}
        <button type="button" disabled={signup.isPending} onClick={() => { if (!name.trim() || !email.trim() || !password || !dob) { setErr("Fill name, email, password and date of birth."); return; } signup.mutate(); }} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black disabled:opacity-50" aria-label="Create account">{signup.isPending ? "Creating..." : "Sign up - start at $0.00"}</button>
        <p className="mt-3 text-center text-sm text-[var(--dim)]">Already have an account? <button type="button" onClick={() => (onSwitch ? onSwitch() : go("login"))} className="gold-text underline" aria-label="Go to login">Log in</button></p>
      </>)}
    </section>
  );
}
const INFO: Record<string, { title: string; body: string[] }> = {
  faq: { title: "FAQ", body: ["Is Quvanta real money? Yes. Balances are real money in USD and USDT. New accounts start at $0.00 - deposit to play.", "How do I deposit? In Wallet, pay the shown UPI ID or USDT address, then submit the amount with your UTR / tx-hash and a screenshot reference. Our verification team checks and approves it, then your balance is credited.", "How do I withdraw? Enter the amount and your UPI ID or USDT address in Wallet. KYC must be verified first, and your balance is debited only when the payout is approved and paid. Rejections show the reason provided.", "What is Refer & Earn? Every user has a referral code and link (Wallet / Profile). When a new user signs up with it, you get Rs 10 real money, credited as 10.00 in your wallet balance.", "Why does the sportsbook say DEMO? Live scores and odds need live API keys (CricAPI, The Odds API) to be connected. Quvanta never fakes live scores.", "How are game results decided? On the server, with a provably-fair hash stored on every round in your history."] },
  terms: { title: "Terms of Use", body: ["Quvanta is an entertainment platform for users aged 18 and over. By registering you confirm your date of birth is accurate.", "Balances are real money (USD / USDT). Deposits and withdrawals are processed manually after verification; Quvanta may reject a request with a stated reason, and may hold a request for compliance checks.", "Game outcomes are generated on the server using a provably-fair process. Quvanta may add, edit or remove games and promotions at any time.", "Accounts found abusing referrals, payment proofs or automation may be suspended. One account per person; self-referral is not rewarded.", "Real-money operation requires a valid Curacao / Anjouan licence, KYC verification and payment compliance for the operator's jurisdiction; until the operator adds them, the platform runs in demo mode. Real-money gambling is illegal in most Indian states - it is the player's responsibility to check local law."] },
  privacy: { title: "Privacy Policy", body: ["We store only what the platform needs: your name, email, hashed password (never the plain password), date of birth for the 18+ check, game and sports history, favorites and credit ledger.", "Passwords are stored as salted hashes; sessions use random tokens stored server-side. Login attempts are rate-limited.", "We do not sell personal data. API keys are stored server-side only and are never displayed back.", "You may request account deletion via support; demo data in this hosted build lives in the artifact's own database."] },
  responsible: { title: "Responsible Gaming", body: ["Quvanta uses real money, so limits matter. Set a daily deposit limit and a daily loss limit in your Wallet - deposits over the limit are blocked and play pauses when the loss limit is hit.", "Never chase losses and never play with money you cannot afford to lose. Take regular breaks; if play stops being fun, stop.", "18+ only. Keep your account away from minors.", "If gambling (real-money, elsewhere) is affecting your life, contact a local support organisation - in India: search for gambling addiction helplines in your state; internationally: Gamblers Anonymous (gamblersanonymous.org).", "Self-exclusion: ask support to suspend your account at any time - our support team can suspend it right away."] },
};
function InfoPage({ page }: { page: string }) {
  const info = INFO[page] ?? INFO.faq;
  return (
    <section className="glass mx-auto mt-6 max-w-3xl p-6">
      <h1 className="font-serif text-3xl gold-text">{info?.title}</h1>
      {(info?.body ?? []).map((p, i) => <p key={i} className="mt-3 text-sm leading-relaxed">{p}</p>)}
      <button type="button" onClick={() => go("home")} className="mt-5 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm" aria-label="Back to lobby from info page">Back to lobby</button>
    </section>
  );
}

// ---------- Operator portal login (hidden route: #/admin-login) ----------
// This page is the ONLY entrance to the operator portal. It is never linked
// from the player site, carries no player-site branding and no link back to
// the player site. It uses its own session key (quvanta_admin_token), fully
// separate from the player session. Player accounts are denied here: their
// session is destroyed server-side and nothing is stored.
function AdminLoginPage({ setATk }: { setATk: (t: string) => void }) {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const login = useMutation({
    mutationFn: async () => await api.login({ identifier: username, password }),
    onSuccess: async (r) => {
      if (r.user.role !== "admin") {
        // Player account: kill the just-created session and store nothing.
        try { await api.logout({ token: r.token }); } catch { /* session cleanup is best-effort */ }
        setErr("Access denied. This account is not authorised for this portal.");
        return;
      }
      localStorage.setItem("quvanta_admin_token", r.token);
      setATk(r.token);
      qc.invalidateQueries();
      // No navigation: login and dashboard share this one hidden address, so
      // the portal simply swaps the form for the dashboard in place.
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Login failed"),
  });
  return (
    <div className="felt flex min-h-screen items-center justify-center px-4 text-[var(--text)]">
      <section className="glass w-full max-w-sm p-6">
        <p className="text-[11px] tracking-[0.3em] text-[var(--dim)]">RESTRICTED ACCESS</p>
        <h1 className="mt-2 font-serif text-2xl">Operator Portal</h1>
        <p className="mt-1 text-sm text-[var(--dim)]">Authorised operators only. All other accounts will be denied.</p>
        <label className="mt-5 block text-sm">Username
          <input aria-label="Operator portal username" {...FIELDS.login.identifier} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Password
          <input aria-label="Operator portal password" {...FIELDS.login.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
        {err && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{err}</p>}
        <button type="button" disabled={login.isPending} onClick={() => { if (!username.trim() || !password) { setErr("Enter username and password."); return; } login.mutate(); }} className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black disabled:opacity-50" aria-label="Log in to operator portal">{login.isPending ? "Checking..." : "Log in"}</button>
      </section>
    </div>
  );
}

function AdminPage({ tk, setTk }: { tk: string; setTk: (t: string) => void }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["state", tk], queryFn: () => api.getState({ token: tk }) });
  const user = me.data?.user ?? null;
  const admin = useQuery({ queryKey: ["admin", tk], queryFn: () => api.getAdminState({ token: tk }), enabled: !!user && user.role === "admin" });
  const readme = useQuery({ queryKey: ["readme", tk], queryFn: () => api.getReadme({ token: tk }), enabled: !!user && user.role === "admin" });
  const [tab, setTab] = useState<"dash" | "requests" | "games" | "users" | "settings" | "sell">("dash");
  const [msg, setMsg] = useState("");
  const inv = () => { qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["state"] }); };
  const toggle = useMutation({ mutationFn: async (v: { slug: string; enabled: boolean }) => await api.toggleGame({ token: tk, slug: v.slug, enabled: v.enabled }), onSuccess: inv });
  const del = useMutation({ mutationFn: async (slug: string) => await api.adminDeleteGame({ token: tk, slug }), onSuccess: () => { setMsg("Game removed from catalog."); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Delete failed") });
  const suspend = useMutation({ mutationFn: async (v: { userId: number; suspended: boolean }) => await api.adminSuspendUser({ token: tk, userId: v.userId, suspended: v.suspended }), onSuccess: inv });
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const review = useMutation({ mutationFn: async (v: { requestId: number; approve: boolean }) => await api.adminReviewRequest({ token: tk, requestId: v.requestId, approve: v.approve, reason: rejectReasons[v.requestId] ?? "" }),
    onSuccess: (_r, v) => { setMsg(v.approve ? "Request approved - player balance updated." : "Request rejected with reason."); inv(); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Review failed") });
  const [gf, setGf] = useState({ slug: "", name: "", category: "Slots", engine: "slots", rtp: 96, description: "", tag: "" });
  const saveGame = useMutation({ mutationFn: async () => await api.adminSaveGame({ token: tk, ...gf }), onSuccess: () => { setMsg(`Game "${gf.name}" saved.`); setGf({ slug: "", name: "", category: "Slots", engine: "slots", rtp: 96, description: "", tag: "" }); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed") });
  const [adjUser, setAdjUser] = useState(0); const [adjAmt, setAdjAmt] = useState("");
  const adjust = useMutation({ mutationFn: async () => await api.adminAdjustCredits({ token: tk, userId: adjUser, amount: Number(adjAmt) || 0, note: "Balance adjustment" }), onSuccess: () => { setMsg("Credits adjusted."); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Adjust failed") });
  const [setForm, setSetForm] = useState<Record<string, string>>({});
  const sf = (k: string) => setForm[k] ?? admin.data?.settings[k] ?? "";
  const saveSet = useMutation({ mutationFn: async () => await api.saveSettings({ token: tk, values: setForm }), onSuccess: () => { setMsg("Settings saved."); setSetForm({}); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed") });
  const [tn, setTn] = useState({ name: "", domain: "", monthlyRent: "750", commission: "15", model: "rent", color: "#0a0a0f" });
  const createTenant = useMutation({ mutationFn: async () => await api.createTenant({ token: tk, name: tn.name, domain: tn.domain, monthlyRent: Number(tn.monthlyRent) || 0, commission: Number(tn.commission) || 0, model: tn.model, color: tn.color, currency: "USD" }), onSuccess: () => { setMsg("Tenant created."); inv(); }, onError: (e) => setMsg(e instanceof Error ? e.message : "Tenant failed") });
  const logoutAdmin = useMutation({ mutationFn: async () => await api.logout({ token: tk }), onSuccess: () => { localStorage.removeItem("quvanta_admin_token"); setTk(""); qc.invalidateQueries(); } });
  const [credCur, setCredCur] = useState(""); const [credName, setCredName] = useState(""); const [credPw, setCredPw] = useState(""); const [credPw2, setCredPw2] = useState("");
  useEffect(() => { if (user?.username && !credName) setCredName(user.username); }, [user?.username]);
  const changeCred = useMutation({ mutationFn: async () => await api.adminChangeCredentials({ token: tk, currentPassword: credCur, newUsername: credName.trim(), newPassword: credPw }),
    onSuccess: (r) => { setMsg(`Admin login updated - username is now "${r.username}". The old username/password no longer work; use the new login from now on.`); setCredCur(""); setCredPw(""); setCredPw2(""); qc.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Credential change failed") });

  // Single hidden address for the whole portal: with no operator session this
  // route shows only the portal login form; with one, the dashboard below.
  if (me.data && !user) return <AdminLoginPage setATk={setTk} />;

  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <header className="border-b border-[var(--accent)]/50 bg-black/80 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div><p className="font-serif text-2xl tracking-[0.18em] gold-text">OPERATOR PORTAL</p><p className="text-[11px] tracking-widest text-[var(--dim)]">RESTRICTED ACCESS - AUTHORISED OPERATORS ONLY</p></div>
          <div className="flex gap-2">
            {user?.role === "admin" && <button type="button" onClick={() => logoutAdmin.mutate()} className="rounded-full border border-[var(--danger)] px-4 py-2 text-sm text-[var(--danger)]" aria-label="Operator log out">Log out</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-16">
        {me.isPending && <p className="mt-10 text-center text-[var(--dim)]">Checking operator session...</p>}
        {user && user.role !== "admin" && (
          <section className="glass mx-auto mt-10 max-w-md p-6 text-center" role="alert">
            <h1 className="font-serif text-2xl text-[var(--danger)]">Access denied</h1>
            <p className="mt-2 text-sm text-[var(--dim)]">The account {user.email} is not authorised for this portal.</p>
            <button type="button" onClick={() => logoutAdmin.mutate()} className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Log out and return to portal login">Log out</button>
          </section>
        )}
        {user?.role === "admin" && (
          <>
            <nav className="mt-4 flex flex-wrap gap-2" aria-label="Admin sections">
              {([["dash", "Dashboard"], ["requests", "Deposit / Withdraw Queue"], ["games", "Games"], ["users", "Users"], ["settings", "Payments / API / Settings"], ["sell", "Sell / Tenants / README"]] as const).map(([tb, label]) => (
                <button key={tb} type="button" onClick={() => setTab(tb)} aria-pressed={tab === tb} className={`rounded-full px-4 py-2 text-sm ${tab === tb ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"}`}>{label}</button>
              ))}
            </nav>
            {msg && <p className="mt-3 text-sm text-[var(--accent2)]" role="status">{msg}</p>}
            {admin.isPending && <p className="mt-6 text-[var(--dim)]">Loading admin data...</p>}
            {admin.data && tab === "dash" && (
              <>
                <div className="glass mt-4 p-4">
                  <h2 className="font-serif text-xl gold-text">Admin Account - Change Username / Password</h2>
                  <p className="mt-1 text-sm text-[var(--dim)]">There is only one admin account ({user?.email}) and it can never be created from player signup. Current username: <strong className="text-[var(--text)]">{user?.username || "admin"}</strong>. A change is saved immediately and survives reload - the old username/password stop working and only the new login works.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">Current password (required)<input aria-label="Admin current password" {...FIELDS.adminChangeCredentials.currentPassword} type="password" value={credCur} onChange={(e) => setCredCur(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">New username<input aria-label="Admin new username" {...FIELDS.adminChangeCredentials.newUsername} value={credName} onChange={(e) => setCredName(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">New password (blank = keep current)<input aria-label="Admin new password" {...FIELDS.adminChangeCredentials.newPassword} type="password" value={credPw} onChange={(e) => setCredPw(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">Confirm new password<input aria-label="Admin confirm new password" type="password" value={credPw2} onChange={(e) => setCredPw2(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  </div>
                  <button type="button" disabled={changeCred.isPending} onClick={() => { if (!credCur) { setMsg("Pehle current password likho - bina uske credentials change nahi honge."); return; } if (credPw && credPw !== credPw2) { setMsg("New password aur confirm password match nahi kar rahe."); return; } if (!credPw && credName.trim().toLowerCase() === (user?.username || "").toLowerCase()) { setMsg("Kuch change to karo - naya username ya naya password likho."); return; } changeCred.mutate(); }} className="mt-3 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black disabled:opacity-50" aria-label="Save new admin username and password">{changeCred.isPending ? "Saving..." : "Save new login"}</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {[["Total games", String(admin.data.stats.totalGames)], ["Registered users", String(admin.data.stats.totalUsers)], ["Total rounds", String(admin.data.stats.totalBets)], ["Real money wagered ($)", admin.data.stats.totalWagered.toFixed(2)], ["Real money paid out ($)", admin.data.stats.totalPayout.toFixed(2)], ["GGR ($)", admin.data.stats.ggr.toFixed(2)], ["Pending deposit/withdraw requests", String(admin.data.stats.pendingRequests)], ["Total referrals", String(admin.data.stats.totalReferrals)], ["Referral payouts (Rs)", String(admin.data.stats.referralPayouts)]].map(([k, v]) => (
                    <div key={k ?? ""} className="glass p-4"><p className="text-xs tracking-widest text-[var(--dim)]">{(k ?? "").toUpperCase()}</p><p className="mt-1 font-serif text-2xl gold-text">{v ?? ""}</p></div>
                  ))}
                </div>
                <h2 className="mt-8 font-serif text-2xl">Activity Logs - Latest Rounds</h2>
                {admin.data.logs.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">No rounds played yet.</p> : (
                  <ul className="glass mt-3 divide-y divide-[var(--border)]">{admin.data.logs.map((l) => (<li key={l.id} className="flex justify-between gap-3 px-4 py-3 text-sm"><span><strong>{l.game}</strong> - <span className="text-[var(--dim)]">{l.detail}</span></span><span className={l.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>{l.profit >= 0 ? "+" : ""}{l.profit.toFixed(2)}</span></li>))}</ul>)}
                <div className="glass mt-6 border-[var(--danger)] p-4"><h2 className="font-serif text-xl text-[var(--danger)]">Launch Checklist - REAL-MONEY WARNING</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-6 text-sm"><li><strong>DEMO MODE until licence is added:</strong> real-money launch needs a Curacao / Anjouan gaming licence, full KYC verification and payment compliance before accepting real player funds. Do not go live without them.</li><li>Set the platform UPI ID and USDT payout/deposit address in Settings - Payments, and verify every UTR / tx-hash in the Deposit / Withdraw Queue before approving.</li><li>Geo-block restricted jurisdictions ({admin.data.settings["geo_block"] || "US, UK, AU"}) and enforce 18+ KYC on withdrawals.</li><li>Add CricAPI + Odds API keys in Settings to switch sportsbook from DEMO to LIVE.</li><li>Phase 2: aggregator contract (Slotegrator) for third-party games.</li></ul></div>
              </>
            )}
            {admin.data && tab === "requests" && (
              <>
                <h2 className="mt-4 font-serif text-2xl">Deposit / Withdraw Approval Queue</h2>
                <p className="mt-1 text-sm text-[var(--dim)]">Verify the UTR / tx-hash or screenshot reference before approving. Approving a deposit credits the player; approving a withdraw debits the player and means you have paid out. Rejections must carry a reason - the player sees it.</p>
                {admin.data.requests.length === 0 ? <p className="mt-3 text-sm text-[var(--dim)]">No deposit or withdraw requests yet.</p> : (
                  <ul className="mt-3 space-y-2">{admin.data.requests.map((r) => (
                    <li key={r.id} className="glass px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span><strong className="capitalize">{r.kind}</strong> - {r.userEmail} - {r.method} - <strong className="gold-text">{r.amount.toFixed(2)} {r.currency}</strong>{r.ref ? ` - UTR/Tx: ${r.ref}` : ""}{r.destination ? ` - Payout to: ${r.destination}` : ""}{r.screenshotRef ? ` - Screenshot: ${r.screenshotRef}` : ""}</span>
                        <span className={r.status === "approved" ? "text-[var(--good)]" : r.status === "rejected" ? "text-[var(--danger)]" : "gold-text"}>{r.status}{r.status === "rejected" && r.rejectReason ? ` - ${r.rejectReason}` : ""}</span>
                      </div>
                      {r.status === "pending" && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <label className="text-xs">Reject reason<input aria-label={`Reject reason for request ${r.id}`} {...FIELDS.adminReviewRequest.reason} value={rejectReasons[r.id] ?? ""} onChange={(e) => setRejectReasons((prev) => ({ ...prev, [r.id]: e.target.value }))} placeholder="Required when rejecting" className="ml-2 w-56 rounded-lg border border-[var(--border)] bg-black/50 px-2 py-1.5 text-sm" /></label>
                          <button type="button" onClick={() => review.mutate({ requestId: r.id, approve: true })} className="rounded-lg bg-[var(--good)] px-3 py-1.5 text-xs font-semibold text-black" aria-label={`Approve ${r.kind} request ${r.id}`}>Approve</button>
                          <button type="button" onClick={() => { if (!(rejectReasons[r.id] ?? "").trim()) { setMsg("Reject karne se pehle reason likho - player ko wahi dikhega."); return; } review.mutate({ requestId: r.id, approve: false }); }} className="rounded-lg bg-[#3a2323] px-3 py-1.5 text-xs font-semibold text-[var(--danger)]" aria-label={`Reject ${r.kind} request ${r.id}`}>Reject</button>
                        </div>
                      )}
                    </li>
                  ))}</ul>)}
              </>
            )}
            {admin.data && tab === "games" && (
              <>
                <div className="glass mt-4 p-4">
                  <h2 className="font-serif text-xl gold-text">Add / Edit Game</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm">Name<input aria-label="Admin game name" {...FIELDS.adminSaveGame.name} value={gf.name} onChange={(e) => setGf({ ...gf, name: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">Category<select aria-label="Admin game category" value={gf.category} onChange={(e) => setGf({ ...gf, category: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2">{CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
                    <label className="block text-sm">Engine<select aria-label="Admin game engine" value={gf.engine} onChange={(e) => setGf({ ...gf, engine: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2">{Object.keys(ENGINE_ICON).map((e) => <option key={e}>{e}</option>)}</select></label>
                    <label className="block text-sm">RTP %<input aria-label="Admin game RTP" {...FIELDS.adminSaveGame.rtp} value={gf.rtp} onChange={(e) => setGf({ ...gf, rtp: Number(e.target.value) || 96 })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">Tag (Featured/Popular/New)<input aria-label="Admin game tag" {...FIELDS.adminSaveGame.tag} value={gf.tag} onChange={(e) => setGf({ ...gf, tag: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm">Slug (blank = auto / set to edit)<input aria-label="Admin game slug" {...FIELDS.adminSaveGame.slug} value={gf.slug} onChange={(e) => setGf({ ...gf, slug: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                    <label className="block text-sm sm:col-span-3">Description<input aria-label="Admin game description" {...FIELDS.adminSaveGame.description} value={gf.description} onChange={(e) => setGf({ ...gf, description: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  </div>
                  <button type="button" onClick={() => { if (!gf.name.trim()) { setMsg("Game name likho pehle."); return; } saveGame.mutate(); }} className="mt-3 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Save game listing">Save game</button>
                </div>
                <h2 className="mt-6 font-serif text-2xl">Catalog ({me.data?.totalGames ?? 0} games) - On/Off, Edit, Remove</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(me.data?.games ?? []).slice(0, 60).map((g) => (
                    <li key={g.slug} className="glass flex items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span><strong>{g.name}</strong> <span className="text-[var(--dim)]">- {g.category} - {g.plays} plays</span></span>
                      <span className="flex gap-1.5">
                        <button type="button" onClick={() => setGf({ slug: g.slug, name: g.name, category: g.category, engine: g.engine, rtp: g.rtp, description: g.description, tag: g.tag })} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs" aria-label={`Edit ${g.name}`}>Edit</button>
                        <button type="button" onClick={() => toggle.mutate({ slug: g.slug, enabled: !g.enabled })} aria-pressed={g.enabled} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${g.enabled ? "bg-[var(--good)] text-black" : "bg-[#3a2323] text-[var(--danger)]"}`} aria-label={`${g.enabled ? "Switch off" : "Switch on"} ${g.name}`}>{g.enabled ? "ON" : "OFF"}</button>
                        <button type="button" onClick={() => del.mutate(g.slug)} className="rounded-lg border border-[var(--danger)] px-2.5 py-1.5 text-xs text-[var(--danger)]" aria-label={`Remove ${g.name}`}>Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-[var(--dim)]">First 60 shown for speed - use Edit with a slug to change any other game.</p>
              </>
            )}
            {admin.data && tab === "users" && (
              <>
                <h2 className="mt-4 font-serif text-2xl">Users - Suspend / Reactivate, Adjust Real-Money Balance</h2>
                <ul className="mt-3 space-y-2">{admin.data.users.map((u) => (
                  <li key={u.id} className="glass flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span><strong>{u.name}</strong> - {u.email} - {u.role} - {credits(u.balance)} - {u.kycStatus}{u.suspended ? " - SUSPENDED" : ""}</span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => { setAdjUser(u.id); setMsg(`Adjusting real-money balance for ${u.email} - enter amount below.`); }} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs" aria-label={`Adjust balance for ${u.email}`}>Adjust</button>
                      <button type="button" onClick={() => suspend.mutate({ userId: u.id, suspended: !u.suspended })} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${u.suspended ? "bg-[var(--good)] text-black" : "bg-[#3a2323] text-[var(--danger)]"}`} aria-label={`${u.suspended ? "Reactivate" : "Suspend"} ${u.email}`}>{u.suspended ? "Reactivate" : "Suspend"}</button>
                    </span>
                  </li>
                ))}</ul>
                <div className="glass mt-4 flex flex-wrap items-end gap-3 p-4">
                  <label className="block text-sm">User ID<input aria-label="Adjust balance user ID" {...FIELDS.adminAdjustCredits.userId} value={adjUser || ""} onChange={(e) => setAdjUser(Number(e.target.value) || 0)} className="mt-1 w-24 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <label className="block text-sm">Signed amount (USD)<input aria-label="Adjust balance amount" {...FIELDS.adminAdjustCredits.amount} value={adjAmt} onChange={(e) => setAdjAmt(e.target.value)} className="mt-1 w-40 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <button type="button" onClick={() => { if (!adjUser) { setMsg("Pehle user ka Adjust dabao ya ID likho."); return; } adjust.mutate(); }} className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-black" aria-label="Apply balance adjustment">Apply adjustment</button>
                </div>
              </>
            )}
            {admin.data && tab === "settings" && (
              <div className="glass mt-4 p-4">
                <h2 className="font-serif text-xl gold-text">Settings - Payments (UPI / USDT), Sports APIs, Banners, Tournaments</h2>
                <p className="mt-1 text-xs text-[var(--dim)]">Sports mode: {admin.data.hasLiveKeys ? "LIVE keys active" : "DEMO - add a key to go live"}. Keys are stored server-side only, never shown again. Keys kabhi chat me mat bhejo.</p>
                {([["upi_id", "Platform UPI ID (players pay deposits here)"], ["usdt_address", "Platform USDT address TRC20 (players send deposits here)"], ["cricapi_key", "CricAPI / CricketData key (scores)"], ["odds_api_key", "The Odds API key (odds)"], ["promo_banner", "Announcement banner text (homepage + notifications)"], ["tournament_note", "Tournament note"], ["support_email", "Support email"], ["geo_block", "Geo-block list"]] as const).map(([k, label]) => (
                  <label key={k} className="mt-3 block text-sm">{label}
                    <input aria-label={label} value={sf(k ?? "")} onChange={(e) => setSetForm((p) => ({ ...p, [k ?? ""]: e.target.value }))} placeholder={k.includes("key") ? (admin.data?.hasLiveKeys ? "Key saved - paste a new key only to replace it" : "Paste key - stored server-side only") : ""} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                ))}
                <button type="button" onClick={() => saveSet.mutate()} className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black" aria-label="Save admin settings">Save settings</button>
              </div>
            )}
            {admin.data && tab === "sell" && (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="glass p-4"><h2 className="font-serif text-xl gold-text">A - One-Time Script Sale</h2><p className="mt-2 text-sm leading-relaxed">Full code + README + setup guide, one-time licence per buyer. Buyer hosts with their own server, domain and API keys.</p></div>
                  <div className="glass p-4"><h2 className="font-serif text-xl gold-text">B - Monthly White-Label Rent</h2><p className="mt-2 text-sm leading-relaxed">You host; client runs under their brand/domain/colour. Suggested band $500-$2,000/month + commission % - owner sets the final price.</p></div>
                </div>
                <div className="glass mt-4 grid gap-3 p-4 sm:grid-cols-3">
                  <label className="block text-sm">Brand name<input aria-label="Tenant brand name" {...FIELDS.createTenant.name} value={tn.name} onChange={(e) => setTn({ ...tn, name: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <label className="block text-sm">Domain<input aria-label="Tenant domain" {...FIELDS.createTenant.domain} value={tn.domain} onChange={(e) => setTn({ ...tn, domain: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <label className="block text-sm">Model<select aria-label="Tenant selling model" value={tn.model} onChange={(e) => setTn({ ...tn, model: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"><option value="rent">Monthly rent</option><option value="sale">Script sale</option></select></label>
                  <label className="block text-sm">Monthly rent (USD)<input aria-label="Tenant monthly rent" {...FIELDS.createTenant.monthlyRent} value={tn.monthlyRent} onChange={(e) => setTn({ ...tn, monthlyRent: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <label className="block text-sm">Commission %<input aria-label="Tenant commission percent" {...FIELDS.createTenant.commission} value={tn.commission} onChange={(e) => setTn({ ...tn, commission: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2" /></label>
                  <label className="block text-sm">Brand colour<input aria-label="Tenant brand colour" {...FIELDS.createTenant.color} type="color" value={tn.color} onChange={(e) => setTn({ ...tn, color: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-black/50 px-1 py-1" /></label>
                  <button type="button" onClick={() => { if (!tn.name.trim()) { setMsg("Tenant brand name likho pehle."); return; } createTenant.mutate(); }} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 font-semibold text-black sm:col-span-3" aria-label="Create tenant site">Create tenant site</button>
                </div>
                {admin.data.tenants.length > 0 && <ul className="mt-4 grid gap-2 sm:grid-cols-2">{admin.data.tenants.map((tnt) => (<li key={tnt.id} className="glass px-4 py-3 text-sm"><span className="mr-2 inline-block h-3 w-3 rounded-full border border-white/30" style={{ background: tnt.color }} /><strong>{tnt.name}</strong> - {tnt.domain || "no domain yet"} - {tnt.model === "rent" ? `$${tnt.monthlyRent}/mo` : "script sale"} - {tnt.commission}% - {tnt.status}</li>))}</ul>}
                <h2 className="mt-8 font-serif text-2xl">Screenshots</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {([[shotLobby, "1. Homepage / Lobby", "Hero, featured games with per-game artwork, search and categories."], [shotGame, "2. Game Detail Page", "Big game artwork, server-settled play panel, bet controls and provably-fair results."], [shotWallet, "3. Wallet - Deposit / Withdraw", "Real-money UPI / USDT deposit with UTR, withdraw form, Refer & Earn and ledger."], [shotAdmin, "4. Admin Dashboard", "GGR stats, referral totals, pending requests and activity logs in the operator portal."]] as const).map(([src, cap, sub]) => (
                    <figure key={cap} className="glass overflow-hidden">
                      <img src={src} alt={`Quvanta screenshot - ${cap}`} loading="lazy" className="w-full" />
                      <figcaption className="p-3"><strong className="font-serif gold-text">{cap}</strong><span className="mt-0.5 block text-sm text-[var(--dim)]">{sub}</span></figcaption>
                    </figure>
                  ))}
                </div>
                <h2 className="mt-8 font-serif text-2xl">README - Architecture, Setup, Selling &amp; APIs</h2>
                <div className="glass mt-3 p-4">{readme.isPending ? <p className="text-sm text-[var(--dim)]">Loading README...</p> : <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{readme.data?.markdown}</pre>}</div>
                <p className="mt-3 text-sm text-[var(--dim)]">Note: ye hosted build hai - script-sale delivery ke liye isi README/spec se standalone package (Next.js + Node + PostgreSQL/Prisma structure) export hoga.</p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
