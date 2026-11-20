import { cookies } from "next/headers";
import { ADMIN_COOKIE, clearAdminCookie, destroySession } from "@/lib/auth";
import { json } from "@/lib/api-helpers";

export async function POST() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (token) await destroySession(token);
  await clearAdminCookie();
  return json({ ok: true });
}
