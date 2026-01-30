import { SEOMeta } from "~/components/SeoMeta";
import Inpainting from "~/components/Inpainting";

export function meta() {
  return [
    { title: "AI Image Inpainting | High-Definition Photo Restoration Online" },
    {
      name: "description",
      content:
        "Professional AI-powered image inpainting tool. Remove unwanted objects, restore photos, and fill missing areas with high-quality results. WebGPU accelerated, 100% private.",
    },
    {
      name: "keywords",
      content:
        "ai inpainting, image restoration, photo repair, remove objects, fill missing areas, webgpu, browser-based, mi-gan",
    },
    {
      property: "og:title",
      content: "AI Image Inpainting | HD Photo Restoration",
    },
    {
      property: "og:description",
      content:
        "Professional image inpainting with MI-GAN AI. Remove objects and restore photos with high-quality results.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tuziyo.com/inpainting" },
    {
      property: "og:image",
      content: "https://tuziyo.com/og-inpainting.png",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "twitter:domain", content: "tuziyo.com" },
    { property: "twitter:url", content: "https://tuziyo.com/inpainting" },
    {
      name: "twitter:title",
      content: "AI Image Inpainting | HD Photo Restoration",
    },
    {
      name: "twitter:description",
      content:
        "Professional image inpainting with MI-GAN AI. Remove objects and restore photos with high-quality results.",
    },
    {
      name: "twitter:image",
      content: "https://tuziyo.com/og-inpainting.png",  
    },
    { name: "robots", content: "index, follow" },
    { name: "author", content: "tuziyo" },
  ];
}

export default function InpaintingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SEOMeta page="inpainting" />
      <main className="flex-1 flex flex-col max-w-screen-2xl mx-auto w-full overflow-y-auto">
        <Inpainting />
      </main>
    </div>
  );
}
