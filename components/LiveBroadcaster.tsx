"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera, Monitor, Mic, MicOff, Video as VideoIcon, VideoOff,
  Square, Users, Loader2, AlertCircle, Radio, Play, UserX,
} from "lucide-react";

interface Props {
  liveId: string;
  peerId: string;
}

interface ViewerState {
  peerId: string;
  userId: string;
  userName: string;
  pc: RTCPeerConnection;
  connected: boolean;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function LiveBroadcaster({ liveId, peerId }: Props) {
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState<"camera" | "screen" | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<ViewerState[]>([]);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const viewersRef = useRef<Map<string, ViewerState>>(new Map());
  const knownViewersRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef<boolean>(true);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── اتصال stream به video عنصر بعد از mount شدن ───
  useEffect(() => {
    const v = localVideoRef.current;
    const s = localStreamRef.current;
    if (!ready || !v || !s) return;

    console.log("[broadcaster] attaching stream, tracks:", s.getTracks().map(t => `${t.kind}:${t.readyState}`));

    if (v.srcObject !== s) {
      v.srcObject = s;
    }
    v.muted = true;
    v.play()
      .then(() => {
        console.log("[broadcaster] video playing");
        setVideoPlaying(true);
      })
      .catch((e) => {
        console.warn("[broadcaster] play failed:", e);
        setVideoPlaying(false);
      });
  }, [ready, source]);

  // ─── API helpers ───
  async function apiSend(to: string, type: string, payload: unknown) {
    await fetch(`/api/live-signaling/${liveId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", peerId, to, type, payload }),
    }).catch(() => {});
  }

  async function apiDrain() {
    try {
      const r = await fetch(`/api/live-signaling/${liveId}?peerId=${encodeURIComponent(peerId)}`, { cache: "no-store" });
      if (!r.ok) return { messages: [], peers: [], hostOnline: false };
      return await r.json() as { messages: any[]; peers: any[]; hostOnline: boolean };
    } catch {
      return { messages: [], peers: [], hostOnline: false };
    }
  }

  async function apiKick(targetUserId: string, name: string) {
    if (!confirm(`«${name}» از کلاس اخراج شود؟`)) return;
    try {
      const res = await fetch(`/api/live-signaling/${liveId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick", userId: targetUserId }),
      });
      if (!res.ok) alert("اخراج ناموفق.");
    } catch { alert("خطای شبکه."); }
  }

