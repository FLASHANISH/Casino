"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { COUNTRIES, DEFAULT_COUNTRY, currencyForCountry, formatMoney } from "@/lib/countries";

// First page: Login / Create Account ONLY. Logged-out visitors see nothing
// else — no lobby, no games, no sportsbook. After login the dashboard opens.
export function AuthGate() {
  const router = useRouter();
  const search = useSearchParams();
  const ref = search.get("ref") ?? "";
  const [tab, setTab] = useState<"login" | "signup" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [referralCode, setReferralCode] = useState(ref);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    setBusy(true);
    try {
      if (tab === "login") {
        await api("/api/auth/login", { identifier: email, password });
        router.push("/lobby");
        router.refresh();
      } else if (tab === "signup") {
        const r = await api<{ verifyCode: string }>("/api/auth/signup", {
          name,
          email,
          password,
          dob,
          country,
          referralCode,
        });
        setNote(
          `Account created. Your email verification code is ${r.verifyCode} — enter it in Profile to complete KYC.`,
        );
        router.push("/lobby");
        router.refresh();
      } else {
        const r = await api<{ resetCode: string }>("/api/auth/request-reset", {
          email,
        });
        setNote(`Your password reset code is ${r.resetCode}.`);
        setTab("login");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="felt flex min-h-screen items-center justify-center px-4 py-10 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="font-serif text-5xl tracking-[0.18em] gold-text">QUVANTA</p>
          <p className="mt-1 text-xs tracking-[0.3em] text-[var(--dim)]">
            PREMIUM CASINO &amp; SPORTS
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--dim)]">
            232 games. Real-money wallet (UPI + USDT). Sportsbook, IPL and World
            Cups. 18+ only.
          </p>
        </div>

        <div className="glass mt-6 p-6">
          <div className="flex gap-2" role="tablist" aria-label="Login or create account">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setErr("");
                  setNote("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  tab === t ? "bg-[var(--accent)] text-black" : "border border-[var(--border)]"
                }`}
              >
                {t === "login" ? "Log in" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {tab === "signup" && (
              <label className="block text-sm">
                Full name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm">
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder={tab === "signup" ? "At least 6 characters" : "Your password"}
              />
            </label>
            {tab === "signup" && (
              <>
                <label className="block text-sm">
                  Date of birth (18+ only)
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Country
                  <select
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-[var(--dim)]">
                    Wallet currency: {currencyForCountry(country).symbol}{" "}
                    {currencyForCountry(country).currency} — deposits and withdraws are in
                    this currency.
                  </span>
                </label>
                <label className="block text-sm">
                  Referral code (optional — your referrer earns 10.00 in their currency)
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                    placeholder="e.g. QV123456"
                  />
                </label>
              </>
            )}
            {err && (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {err}
              </p>
            )}
            {note && (
              <p className="text-sm text-[var(--good)]" role="status">
                {note}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] py-3 font-serif text-lg text-black disabled:opacity-50"
            >
              {busy
                ? "Please wait..."
                : tab === "login"
                  ? "Log in"
                  : `Create Account — start at ${formatMoney(0, currencyForCountry(country).currency)}`}
            </button>
          </form>

          {tab === "login" && (
            <button
              type="button"
              onClick={() => {
                setTab("reset");
                setErr("");
                setNote("");
              }}
              className="mt-3 w-full text-center text-sm text-[var(--dim)] underline"
            >
              Forgot password?
            </button>
          )}
          {tab === "reset" && (
            <form
              onSubmit={submit}
              className="mt-4 space-y-3 border-t border-[var(--border)] pt-4"
            >
              <p className="text-sm text-[var(--dim)]">
                Enter your email and we will issue a reset code.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg border border-[var(--accent)] py-2.5 text-sm"
              >
                Send reset code
              </button>
              <button
                type="button"
                onClick={() => setTab("login")}
                className="w-full text-center text-sm text-[var(--dim)] underline"
              >
                Back to log in
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--dim)]">
            18+ only. Real money — no demo coins, no bonuses. New accounts start at{" "}
            {tab === "signup"
              ? formatMoney(0, currencyForCountry(country).currency)
              : "$0.00"}
            . By creating an account you agree to the Terms and confirm you are
            18 or older.
          </p>
        </div>

        <div className="mt-4 flex justify-center gap-2 text-xs text-[var(--dim)]">
          <a href="/info/faq" className="underline">FAQ</a>
          <span>·</span>
          <a href="/info/terms" className="underline">Terms</a>
          <span>·</span>
          <a href="/info/privacy" className="underline">Privacy</a>
          <span>·</span>
          <a href="/info/responsible" className="underline">Responsible Gaming</a>
        </div>
      </div>
    </div>
  );
}
