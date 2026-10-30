"use client";
import { useEffect, useRef, useState } from "react";
import { Radio, Loader2, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react";

interface Props {
  hlsUrl?: string;
  poster?: string;
  /** پیام آماده‌نبودن — مثلاً «کلاس هنوز شروع نشده» */
  waitingMessage?: string;
  /** آیا کلاس در پنجرهٔ زمانی است (زنده است) */
  isLive?: boolean;
}

export function LivePlayer({ hlsUrl, poster, waitingMessage, isLive = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    if (!hlsUrl) return;
    let hlsInstance: any = null;

    async function setup() {
      try {
        const mod = await import("hls.js");
        const Hls = mod.default;
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 20,
            liveSyncDurationCount: 3,
          });
          hlsInstance.loadSource(hlsUrl!);
          hlsInstance.attachMedia(video);

          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            setReady(true);
            // تلاش برای پخش خودکار (mute شده)
            video.play().catch(() => setAutoplayBlocked(true));
          });

          hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
            console.error("[hls]", data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hlsInstance.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hlsInstance.recoverMediaError();
                  break;
                default:
                  setErr("خطا در پخش. لطفاً صفحه را رفرش کن.");
                  hlsInstance.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari — HLS بومی
          video.src = hlsUrl!;
          video.addEventListener("loadedmetadata", () => {
            setReady(true);
            video.play().catch(() => setAutoplayBlocked(true));
          });
        } else {
          setErr("مرورگر از پخش ویدیو پشتیبانی نمی‌کند.");
        }
      } catch (e) {
        console.error("[hls setup]", e);
        setErr("خطا در بارگذاری پخش‌کننده.");
      }
    }

    setup();
    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [hlsUrl]);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function goFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }

  // ─── بدون استریم ───
  if (!hlsUrl) {
    return (
      <div className="card p-0 overflow-hidden aspect-video bg-gradient-to-br from-ink-3 to-ink-2 border-line relative flex items-center justify-center">
        <div className="absolute inset-0 surface-grid opacity-20" />
        <div className="relative text-center px-4">
          <Radio className={`w-10 h-10 mx-auto mb-3 ${isLive ? "text-lime animate-pulse-soft" : "text-muted"}`} />
          <p className="text-sm text-paper/80 font-medium">
            {isLive ? "پخش زنده" : "کلاس در حال برگزاری نیست"}
          </p>
          <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-xs mx-auto">
            {waitingMessage ?? (isLive ? "در انتظار اتصال به استریم…" : "در زمان کلاس دوباره سر بزن.")}
          </p>
        </div>
      </div>
    );
  }

  // ─── خطا ───
  if (err) {
    return (
      <div className="card p-0 overflow-hidden aspect-video border-danger/30 relative flex items-center justify-center bg-ink-2">
        <div className="text-center px-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <p className="text-sm text-danger font-medium">{err}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-ghost btn-sm mt-4">
            رفرش صفحه
          </button>
        </div>
      </div>
    );
  }

  // ─── پخش واقعی ───
  return (
    <div
      ref={containerRef}
      className="card p-0 overflow-hidden aspect-video bg-black border-line relative group"
    >
      {/* بج زنده */}
      {isLive && ready && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/90 text-paper text-xs font-bold backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse-soft" />
          زنده
        </div>
      )}

      {/* Loader */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-lime animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted">در حال اتصال به کلاس…</p>
          </div>
        </div>
      )}

      {/* Autoplay blocked */}
      {autoplayBlocked && ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 backdrop-blur-sm">
          <div className="text-center px-4">
            <p className="text-sm text-paper mb-3">برای شروع پخش، ضربه بزن</p>
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) { v.play().then(() => setAutoplayBlocked(false)).catch(() => {}); }
              }}
              className="btn-primary btn-sm">
              شروع پخش
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        controls={false}
        autoPlay
        playsInline
        muted={muted}
        poster={poster}
        className="w-full h-full object-contain"
      />

      {/* کنترل‌های سفارشی — فقط وقتی آماده است */}
      {ready && !autoplayBlocked && (
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/80 text-paper transition"
              title={muted ? "روشن کردن صدا" : "قطع صدا"}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={goFullscreen}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/80 text-paper transition"
              title="تمام‌صفحه">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-paper/70">
            پخش زندهٔ کلاس
          </div>
        </div>
      )}
    </div>
  );
}