  async function apiBanChat(targetUserId: string, name: string) {
    if (!confirm(`«${name}» از چت مسدود شود؟`)) return;
    try {
      const res = await fetch(`/api/live-chat/${liveId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banUser: targetUserId }),
      });
      if (!res.ok) alert("مسدودسازی ناموفق.");
    } catch { alert("خطای شبکه."); }
  }

  function forcePlay() {
    const v = localVideoRef.current;
    if (!v) return;
    v.play()
      .then(() => setVideoPlaying(true))
      .catch((e) => console.warn("forcePlay failed:", e));
  }

  async function start(kind: "camera" | "screen") {
    setError(null);
    try {
      let stream: MediaStream;
      if (kind === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } } as MediaTrackConstraints,
          audio: false,
        });
        try {
          const mic = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          mic.getAudioTracks().forEach(t => stream.addTrack(t));
        } catch {
          console.warn("mic unavailable");
        }
      }

      localStreamRef.current = stream;

      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (kind === "screen") stop();
        };
      });

      setSource(kind);
      setMicOn(stream.getAudioTracks().length > 0);
      setCamOn(stream.getVideoTracks().length > 0);
      setReady(true);  // ← UI عوض می‌شود؛ useEffect بالا stream را وصل می‌کند
    } catch (e: any) {
      console.error(e);
      setError(
        e?.name === "NotAllowedError"
          ? "دسترسی به دوربین/میکروفون رد شد. تنظیمات مرورگر را بررسی کن."
          : e?.name === "NotFoundError"
          ? "دوربین یا میکروفونی پیدا نشد."
          : "خطا در راه‌اندازی پخش."
      );
    }
  }

  function stop() {
    viewersRef.current.forEach(v => {
      v.pc.close();
      apiSend(v.peerId, "leave", null);
    });
    viewersRef.current.clear();
    knownViewersRef.current.clear();
    setViewers([]);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    setSource(null);
    setReady(false);
    setVideoPlaying(false);
  }

  async function connectToViewer(viewerPeerId: string, viewerName: string, viewerUserId: string) {
    if (viewersRef.current.has(viewerPeerId)) return;
    const stream = localStreamRef.current;
    if (!stream) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) apiSend(viewerPeerId, "ice", e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      const v = viewersRef.current.get(viewerPeerId);
      if (v) {
        v.connected = pc.connectionState === "connected";
        setViewers([...viewersRef.current.values()]);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        viewersRef.current.delete(viewerPeerId);
        setViewers([...viewersRef.current.values()]);
      }
    };

    const state: ViewerState = {
      peerId: viewerPeerId,
      userId: viewerUserId,
      userName: viewerName,
      pc,
      connected: false,
    };
    viewersRef.current.set(viewerPeerId, state);
    setViewers([...viewersRef.current.values()]);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await apiSend(viewerPeerId, "offer", { sdp: pc.localDescription });
    } catch (e) {
      console.error("[offer]", e);
      viewersRef.current.delete(viewerPeerId);
      setViewers([...viewersRef.current.values()]);
    }
  }

  useEffect(() => {
    pollingRef.current = true;

    async function loop() {
      while (pollingRef.current) {
        const { messages, peers } = await apiDrain();

        for (const p of peers) {
          if (p.role === "viewer" && !knownViewersRef.current.has(p.id) && ready) {
            knownViewersRef.current.add(p.id);
            await connectToViewer(p.id, p.userName, p.userId);
          }
        }

        for (const m of messages) {
          try {
            if (m.type === "answer") {
              const v = viewersRef.current.get(m.from);
              if (v && v.pc.signalingState === "have-local-offer") {
                await v.pc.setRemoteDescription(new RTCSessionDescription(m.payload.sdp));
              }
            } else if (m.type === "ice") {
              const v = viewersRef.current.get(m.from);
              if (v && m.payload) {
                await v.pc.addIceCandidate(new RTCIceCandidate(m.payload)).catch(() => {});
              }
            } else if (m.type === "leave") {
              const v = viewersRef.current.get(m.from);
              if (v) {
                v.pc.close();
                viewersRef.current.delete(m.from);
                knownViewersRef.current.delete(m.from);
                setViewers([...viewersRef.current.values()]);
              }
            } else if (m.type === "ready") {
              if (!viewersRef.current.has(m.from) && ready) {
                knownViewersRef.current.add(m.from);
                await connectToViewer(m.from, "", "");
              }
            }
          } catch (e) {
            console.warn("[signal]", m.type, e);
          }
        }

        await new Promise(r => setTimeout(r, 400));
      }
    }
    loop();

    heartbeatRef.current = setInterval(() => {
      fetch(`/api/live-signaling/${liveId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", peerId }),
      }).catch(() => {});
    }, 15_000);

    return () => {
      pollingRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [liveId, peerId, ready]);

  function toggleMic() {
    const s = localStreamRef.current;
    if (!s) return;
    const tracks = s.getAudioTracks();
    const next = !micOn;
    tracks.forEach(t => t.enabled = next);
    setMicOn(next);
  }

  function toggleCam() {
    const s = localStreamRef.current;
    if (!s) return;
    const tracks = s.getVideoTracks();
    const next = !camOn;
    tracks.forEach(t => t.enabled = next);
    setCamOn(next);
  }

