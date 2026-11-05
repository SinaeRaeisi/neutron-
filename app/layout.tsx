import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "نوترون — هستهٔ یادگیری",
    template: "%s | نوترون",
  },
  description: "پلتفرم یادگیری هوشمند مبتنی بر گراف دانش — دوره‌ها، آزمون، کلاس زنده",
  applicationName: "نوترون",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "نوترون",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#C6F24E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* استفاده از CDN ایرانی برای فونت وزیرمتن (بدون تحریم و پرسرعت) */}
        <link rel="preconnect" href="https://cdn.fontcdn.ir" />
        <link 
          rel="stylesheet" 
          href="https://cdn.fontcdn.ir/Font/Persian/Vazir/Vazir.css" 
        />
      </head>
      <body className="bg-ink text-paper antialiased font-sans">
        {children}
      </body>
    </html>
  );
}