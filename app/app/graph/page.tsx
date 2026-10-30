"use client";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { courses } from "@/lib/data";

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">گراف دانش</h1>
        <p className="text-muted text-sm mt-1">پیشنیازها و شکاف‌های یادگیری.</p>
      </header>
      <KnowledgeGraph />
      <section className="grid gap-3 md:grid-cols-2">
        {courses.map(c => (
          <div key={c.id} className="card">
            <h2 className="font-semibold text-sm">{c.title}</h2>
            <p className="text-xs text-muted mt-1">{c.conceptIds.length} مفهوم</p>
          </div>
        ))}
      </section>
    </div>
  );
}