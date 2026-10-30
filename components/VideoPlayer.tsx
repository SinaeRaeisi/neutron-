"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw,
  RotateCw, Loader2, AlertCircle,
} from "lucide-react";

interface Props {
  src: string;
  lessonId: string;
  courseId?: string;
  poster?: string;
  onEnded?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ src, lessonId, courseId, poster, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const savedKey = `neutron.video.${lessonId}`;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setLoading(true);
    setError(null);

    function onLoaded() {
      if (!v) return;
      setLoading(false);
      setDuration(v.duration);
      const saved = parseFloat(localStorage.getItem(savedKey) ?? "0");
      if (saved > 3 && saved < v.duration - 5) v.currentTime = saved;
    }
    function onErr() { setError("خطا در بارگذاری ویدیو."); setLoading(false); }
    function onTime() {
      if (!v) return;
      setCurrent(v.currentTime);
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    }
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); }
    function onEnd() {
      setPlaying(false);
      try { localStorage.removeItem(savedKey); } catch { /* */ }
      onEnded?.();
    }

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("error", onErr);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("error", onErr);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
    };
  }, [lessonId, savedKey, onEnded]);

  // ذخیرهٔ موقعیت هر ۵ ثانیه
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const v = videoRef.current;
      if (v && v.currentTime > 0) {
        try { localStorage.setItem(savedKey, String(v.currentTime)); } catch { /* */ }
      }
    }, 5000);
    return () => clearInterval(t);
  }, [playing, savedKey]);

  // کلیدهای میان‌بر
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = videoRef.current;
      if (!v) return;

      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); }
      else if (e.key === "m")          { e.preventDefault(); toggleMute(); }
      else if (e.key === "f")          { e.preventDefault(); toggleFullscreen(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError("پخش ناموفق."));
    else v.pause();
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }
  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
  }
  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }
  function changeSpeed(s: number) {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
  }
  function skip(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  }
  function showTemporarily() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 2500);
  }
  function fmt(s: number): string {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  if (error) {
    return (
      <div className="aspect-video rounded-xl2 bg-ink-2 border border-danger/30 flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-10 h-10 text-danger" />
        <p className="text-sm text-danger">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); videoRef.current?.load(); }}
          className="btn-ghost btn-sm">تلاش دوباره</button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl2 overflow-hidden group select-none"
      onMouseMove={showTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
        >
          <div className="w-20 h-20 rounded-full bg-lime/95 text-ink flex items-center justify-center shadow-2xl">
            <Play className="w-8 h-8 fill-ink" />
          </div>
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="w-10 h-10 text-lime animate-spin" />
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 transition-opacity ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="relative h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer">
          <div className="absolute inset-y-0 right-0 bg-white/40 rounded-full" style={{ width: `${bufferedPct}%` }} />
          <div className="absolute inset-y-0 right-0 bg-lime rounded-full" style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1 text-paper">
          <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded">
            {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded" title="-10s">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded" title="+10s">
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 group/vol">
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={changeVolume}
              className="w-0 group-hover/vol:w-20 transition-all accent-lime cursor-pointer"
            />
          </div>

          <div className="text-xs tabular-nums px-2">
            {fmt(current)} / {fmt(duration)}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setShowSpeed(!showSpeed)}
              className="px-2 py-1 hover:bg-white/10 rounded text-xs tabular-nums"
            >
              {speed}×
            </button>
            {showSpeed && (
              <div className="absolute bottom-full mb-1 left-0 bg-ink-3 rounded-lg overflow-hidden shadow-xl">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full px-4 py-1.5 text-xs text-right hover:bg-ink-2 ${speed === s ? "text-lime" : "text-paper"}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}