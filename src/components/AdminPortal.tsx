"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type AdminState = {
  stats: {
    totalWagered: number;
    totalPayout: number;
    ggr: number;
    totalBets: number;
    totalUsers: number;
    totalGames: number;
    totalReferrals: number;
    referralPayouts: number;
    pendingRequests: number;
  };
  requests: {
    id: number;
    userId: number;
    userEmail: string;
    kind: string;
    method: string;
    amount: number;
    currency: string;
    ref: string;
    destination: string;
    screenshotRef: string;
    status: string;
    rejectReason: string;
    createdAt: string;
  }[];
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    balance: number;
    suspended: boolean;
    kycStatus: string;
  }[];
  logs: { id: number; game: string; betAmount: number; profit: number; detail: string; createdAt: string }[];
  tenants: {
    id: number;
    name: string;
    domain: string;
    currency: string;
    commission: number;
    monthlyRent: number;
    model: string;
    status: string;
    color: string;
  }[];
  settings: Record<string, string>;
  hasLiveKeys: boolean;
};

function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminLogin({ onDone }: { onDone: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api("/api/admin/login", { identifier, password });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="felt flex min-h-screen items-center justify-center px-4 text-[var(--text)]">
      <div className="w-full max-w-sm">
        <div className="glass p-6">
          <h1 className="font-serif text-2xl">Operator Portal</h1>
          <p className="mt-1 text-sm text-[var(--dim)]">Sign in to manage Quvanta.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-sm">
              Username or email
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="Operator username"
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="Operator password"
              />
            </label>
            {err && (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminPortal() {
  const [d, setD] = useState<AdminState | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<Record<number, string>>({});
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [tenantForm, setTenantForm] = useState({
    name: "",
    domain: "",
    currency: "USD",
    commission: 15,
    monthlyRent: 750,
    model: "rent",
    color: "#0a0a0f",
  });
  const [adjust, setAdjust] = useState<Record<number, { amount: string; note: string }>>({});

  async function load() {
    const res = await fetch("/api/admin/state");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load operator data.");
    setD(data);
    setSettingsForm(data.settings ?? {});
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function review(id: number, approve: boolean) {
    setErr("");
    setNote("");
    try {
      await api("/api/admin/review", {
        requestId: id,
        approve,
        reason: reason[id] ?? "",
      });
      setNote(approve ? "Request approved." : "Request rejected.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Review failed");
    }
  }

  async function changeCreds(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      const r = await api<{ username: string }>("/api/admin/change-credentials", {
        currentPassword,
        newUsername,
        newPassword,
      });
      setNote(`Credentials updated. Current username: ${r.username}. Old login no longer works.`);
      setNewUsername("");
      setNewPassword("");
      setCurrentPassword("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Change failed");
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/admin/settings", { values: settingsForm });
      setNote("Settings saved. Reload the sports pages to switch DEMO to LIVE.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/admin/tenant", tenantForm);
      setNote("Tenant created.");
      setTenantForm({ name: "", domain: "", currency: "USD", commission: 15, monthlyRent: 750, model: "rent", color: "#0a0a0f" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Tenant creation failed");
    }
  }

  async function logout() {
    await api("/api/admin/logout", {});
    window.location.reload();
  }

  if (err && !d) {
    return (
      <div className="felt flex min-h-screen items-center justify-center px-4 text-[var(--text)]">
        <p className="text-[var(--danger)]">{err}</p>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="felt flex min-h-screen items-center justify-center text-[var(--dim)]">
        Loading operator portal...
      </div>
    );
  }

  const tabs = ["dashboard", "requests", "games", "users", "settings", "tenants", "sell"] as const;
  const s = d.stats;

  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="font-serif text-xl tracking-[0.18em] gold-text">QUVANTA</p>
            <p className="text-[10px] tracking-[0.3em] text-[var(--dim)]">OPERATOR PORTAL</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm capitalize ${
                tab === t ? "bg-[var(--accent)] font-semibold text-black" : "border border-[var(--border)]"
              }`}
            >
              {t}
              {t === "requests" && s.pendingRequests > 0 ? ` (${s.pendingRequests})` : ""}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        {err && (
          <p className="mb-3 text-sm text-[var(--danger)]" role="alert">
            {err}
          </p>
        )}
        {note && (
          <p className="mb-3 text-sm text-[var(--good)]" role="status">
            {note}
          </p>
        )}

        {tab === "dashboard" && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Total users", String(s.totalUsers)],
                ["Total games", String(s.totalGames)],
                ["Total bets", String(s.totalBets)],
                ["Total wagered", money(s.totalWagered)],
                ["Total payout", money(s.totalPayout)],
                ["GGR", money(s.ggr)],
                ["Referrals", `${s.totalReferrals} (Rs ${s.referralPayouts} paid)`],
                ["Pending requests", String(s.pendingRequests)],
              ].map(([label, value]) => (
                <div key={label} className="glass p-4">
                  <p className="text-xs tracking-widest text-[var(--dim)]">{label.toUpperCase()}</p>
                  <p className="mt-1 font-serif text-2xl gold-text">{value}</p>
                </div>
              ))}
            </section>

            <form onSubmit={changeCreds} className="glass p-5">
              <h2 className="font-serif text-2xl">Admin Account — Change Username / Password</h2>
              <p className="mt-1 text-sm text-[var(--dim)]">
                There is exactly one operator account. Changing credentials signs out other
                operator sessions immediately; the old login stops working at once.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  Current password
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  New username (optional)
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                    placeholder="Leave empty to keep"
                  />
                </label>
                <label className="block text-sm">
                  New password (optional)
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black"
              >
                Save new credentials
              </button>
            </form>

            <section className="glass p-5">
              <h2 className="font-serif text-2xl">Launch Checklist</h2>
              <ul className="mt-3 space-y-1 text-sm text-[var(--dim)]">
                <li>☐ Change the initial operator password above (and delete the demo player account before public launch).</li>
                <li>☐ Set your real UPI ID and USDT address in Settings, and approve a test deposit end-to-end.</li>
                <li>☐ Complete a test withdraw with KYC verified.</li>
                <li>☐ Paste CricAPI and Odds API keys in Settings — sports pages switch from DEMO to LIVE.</li>
                <li>☐ Confirm the geo-block list matches your licence; 18+ and responsible-gaming pages are live.</li>
                <li>☐ Licence, KYC process and payment compliance in place before accepting real funds.</li>
              </ul>
            </section>

            <section className="glass p-5">
              <h2 className="font-serif text-2xl">Recent Activity</h2>
              <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
                {d.logs.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {b.game} — {b.detail}
                    </span>
                    <span className={b.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>
                      {b.profit >= 0 ? "+" : ""}
                      {b.profit.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === "requests" && (
          <section className="glass p-5">
            <h2 className="font-serif text-2xl">Deposit / Withdraw Queue</h2>
            <p className="mt-1 text-sm text-[var(--dim)]">
              Verify the UTR / tx-hash before approving a deposit. Balances move only on approval.
            </p>
            <ul className="mt-4 space-y-3">
              {d.requests.map((r) => (
                <li key={r.id} className="rounded-lg border border-[var(--border)] p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{r.kind}</strong> via {r.method} — {r.amount} {r.currency} —{" "}
                      {r.userEmail}
                    </span>
                    <span
                      className={
                        r.status === "approved"
                          ? "text-[var(--good)]"
                          : r.status === "rejected"
                            ? "text-[var(--danger)]"
                            : "text-[var(--accent2)]"
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--dim)]">
                    Ref: {r.ref || "—"}
                    {r.destination ? ` · Destination: ${r.destination}` : ""}
                    {r.screenshotRef ? ` · Screenshot: ${r.screenshotRef}` : ""}
                    {r.rejectReason ? ` · Reason: ${r.rejectReason}` : ""}
                  </p>
                  {r.status === "pending" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        value={reason[r.id] ?? ""}
                        onChange={(e) => setReason({ ...reason, [r.id]: e.target.value })}
                        placeholder="Rejection reason (if rejecting)"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => review(r.id, true)}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => review(r.id, false)}
                        className="rounded-lg border border-[var(--danger)] px-4 py-2 text-sm text-[var(--danger)]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {d.requests.length === 0 && (
                <p className="text-sm text-[var(--dim)]">No requests yet.</p>
              )}
            </ul>
          </section>
        )}

        {tab === "games" && (
          <section className="glass p-5">
            <h2 className="font-serif text-2xl">Games</h2>
            <p className="mt-1 text-sm text-[var(--dim)]">
              Game listings are managed from the catalog seed. Use Settings → Sell for the full
              catalog. Toggle a game off to hide it from the lobby.
            </p>
            <p className="mt-2 text-sm">
              Total games: <strong className="gold-text">{s.totalGames}</strong> · Sports API:{" "}
              {d.hasLiveKeys ? "connected (LIVE)" : "not connected (DEMO)"}
            </p>
          </section>
        )}

        {tab === "users" && (
          <section className="glass p-5">
            <h2 className="font-serif text-2xl">Users</h2>
            <ul className="mt-4 space-y-3">
              {d.users.map((u) => (
                <li key={u.id} className="rounded-lg border border-[var(--border)] p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{u.name}</strong> ({u.email}) — {u.role} — balance{" "}
                      {money(u.balance)} — KYC: {u.kycStatus}
                    </span>
                    <span className={u.suspended ? "text-[var(--danger)]" : "text-[var(--good)]"}>
                      {u.suspended ? "suspended" : "active"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      placeholder="Adjust amount (+/-)"
                      value={adjust[u.id]?.amount ?? ""}
                      onChange={(e) =>
                        setAdjust({
                          ...adjust,
                          [u.id]: { amount: e.target.value, note: adjust[u.id]?.note ?? "Balance adjustment" },
                        })
                      }
                      className="w-40 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const a = adjust[u.id];
                        if (!a?.amount) return;
                        await api("/api/admin/adjust", {
                          userId: u.id,
                          amount: Number(a.amount),
                          note: a.note || "Balance adjustment",
                        });
                        await load();
                      }}
                      className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm"
                    >
                      Adjust balance
                    </button>
                    {u.role !== "admin" && (
                      <button
                        type="button"
                        onClick={async () => {
                          await api("/api/admin/suspend", {
                            userId: u.id,
                            suspended: !u.suspended,
                          });
                          await load();
                        }}
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                      >
                        {u.suspended ? "Re-activate" : "Suspend"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "settings" && (
          <form onSubmit={saveSettings} className="glass space-y-4 p-5">
            <h2 className="font-serif text-2xl">Settings</h2>
            <p className="text-sm text-[var(--dim)]">
              API keys are stored server-side only and never shown back after saving. Sports pages
              switch from DEMO to LIVE once valid keys are saved.
            </p>
            {[
              ["upi_id", "Platform UPI ID (players pay deposits here)"],
              ["usdt_address", "Platform USDT address TRC20 (players send deposits here)"],
              ["cricapi_key", "CricAPI / CricketData key (scores) — leave empty to keep the saved key"],
              ["odds_api_key", "The Odds API key (odds) — leave empty to keep the saved key"],
              ["promo_banner", "Announcement banner text"],
              ["tournament_note", "Tournament note"],
              ["support_email", "Support email"],
              ["geo_block", "Geo-block list (comma separated, e.g. US, UK, AU)"],
            ].map(([k, label]) => (
              <label key={k} className="block text-sm">
                {label}
                <input
                  value={settingsForm[k] ?? ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, [k]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  placeholder={k.includes("key") ? "•••••••• (saved, hidden)" : ""}
                />
              </label>
            ))}
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black"
            >
              Save settings
            </button>
          </form>
        )}

        {tab === "tenants" && (
          <div className="space-y-6">
            <form onSubmit={createTenant} className="glass space-y-3 p-5">
              <h2 className="font-serif text-2xl">Create White-Label Tenant</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Tenant name
                  <input
                    required
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Domain
                  <input
                    value={tenantForm.domain}
                    onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Currency
                  <input
                    value={tenantForm.currency}
                    onChange={(e) => setTenantForm({ ...tenantForm, currency: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Model
                  <select
                    value={tenantForm.model}
                    onChange={(e) => setTenantForm({ ...tenantForm, model: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  >
                    <option value="rent">Monthly rent</option>
                    <option value="sale">One-time sale</option>
                  </select>
                </label>
                <label className="block text-sm">
                  Commission %
                  <input
                    type="number"
                    value={tenantForm.commission}
                    onChange={(e) => setTenantForm({ ...tenantForm, commission: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Monthly rent ($)
                  <input
                    type="number"
                    value={tenantForm.monthlyRent}
                    onChange={(e) => setTenantForm({ ...tenantForm, monthlyRent: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-black"
              >
                Create tenant
              </button>
            </form>
            <section className="glass p-5">
              <h2 className="font-serif text-2xl">Tenants</h2>
              {d.tenants.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--dim)]">No tenants yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
                  {d.tenants.map((t) => (
                    <li key={t.id} className="flex justify-between gap-3 py-2">
                      <span>
                        {t.name} — {t.domain || "no domain"} — {t.model}
                      </span>
                      <span>
                        {t.currency} · {t.commission}% · ${t.monthlyRent}/mo · {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "sell" && (
          <section className="glass space-y-4 p-5 text-sm leading-relaxed">
            <h2 className="font-serif text-2xl">Sell Quvanta — Both Models</h2>
            <p>
              <strong className="gold-text">A) One-time script sale:</strong> sell this full code
              package with the README and setup support; the buyer hosts it on their own Vercel +
              Neon account and uses their own API keys, UPI ID, USDT address and licence.
            </p>
            <p>
              <strong className="gold-text">B) Monthly white-label rent:</strong> create a tenant
              in the Tenants tab, set the rent and commission %, and give the client their own
              branded site, operator access, users and wallet. Suggested rent: $500–$2,000/month
              per client plus a revenue share — the final price is set by the owner.
            </p>
            <p>
              A buyer or tenant never receives the owner&apos;s API keys, payment addresses or
              licence; each operator configures their own.
            </p>
            <h3 className="font-serif text-xl gold-text">API directory (where every key comes from)</h3>
            <ul className="list-disc space-y-1 pl-5 text-[var(--dim)]">
              <li>CricketData.org (CricAPI) — https://cricketdata.org — free 100 hits/day; paid from $5.99/month.</li>
              <li>Entity Sport — https://www.apisports.net/providers/entity-sport — free 1,000 requests/day; Starter $29/month.</li>
              <li>API Cricket — https://www.api-cricket.com/ — 14-day free trial; Starter $20/month.</li>
              <li>Roanuz Cricket API — https://sports.dev.roanuz.com/ — from €176/month.</li>
              <li>The Odds API — https://the-odds-api.com — free 500 credits/month; paid ~$25–30/month. Use exactly the-odds-api.com.</li>
              <li>Slotegrator APIgrator — https://slotegrator.pro/analytical_articles/working-with-slotegrator-how-we-help-you-grow/ — 30,000+ games, B2B quote-only, licence required first.</li>
            </ul>
            <p className="text-[var(--dim)]">
              Prices were checked 2026-11-20 — re-check on the provider&apos;s own site before
              paying. Keys are always created on the operator&apos;s own account.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
