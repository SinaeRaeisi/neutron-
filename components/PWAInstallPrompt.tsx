"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // check dismiss
    if (localStorage.getItem("neutron.pwa.dismissed") === "1") {
      setDismissed(true);
    }

    // iOS detection
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(iOS);

    // already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS: show our own hint
    if (iOS && localStorage.getItem("neutron.pwa.dismissed") !== "1") {
      setTimeout(() => setVisible(true), 4000);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setDeferred(null);
    } else if (isIOS) {
      alert("در Safari، روی دکمهٔ Share (مربع با فلش) بزن و «Add to Home Screen» را انتخاب کن.");
    }
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem("neutron.pwa.dismissed", "1");
    setDismissed(true);
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:left-auto md:right-6 md:w-80 z-40 animate-in slide-in-from-bottom">
      <div className="card !p-4 shadow-2xl border-lime/30 bg-ink-2/95 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl2 bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">نصب نوترون</div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {isIOS
                ? "از منوی Share → Add to Home Screen"
                : "نوترون را مثل یک اپ روی گوشی نصب کن."}
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={install} className="btn-primary btn-sm flex-1">
                نصب
              </button>
              <button onClick={dismiss} className="btn-ghost btn-sm">
                بعداً
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 -m-1 text-muted hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}