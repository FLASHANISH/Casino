import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({ slug: z.string().min(1).max(80) });

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);
  const favs = me.favorites ? me.favorites.split(",").filter(Boolean) : [];
  const next = favs.includes(parsed.data.slug)
    ? favs.filter((f) => f !== parsed.data.slug)
    : [...favs, parsed.data.slug];
  await prisma.user.update({
    where: { id: me.id },
    data: { favorites: next.join(",") },
  });
  return json({ favorites: next });
}
