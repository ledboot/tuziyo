import { Link } from "react-router";
import {
  Wand2,
  Scaling,
  Crop,
  Repeat,
  ShieldCheck,
  ArrowRight,
  Zap,
} from "lucide-react";
import type { Route } from "./+types/_index";
import { useI18n } from "~/lib/i18n";
import { SEOMeta } from "~/components/SeoMeta";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "tuziyo - Professional AI Image Tools | Free & Secure" },
    {
      name: "description",
      content:
        "Professional image editing tools powered by AI. Remove watermarks, resize, crop, and convert images - all free and secure in your browser. No registration required.",
    },
    {
      name: "keywords",
      content:
        "tuziyo, free ai image editor, remove watermark online, bulk image resizer, free image cropper, photo converter",
    },
    { property: "og:title", content: "tuziyo - Professional AI Image Tools" },
    {
      property: "og:description",
      content:
        "Professional image editing tools powered by AI. 100% private and free.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tuziyo.com" },
    {
      property: "og:image",
      content: "https://tuziyo.com/og-index.png",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "twitter:domain", content: "tuziyo.com" },
    { property: "twitter:url", content: "https://tuziyo.com" },
    { name: "twitter:title", content: "tuziyo - Professional AI Image Tools" },
    {
      name: "twitter:description",
      content:
        "Professional image editing tools powered by AI. 100% private and free.",
    },
    {
      name: "twitter:image",
      content:"https://tuziyo.com/og-index.png",
    },
    { name: "robots", content: "index, follow" },
    { name: "author", content: "tuziyo" },
  ];
}

export default function Index() {
  const { t } = useI18n();

  const tools = [
    {
      title: t.inpainting.title,
      description: t.inpainting.description,
      to: "/inpainting",
      icon: Wand2,
    },
    {
      title: t.resize.title,
      description: t.resize.description,
      to: "/resize",
      icon: Scaling,
    },
    {
      title: t.crop.title,
      description: t.crop.description,
      to: "/crop",
      icon: Crop,
    },
    {
      title: t.convert.title,
      description: t.convert.description,
      to: "/convert",
      icon: Repeat,
    },
  ];

  return (
    <>
      <SEOMeta page="home" />
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:px-12 lg:py-32 text-center hero-pattern transition-colors duration-300">
        <div className="mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-brand/10 px-4 py-1.5 text-2xs font-black uppercase tracking-[0.2em] text-primary-brand mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ShieldCheck className="size-4" />
            {t.common.freeForever}
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-7xl leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            {t.home.heroTitle.split(".").map((part, i) => (
              <span key={i} className={i === 1 ? "text-primary-brand" : ""}>
                {part}
                {i === 0 && part.length > 0 ? ". " : ""}
              </span>
            ))}
          </h1>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            {t.home.heroSubtitle}
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
            <button
              type="button"
              className="rounded-2xl bg-primary-brand px-10 py-5 text-lg font-black text-white shadow-[0_20px_40px_-10px_rgba(0,194,184,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,194,184,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all font-display uppercase tracking-widest"
              onClick={() => {
                const toolsSection = document.getElementById("tools");
                toolsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t.home.getStarted}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary-brand/5 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary-brand/5 rounded-full blur-3xl translate-x-1/2 pointer-events-none" />
      </section>

      {/* Tools Section */}
      <section
        id="tools"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-12 scroll-mt-20"
      >
        <div className="mb-16">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.home.featuresTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, i) => (
            <Link
              to={tool.to}
              key={tool.to}
              className="group relative flex flex-col gap-6 rounded-[2.5rem] border border-primary-brand/30 bg-white p-8 shadow-2xl shadow-primary-brand/5 transition-all hover:-translate-y-2 hover:border-primary-brand/30 hover:shadow-2xl hover:shadow-primary-brand/5 sm:border-slate-100 sm:shadow-none dark:border-primary-brand/30 dark:bg-slate-900/50 dark:sm:border-slate-800"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-brand text-white transition-all duration-300 group-hover:rotate-6 sm:bg-slate-50 sm:text-slate-400 dark:bg-primary-brand dark:sm:bg-slate-800 sm:group-hover:bg-primary-brand sm:group-hover:text-white">
                <tool.icon className="size-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  {tool.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                  {tool.description}
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="size-8 rounded-full border-2 border-primary-brand bg-primary-brand text-white flex items-center justify-center transition-all sm:border-slate-100 sm:bg-transparent sm:text-inherit dark:border-primary-brand dark:sm:border-slate-800 group-hover:border-primary-brand group-hover:bg-primary-brand group-hover:text-white">
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 dark:bg-slate-900/30 px-6 py-32 lg:px-12 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-24 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.home.privacyTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t.home.privacyDesc}
              </p>
            </div>
            <div className="space-y-6">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap className="size-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.home.speedTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t.home.speedDesc}
              </p>
            </div>
            <div className="space-y-6">
              <div className="size-12 rounded-2xl bg-primary-brand/10 text-primary-brand flex items-center justify-center">
                <Wand2 className="size-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.home.aiTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t.home.aiDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
        <div className="relative isolate overflow-hidden bg-slate-900 dark:bg-primary-brand px-6 py-20 shadow-2xl rounded-5xl sm:px-16 md:py-28 text-center transition-all duration-500">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl leading-tight mb-8">
              {t.home.getStarted}
            </h2>
            <p className="text-lg leading-relaxed text-white/70 mb-12 font-medium">
              {t.common.ctaDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                const toolsSection = document.getElementById("tools");
                toolsSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-lg font-black text-slate-900 shadow-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              {t.common.explore}
              <ArrowRight className="size-5" />
            </button>
          </div>

          {/* Decorative gradients */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-brand/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </section>
    </>
  );
}
