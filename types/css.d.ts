// CSS side-effect imports — Next.js
declare module "*.css";
declare module "*.scss";
declare module "*.sass";

// SVG imports — اگر بعداً خواستی
declare module "*.svg" {
  const content: { src: string; height: number; width: number };
  export default content;
}