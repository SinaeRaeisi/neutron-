"use client";
import { useRef, useState } from "react";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Eye, Pencil,
  Loader2,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

type Mode = "split" | "edit" | "preview";

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const [mode, setMode] = useState<Mode>("split");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** عملیات روی متن — در محل انتخاب کاربر */
  function wrap(before: string, after: string = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const newValue = value.slice(0, pos) + text + value.slice(pos);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + text.length, pos + text.length);
    }, 0);
  }

  function insertLineStart(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + prefix.length, pos + prefix.length);
    }, 0);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadErr(data.error ?? "آپلود ناموفق."); return; }
      insertAtCursor(`\n![${file.name}](${data.attachment.url})\n`);
    } catch {
      setUploadErr("خطای شبکه.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const toolbar = [
    { Icon: Heading1, label: "H1", action: () => insertLineStart("# ") },
    { Icon: Heading2, label: "H2", action: () => insertLineStart("## ") },
    { Icon: Heading3, label: "H3", action: () => insertLineStart("### ") },
    { sep: true },
    { Icon: Bold, label: "Bold", action: () => wrap("**", "**") },
    { Icon: Italic, label: "Italic", action: () => wrap("*", "*") },
    { Icon: Code, label: "Code", action: () => wrap("`", "`") },
    { sep: true },
    { Icon: List, label: "List", action: () => insertLineStart("- ") },
    { Icon: ListOrdered, label: "Ordered", action: () => insertLineStart("1. ") },
    { Icon: Quote, label: "Quote", action: () => insertLineStart("> ") },
    { sep: true },
    {
      Icon: LinkIcon, label: "Link",
      action: () => {
        const url = prompt("آدرس لینک:");
        if (url) wrap(`[`, `](${url})`);
      },
    },
    { Icon: ImageIcon, label: "Image", action: () => fileRef.current?.click() },
  ];

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-line bg-ink-3/50 flex-wrap">
        {toolbar.map((t, i) => {
          if ("sep" in t && t.sep) return <div key={i} className="w-px h-5 bg-line mx-1" />;
          const Icon = t.Icon!;
          return (
            <button key={i} type="button" onClick={t.action}
              title={t.label}
              className="p-1.5 rounded hover:bg-ink-2 text-muted hover:text-paper transition">
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        <div className="flex-1" />

        {uploading && (
          <span className="text-xs text-lime flex items-center gap-1 mr-2">
            <Loader2 className="w-3 h-3 animate-spin" /> آپلود…
          </span>
        )}

        {/* Mode switch */}
        <div className="flex items-center gap-0.5 border border-line rounded-lg p-0.5">
          <button type="button" onClick={() => setMode("edit")}
            className={`p-1 rounded text-xs ${mode === "edit" ? "bg-lime text-ink" : "text-muted"}`}
            title="فقط ویرایش">
            <Pencil className="w-3 h-3" />
          </button>
          <button type="button" onClick={() => setMode("split")}
            className={`px-2 py-0.5 rounded text-[10px] ${mode === "split" ? "bg-lime text-ink" : "text-muted"}`}>
            split
          </button>
          <button type="button" onClick={() => setMode("preview")}
            className={`p-1 rounded ${mode === "preview" ? "bg-lime text-ink" : "text-muted"}`}
            title="فقط پیش‌نمایش">
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
        {(mode === "edit" || mode === "split") && (
          <textarea
            ref={textareaRef}
            className={`w-full p-4 bg-ink-2 text-paper text-sm font-mono leading-loose resize-none outline-none ${
              mode === "split" ? "border-l border-line" : ""
            }`}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? "# عنوان\n\nمتن خود را اینجا بنویس…"}
            rows={20}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className={`p-4 overflow-y-auto bg-ink-2/50 ${mode === "split" ? "" : "md:col-span-2"}`}>
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t border-line bg-ink-3/30 text-xs text-muted">
        <div className="flex gap-3">
          <span>{words.toLocaleString("fa-IR")} کلمه</span>
          <span>{chars.toLocaleString("fa-IR")} کاراکتر</span>
        </div>
        {uploadErr && <span className="text-danger">{uploadErr}</span>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
        }}
      />
    </div>
  );
}

/** رندر ساده و ایمن Markdown — بدون dangerouslySetInnerHTML */
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-muted text-sm italic">پیش‌نمایش اینجا نمایش داده می‌شود…</p>;
  }

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (listBuffer.length === 0) return;
    const Tag = listOrdered ? "ol" : "ul";
    blocks.push(
      <Tag key={`list-${blocks.length}`} className="space-y-1 my-3 pr-5 list-disc">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-paper/90 leading-relaxed">
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
    listBuffer = [];
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listOrdered) flushList();
      listOrdered = false;
      listBuffer.push(trimmed.slice(2));
      return;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      if (!listOrdered && listBuffer.length > 0) flushList();
      listOrdered = true;
      listBuffer.push(trimmed.replace(/^\d+\.\s/, ""));
      return;
    }

    flushList();

    if (!trimmed) return;

    if (trimmed.startsWith("# ")) {
      blocks.push(<h1 key={idx} className="text-2xl font-black mt-5 mb-2 first:mt-0">{trimmed.slice(2)}</h1>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(<h2 key={idx} className="text-xl font-bold mt-4 mb-2 text-lime">{trimmed.slice(3)}</h2>);
      return;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push(<h3 key={idx} className="text-lg font-bold mt-3 mb-1.5">{trimmed.slice(4)}</h3>);
      return;
    }
    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote key={idx} className="border-r-4 border-lime/50 pr-4 my-3 text-muted italic">
          <Inline text={trimmed.slice(2)} />
        </blockquote>
      );
      return;
    }
    if (trimmed.startsWith("```")) {
      blocks.push(
        <pre key={idx} className="bg-ink-3 p-3 rounded-lg my-3 text-xs overflow-x-auto text-paper/90">
          <code>{trimmed.slice(3).replace(/```$/, "")}</code>
        </pre>
      );
      return;
    }

    // فقط تصویر
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={idx} src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg my-3 max-w-full" />
      );
      return;
    }

    blocks.push(
      <p key={idx} className="text-paper/90 leading-loose my-2">
        <Inline text={trimmed} />
      </p>
    );
  });

  flushList();

  return <div className="prose-invert max-w-none">{blocks}</div>;
}

/** پارس inline — **bold**، *italic*، `code`، [link](url)، ![img](url) */
function Inline({ text }: { text: string }) {
  const tokens: { type: string; content: string; extra?: string }[] = [];
  let rest = text;

  while (rest.length > 0) {
    // image
    let m = rest.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (m) { tokens.push({ type: "img", content: m[1], extra: m[2] }); rest = rest.slice(m[0].length); continue; }
    // link
    m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (m) { tokens.push({ type: "link", content: m[1], extra: m[2] }); rest = rest.slice(m[0].length); continue; }
    // bold
    m = rest.match(/^\*\*([^*]+)\*\*/);
    if (m) { tokens.push({ type: "bold", content: m[1] }); rest = rest.slice(m[0].length); continue; }
    // italic
    m = rest.match(/^\*([^*]+)\*/);
    if (m) { tokens.push({ type: "italic", content: m[1] }); rest = rest.slice(m[0].length); continue; }
    // code
    m = rest.match(/^`([^`]+)`/);
    if (m) { tokens.push({ type: "code", content: m[1] }); rest = rest.slice(m[0].length); continue; }
    // plain — یک کاراکتر
    tokens.push({ type: "plain", content: rest[0] });
    rest = rest.slice(1);
  }

  // ادغام plain های پشت سر هم
  const merged: typeof tokens = [];
  for (const t of tokens) {
    if (t.type === "plain" && merged.length > 0 && merged[merged.length - 1].type === "plain") {
      merged[merged.length - 1].content += t.content;
    } else {
      merged.push({ ...t });
    }
  }

  return (
    <>
      {merged.map((t, i) => {
        if (t.type === "plain") return <span key={i}>{t.content}</span>;
        if (t.type === "bold") return <strong key={i} className="font-bold text-paper">{t.content}</strong>;
        if (t.type === "italic") return <em key={i} className="italic">{t.content}</em>;
        if (t.type === "code") return <code key={i} className="bg-ink-3 px-1.5 py-0.5 rounded text-xs font-mono text-lime">{t.content}</code>;
        if (t.type === "link") return <a key={i} href={t.extra} className="text-lime hover:underline" target="_blank" rel="noopener noreferrer">{t.content}</a>;
        if (t.type === "img") return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={t.extra} alt={t.content} className="inline-block rounded max-h-24 my-1" />
        );
        return null;
      })}
    </>
  );
}