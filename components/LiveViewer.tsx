"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play, Video, Loader2, AlertCircle, Volume2, VolumeX,
  Maximize, UserX,
} from "lucide-react";

interface Props {
  liveId: string;
  peerId: string | null;
  onNeedJoin: () => void;
}

type ViewState = "idle" | "waiting" | "connected" | "error" | "kicked";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function LiveViewer({ liveId, peerId, onNeedJoin }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<boolean>(true);
  const [state, setState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [hostOnline, setHostOnline] = useState(false);

  useEffect(() => {
    if (peerId && state === "idle") setState("waiting");
  }, [peerId, state]);

  async function apiSend(to: string, type: string, payload: unknown) {
    if (!peerId) return;
    await fetch(`/api/live-signaling/${liveId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", peerId, to, type, payload }),
    }).catch(() => {});
  }

  async function apiDrain() {
    if (!peerId) return { messages: [], peers: [], hostOnline: false };
    try {
      const r = await fetch(`/api/live-signaling/${liveId}?peerId=${encodeURIComponent(peerId)}`, { cache: "no-store" });
      if (!r.ok) return { messages: [], peers: [], hostOnline: false };
      return await r.json() as { messages: any[]; peers: any[]; hostOnline: boolean };
    } catch {
      return { messages: [], peers: [], hostOnline: false };
    }
  }

  async function handleOffer(from: string, sdp: any) {
    let pc = pcRef.current;
    if (pc) { pc.close(); pcRef.current = null; }

    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (e.streams[0] && videoRef.current) {
        videoRef.current.srcObject = e.streams[0];
        videoRef.current.play()
          .then(() => { setVideoPlaying(true); setState("connected"); })
          .catch(() => { setState("connected"); setVideoPlaying(false); });
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) apiSend(from, "ice", e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === "connected") setState("connected");
      if (pc!.connectionState === "failed" || pc!.connectionState === "disconnected") {
        setState("waiting");
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await apiSend(from, "answer", { sdp: pc.localDescription });
      setState("waiting");
    } catch (e) {
      console.error("[answer]", e);
      setError("خطا در اتصال به پخش.");
      setState("error");
    }
  }

  useEffect(() => {
    if (!peerId) return;
    pollingRef.current = true;

    async function loop() {
      while (pollingRef.current) {
        const { messages, hostOnline: hostOn } = await apiDrain();
        setHostOnline(hostOn);

        for (const m of messages) {
          try {
            if (m.type === "offer") {
              await handleOffer(m.from, m.payload.sdp);
            } else if (m.type === "ice") {
              if (pcRef.current && m.payload) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(m.payload)).catch(() => {});
              }
            } else if (m.type === "leave") {
              if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
              setState("waiting");
              setVideoPlaying(false);
              if (videoRef.current) videoRef.current.srcObject = null;
            } else if (m.type === "kicked") {
              if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
              if (videoRef.current) videoRef.current.srcObject = null;
              setState("kicked");
              pollingRef.current = false;
            }
          } catch (e) {
            console.warn("[viewer signal]", e);
          }
        }

        await new Promise(r => setTimeout(r, 400));
      }
    }
    loop();

    const hb = setInterval(() => {
      fetch(`/api/live-signaling/${liveId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", peerId }),
      }).catch(() => {});
    }, 15_000);

    return () => {
      pollingRef.current = false;
      clearInterval(hb);
      if (pcRef.current) pcRef.current.close();
      fetch(`/api/live-signaling/${liveId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", peerId }),
      }).catch(() => {});
    };
  }, [liveId, peerId]);

  function forcePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setVideoPlaying(true)).catch(() => {});
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function fullscreen() {
    videoRef.current?.parentElement?.requestFullscreen?.().catch(() => {});
  }

  if (!peerId) {
    return (
      <div className="card aspect-video flex items-center justify-center bg-gradient-to-br from-ink-2 to-ink-3 border-line">
        <div className="text-center px-6">
          <Video className="w-12 h-12 text-lime mx-auto mb-3" />
          <h3 className="font-bold mb-1">پخش زنده</h3>
          <p className="text-muted text-sm mb-4">برای پیوستن به پخش، دکمهٔ زیر را بزن.</p>
          <button onClick={onNeedJoin} className="btn-primary">
            <Play className="w-4 h-4" /> پیوستن به کلاس
          </button>
        </div>
      </div>
    );
  }

  if (state === "kicked") {
    return (
      <div className="card aspect-video flex items-center justify-center border-danger/30">
        <div className="text-center px-6">
          <UserX className="w-12 h-12 text-danger mx-auto mb-3" />
          <h3 className="font-bold mb-1">از کلاس اخراج شدی</h3>
          <p className="text-muted text-sm">معلم تو را از این کلاس خارج کرده است.</p>
          <p className="text-xs text-muted mt-2">برای پیگیری با پشتیبانی تماس بگیر.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="aspect-video bg-black relative group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onPlay={() => setVideoPlaying(true)}
          onPause={() => setVideoPlaying(false)}
          className="w-full h-full object-contain"
        />

        {(state === "idle" || state === "waiting") && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/90 backdrop-blur-sm">
            <div className="text-center px-6">
              <Loader2 className="w-10 h-10 text-lime animate-spin mx-auto mb-3" />
              <p className="text-sm text-paper font-medium">
                {hostOnline ? "در حال اتصال به پخش…" : "در انتظار شروع پخش توسط معلم…"}
              </p>
              {!hostOnline && (
                <p className="text-xs text-muted mt-1">معلم هنوز پخش را آغاز نکرده</p>
              )}
            </div>
          </div>
        )}

        {state === "connected" && !videoPlaying && (
          <div onClick={forcePlay}
            className="absolute inset-0 flex items-center justify-center bg-ink/80 cursor-pointer">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-lime text-ink flex items-center justify-center mx-auto mb-3">
                <Play className="w-10 h-10 fill-current" />
              </div>
              <p className="text-sm text-paper font-bold">برای پخش، ضربه بزن</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/90">
            <div className="text-center px-6">
              <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
              <p className="text-sm text-danger">{error || "خطا در اتصال"}</p>
              <button onClick={() => window.location.reload()} className="btn-ghost btn-sm mt-3">
                تلاش دوباره
              </button>
            </div>
          </div>
        )}

        {state === "connected" && videoPlaying && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/90 text-paper text-xs font-bold backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse-soft" />
            زنده
          </div>
        )}

        {state === "connected" && videoPlaying && (
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={toggleMute}
              className="p-2 rounded-full bg-ink/80 backdrop-blur text-paper hover:bg-ink">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={fullscreen}
              className="p-2 rounded-full bg-ink/80 backdrop-blur text-paper hover:bg-ink">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}