import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ─── MIME برای معلم ───
const TEACHER_MIME = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const TEACHER_EXT = new Set(["pdf", "zip", "doc", "docx"]);

// ─── MIME برای دانش‌آموز (رسید پرداخت — فقط عکس) ───
const STUDENT_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "application/octet-stream", // بعضی مرورگرها MIME ناشناخته
]);

const STUDENT_EXT = new Set([
  "jpg", "jpeg", "pjpeg", "png", "webp", "gif", "heic", "heif", "bmp",
]);

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
};

function getExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isStaff = s.role === "teacher" || s.role === "admin";

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "فایلی آپلود نشد." }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `حجم فایل بیش از ${(MAX_SIZE / 1024 / 1024).toFixed(0)} مگابایت است.` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "فایل خالی است." }, { status: 400 });
    }

    const fileName = file.name || "upload";
    const extFromName = getExt(fileName);

    // ─── تشخیص نوع با اولویت MIME، fallback به پسوند ───
    let isValid = false;
    let detectedMime = file.type || "";

    if (isStaff) {
      // معلم: PDF / ZIP / DOC / DOCX
      if (detectedMime && TEACHER_MIME.has(detectedMime)) {
        isValid = true;
      } else if (TEACHER_EXT.has(extFromName)) {
        // MIME خالی یا ناشناخته — از پسوند استفاده کن
        isValid = true;
        if (!detectedMime) detectedMime = extFromName === "pdf" ? "application/pdf" : detectedMime;
      }
    } else {
      // دانش‌آموز: فقط عکس
      if (detectedMime && STUDENT_MIME.has(detectedMime)) {
        isValid = true;
      } else if (STUDENT_EXT.has(extFromName)) {
        // MIME خالی یا application/octet-stream — از پسوند استفاده کن
        isValid = true;
      }
    }

    if (!isValid) {
      const extList = isStaff
        ? "PDF، ZIP، DOC، DOCX"
        : "JPG، PNG، WebP، GIF، HEIC";
      console.warn("[upload] rejected:", { name: fileName, type: detectedMime, size: file.size, role: s.role });
      return NextResponse.json(
        {
          error: `فایل مجاز نیست. فقط ${extList}. (نوع شناسایی‌شده: ${detectedMime || "نامشخص"})`,
        },
        { status: 400 }
      );
    }

    // پسوند ذخیره
    const ext = EXT_BY_MIME[detectedMime] ?? extFromName ?? "bin";
    const id = randomUUID();
    const filename = `${id}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, filename), bytes);

    console.log("[upload] ✓", { name: fileName, size: file.size, ext, role: s.role });

    return NextResponse.json({
      ok: true,
      attachment: {
        id,
        name: fileName,
        url: `/uploads/${filename}`,
        size: file.size,
        type: detectedMime || `image/${ext}`,
      },
    });
  } catch (e) {
    console.error("[upload] exception:", e);
    return NextResponse.json({ error: "آپلود ناموفق." }, { status: 500 });
  }
}