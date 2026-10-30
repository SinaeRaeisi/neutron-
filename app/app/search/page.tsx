"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Play, Users } from "lucide-react";
import { courses, users, concepts } from "@/lib/data";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const ql = q.trim();

  const matchedCourses = ql ? courses.filter(c => c.title.includes(ql) || c.summary.includes(ql)) : [];
  const matchedTeachers = ql ? users.filter(u => u.role === "teacher" && u.name.includes(ql)) : [];
  const matchedConcepts = ql ? concepts.filter(c => c.title.includes(ql)) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-muted" />
        <input autoFocus className="input pr-12 py-3.5 text-base"
          placeholder="دوره، مدرس یا مفهوم…" value={q}
          onChange={e => setQ(e.target.value)} />
      </div>

      {!ql && <p className="text-muted text-sm text-center py-10">جست‌وجو کن — مثلاً «ریاضی» یا «دلتا».</p>}

      {ql && (
        <>
          {matchedCourses.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-muted mb-2">دوره‌ها</h2>
              <div className="space-y-2">
                {matchedCourses.map(c => (
                  <Link key={c.id} href={`/app/course/${c.id}`} className="card card-hover flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-lime" />
                    <div className="flex-1"><div className="font-medium text-sm">{c.title}</div></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {matchedTeachers.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-muted mb-2">مدرسان</h2>
              <div className="space-y-2">
                {matchedTeachers.map(t => (
                  <div key={t.id} className="card flex items-center gap-3">
                    <Users className="w-5 h-5 text-violet" />
                    <div className="font-medium text-sm">{t.name}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {matchedConcepts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-muted mb-2">مفاهیم</h2>
              <div className="flex flex-wrap gap-2">
                {matchedConcepts.map(c => <span key={c.id} className="chip">{c.title}</span>)}
              </div>
            </section>
          )}

          {matchedCourses.length + matchedTeachers.length + matchedConcepts.length === 0 && (
            <p className="text-muted text-sm text-center py-10">چیزی پیدا نشد.</p>
          )}
        </>
      )}
    </div>
  );
}