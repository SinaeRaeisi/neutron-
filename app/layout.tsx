import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEUTRON — هستهٔ یادگیری",
  description: "پلتفرم یادگیری هوشمند مبتنی بر گراف دانش",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
      </head>
      <body className="bg-ink text-paper antialiased font-sans">{children}</body>
    </html>
  );
}