import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نوترون — هستهٔ یادگیری",
    short_name: "نوترون",
    description: "پلتفرم یادگیری هوشمند مبتنی بر گراف دانش — دوره‌ها، آزمون، کلاس زنده",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080B16",
    theme_color: "#C6F24E",
    dir: "rtl",
    lang: "fa",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "دوره‌ها", url: "/app/courses" },
      { name: "رفع اشکال", url: "/app/qanda" },
      { name: "کلاس زنده", url: "/app/live" },
    ],
  };
}