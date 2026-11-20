// Tiny fetch client for the /api/* routes.
import type { AppState } from "./state";

export type { AppState };
export type Game = AppState["games"][number];

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export async function loadState(): Promise<AppState> {
  return api<AppState>("/api/state");
}

export function credits(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function referralLink(code: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/?ref=${code}`;
}
