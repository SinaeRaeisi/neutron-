export function ProgressRing({
  value, size = 96, label,
}: { value: number; size?: number; label?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - safe / 100);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#232E4A" strokeWidth="8" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="#C6F24E" strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold tabular-nums">{Math.round(safe)}٪</div>
        {label && <div className="text-[10px] text-muted">{label}</div>}
      </div>
    </div>
  );
}