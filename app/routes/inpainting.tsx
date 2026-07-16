import { SEOMeta } from "~/components/SeoMeta";
import Inpainting from "~/components/Inpainting";
import { createSeoMeta, createWebApplicationSchema } from "~/lib/seo";

export function meta() {
  const title = "AI Image Inpainting | High-Definition Photo Restoration Online";
  const description =
    "Professional AI-powered image inpainting tool. Remove unwanted objects, restore photos, and fill missing areas with high-quality results. WebGPU accelerated, 100% private.";

  return createSeoMeta({
    title,
    description,
    path: "/inpainting",
    keywords: "tuziyo, ai inpainting, remove object from image, photo restoration, ai image editor",
    schema: createWebApplicationSchema({ name: "tuziyo AI Image Inpainting", description, path: "/inpainting" }),
  });
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
