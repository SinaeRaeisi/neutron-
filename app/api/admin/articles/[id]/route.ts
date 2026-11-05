import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import {
  dbGetCustomArticle, dbUpdateCustomArticle, dbDeleteCustomArticle,
  dbSetArticleOverride, dbMarkArticleDeleted,
} from "@/lib/db-file";
import { getArticleBySlug, isSeedArticle } from "@/lib/content";

async function authAdmin() {
  const token = cookies().get("n_session")?.value;
  if (!token) return null;
  const s = await verifySession(token);
  return s?.role === "admin" ? s : null;
}

const Body = z.object({
  title: z.string().min(3).max(200).optional(),
  excerpt: z.string().min(5).max(400).optional(),
  content: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
  cover: z.enum(["lime", "sky", "violet", "amber", "rose"]).optional(),
  readMinutes: z.number().int().min(1).max(120).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = await authAdmin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const existing = await getArticleBySlug(params.id); // ← await
  if (!existing) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${parsed.error.issues[0]?.message}` },
      { status: 400 }
    );
  }

  if (isSeedArticle(params.id)) {
    await dbSetArticleOverride(params.id, parsed.data); // ← await
    const updated = await getArticleBySlug(params.id);  // ← await
    return NextResponse.json({ ok: true, article: updated });
  }

  const custom = await dbGetCustomArticle(params.id);   // ← await
  if (custom) {
    await dbUpdateCustomArticle(custom.id, parsed.data); // ← await
    const updated = await getArticleBySlug(params.id);   // ← await
    return NextResponse.json({ ok: true, article: updated });
  }

  return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await authAdmin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const existing = await getArticleBySlug(params.id); // ← await
  if (!existing) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  if (isSeedArticle(params.id)) {
    await dbMarkArticleDeleted(params.id); // ← await
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  const custom = await dbGetCustomArticle(params.id); // ← await
  if (custom) {
    await dbDeleteCustomArticle(custom.id); // ← await
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });
}