  useEffect(() => {
    return () => {
      stop();
      fetch(`/api/live-signaling/${liveId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", peerId }),
      }).catch(() => {});
    };
  }, []);

  if (!ready) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-lime/15 border-2 border-lime/40 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-lime" />
          </div>
          <h3 className="font-bold text-lg mb-2">پخش زنده</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            دوربین یا صفحه‌ات را به اشتراک بگذار.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl2 bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2 max-w-md mx-auto text-right">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => start("camera")} className="btn-primary">
              <Camera className="w-4 h-4" /> شروع با دوربین
            </button>
            <button onClick={() => start("screen")} className="btn-ghost">
              <Monitor className="w-4 h-4" /> اشتراک صفحه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="aspect-video bg-black relative group">
        {/* ⚠️ این video باید همیشه در DOM باشد */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          onPlay={() => setVideoPlaying(true)}
          onPause={() => setVideoPlaying(false)}
          onLoadedMetadata={() => console.log("[broadcaster] metadata loaded")}
          onCanPlay={() => console.log("[broadcaster] can play")}
          className={`w-full h-full object-contain ${!camOn ? "opacity-30" : ""}`}
        />

        {!videoPlaying && camOn && (
          <div onClick={forcePlay}
            className="absolute inset-0 flex items-center justify-center bg-ink/80 cursor-pointer z-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-lime text-ink flex items-center justify-center mx-auto mb-3">
                <Play className="w-10 h-10 fill-current" />
              </div>
              <p className="text-sm text-paper font-bold">برای نمایش، ضربه بزن</p>
            </div>
          </div>
        )}

        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-paper/70">
              <VideoOff className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">دوربین خاموش</p>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/90 text-paper text-xs font-bold backdrop-blur z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse-soft" />
          زنده
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink/80 backdrop-blur border border-line text-paper text-xs z-20">
          <Users className="w-3 h-3" />
          {viewers.filter(v => v.connected).length.toLocaleString("fa-IR")} بیننده
        </div>

        <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 z-20">
          <button onClick={toggleMic}
            className={`p-3 rounded-full backdrop-blur transition ${
              micOn ? "bg-ink/80 hover:bg-ink text-paper" : "bg-danger text-paper"
            }`}>
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {source === "camera" && (
            <button onClick={toggleCam}
              className={`p-3 rounded-full backdrop-blur transition ${
                camOn ? "bg-ink/80 hover:bg-ink text-paper" : "bg-danger text-paper"
              }`}>
              {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button onClick={stop}
            className="px-4 py-3 rounded-full bg-danger text-paper hover:bg-danger/80 transition flex items-center gap-2 text-sm font-bold">
            <Square className="w-4 h-4 fill-current" /> پایان
          </button>
        </div>
      </div>

      {viewers.length > 0 && (
        <div className="p-3 border-t border-line">
          <div className="text-xs text-muted mb-2">
            بینندگان ({viewers.length.toLocaleString("fa-IR")})
          </div>
          <div className="space-y-1.5">
            {viewers.map(v => (
              <div key={v.peerId}
                className="flex items-center gap-2 p-2 rounded-lg bg-ink-3/50 hover:bg-ink-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${v.connected ? "bg-ok" : "bg-amber"}`} />
                <span className="flex-1 text-xs truncate">{v.userName || "بیننده"}</span>
                {v.userId && (
                  <>
                    <button
                      onClick={() => apiBanChat(v.userId, v.userName || "بیننده")}
                      className="text-[10px] text-amber px-1.5 py-0.5 rounded hover:bg-amber/10 transition"
                      title="مسدودسازی از چت">
                      سکوت
                    </button>
                    <button
                      onClick={() => apiKick(v.userId, v.userName || "بیننده")}
                      className="text-[10px] text-danger px-1.5 py-0.5 rounded hover:bg-danger/10 transition flex items-center gap-0.5"
                      title="اخراج از کلاس">
                      <UserX className="w-3 h-3" /> اخراج
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}