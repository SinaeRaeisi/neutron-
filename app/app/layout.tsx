import { AppShell } from "@/components/AppShell";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <PWAInstallPrompt />
    </>
  );
}