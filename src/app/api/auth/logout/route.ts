import { cookies } from "next/headers";
import { destroySession, PLAYER_COOKIE, clearPlayerCookie } from "@/lib/auth";
import { json } from "@/lib/api-helpers";

export async function POST() {
  const token = cookies().get(PLAYER_COOKIE)?.value;
  if (token) await destroySession(token);
  await clearPlayerCookie();
  return json({ ok: true });
}
