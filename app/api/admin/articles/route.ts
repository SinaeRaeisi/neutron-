import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbCreateCustomArticle } from "@/lib/db-file";
import { getAllArticles, isSeedArticle } from "@/lib/content";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const allArticles = await getAllArticles();
  const articles = allArticles.map((a: any) => ({
    ...a,
    isSeed: isSeedArticle(a.slug),
  }));
  return NextResponse.json({ articles });
}

const Body = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9\u0600-\u06FF-]+$/).optional(),
  excerpt: z.string().min(5).max(400),
  content: z.string().min(10),
  category: z.string().min(2),
  cover: z.enum(["lime", "sky", "violet", "amber", "rose"]),
  readMinutes: z.number().int().min(1).max(120),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
});

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${issue?.path.join(".")} — ${issue?.message}` },
      { status: 400 }
    );
  }

  const baseSlug = parsed.data.slug || slugify(parsed.data.title);
  const all = await getAllArticles();
  let slug = baseSlug;
  let i = 1;
  while (all.some((a: any) => a.slug === slug)) {
    slug = `${baseSlug}-${i++}`;
  }

  const a = await dbCreateCustomArticle({
    id: "ca-" + Math.random().toString(36).slice(2, 8),
    slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    authorId: s.userId,
    category: parsed.data.category,
    cover: parsed.data.cover,
    readMinutes: parsed.data.readMinutes,
    publishedAt: new Date().toISOString(),
    tags: parsed.data.tags,
    featured: parsed.data.featured,
  });
  return NextResponse.json({ ok: true, article: a });
}