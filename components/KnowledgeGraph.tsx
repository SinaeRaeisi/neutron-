"use client";
import { concepts } from "@/lib/data";
import { useNeutronStore, getAttempts } from "@/lib/store";

export function KnowledgeGraph() {
  const attempts = useNeutronStore(getAttempts, []);
  const gaps = new Set<string>();
  attempts.forEach(a => a.gaps.forEach(g => gaps.add(g)));

  const width = 600, height = 240;

  return (
    <div className="card overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px]">
        {concepts.map(n =>
          n.requires.map(req => {
            const from = concepts.find(x => x.id === req);
            if (!from) return null;
            return (
              <line key={`${from.id}-${n.id}`}
                x1={from.x} y1={from.y} x2={n.x} y2={n.y}
                stroke="#232E4A" strokeWidth="2" strokeDasharray="4 4" />
            );
          })
        )}
        {concepts.map(n => {
          const isGap = gaps.has(n.id);
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r="22"
                fill={isGap ? "#FF6B6B22" : "#C6F24E22"}
                stroke={isGap ? "#FF6B6B" : "#C6F24E"}
                strokeWidth="2" />
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                className="fill-paper" style={{ fontSize: 9 }}>
                {n.title.slice(0, 10)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-lime/20 border border-lime" /> تسلط
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-danger/20 border border-danger" /> شکاف
        </span>
      </div>
    </div>
  );
}