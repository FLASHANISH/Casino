import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/catalog";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  slug: z.string().max(80).default(""),
  name: z.string().trim().min(2).max(80),
  category: z.string().min(2).max(40),
  engine: z.string().min(2).max(30),
  rtp: z.number().min(80).max(99.9),
  description: z.string().max(500).default(""),
  tag: z.string().max(20).default(""),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  const slug = parsed.data.slug || slugify(parsed.data.name);
  const description = parsed.data.description ?? "";
  const tag = parsed.data.tag ?? "";
  await prisma.gameConfig.upsert({
    where: { slug },
    update: {
      name: parsed.data.name,
      category: parsed.data.category,
      engine: parsed.data.engine,
      rtp: parsed.data.rtp,
      description,
      tag,
    },
    create: {
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      engine: parsed.data.engine,
      rtp: parsed.data.rtp,
      description:
        description ||
        `${parsed.data.name} - played with real money (USD / USDT).`,
      tag,
      enabled: true,
      minBet: 1,
      maxBet: 500,
      plays: 0,
      hue: Math.floor(Math.random() * 360),
    },
  });
  return json({ ok: true });
}
