import { useState, useCallback, useEffect } from "react";
import JSZip from "jszip";
import {
  ShieldCheck,
  ImagePlus,
  Upload,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Trash2,
  Lock,
  Zap,
  CircleDollarSign,
} from "lucide-react";
import type { Route } from "./+types/convert";
import { useI18n } from "../lib/i18n";
import { SEOMeta } from "../components/SeoMeta";

type OutputFormat = "jpeg" | "png" | "webp";

interface ImageItem {
  file: File;
  preview: string;
  originalFormat: string;
  dimensions: { width: number; height: number };
  size: number;
  converted?: {
    blob: Blob;
    url: string;
  };
  isConverting?: boolean;
  error?: string;
}

const OUTPUT_FORMATS: { label: string; value: OutputFormat; mime: string }[] = [
  { label: "WebP (Optimized)", value: "webp", mime: "image/webp" },
  { label: "PNG (Lossless)", value: "png", mime: "image/png" },
  { label: "JPEG (Standard)", value: "jpeg", mime: "image/jpeg" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Private Batch Image Converter | HEIC to PNG, JPG, WebP" },
    {
      name: "description",
      content:
        "Convert images between formats instantly. Secure batch processing for HEIC, PNG, and JPEG. Images stay on your device.",
    },
    {
      name: "keywords",
      content:
        "heic to png converter free, batch image converter no upload, secure photo format changer, webp converter online",
    },
    {
      property: "og:title",
      content: "Private Batch Image Converter | Free & Secure",
    },
    {
      property: "og:description",
      content:
        "Convert images between formats instantly. Secure batch processing without uploads.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tuziyo.com/convert" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "index, follow" },
  ];
}

export default function ConvertPage() {
  const { t } = useI18n();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalOutputFormat, setGlobalOutputFormat] =
    useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side only rendering for file operations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getFormatFromFile = (file: File): string => {
    const type = file.type.toLowerCase();
    if (type.includes("heic") || type.includes("heif")) return "HEIC";
    if (type.includes("jpeg") || type.includes("jpg")) return "JPEG";
    if (type.includes("png")) return "PNG";
    if (type.includes("webp")) return "WebP";
    if (type.includes("gif")) return "GIF";
    if (type.includes("bmp")) return "BMP";
    return file.name.split(".").pop()?.toUpperCase() || "Unknown";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileChange = useCallback(
    (file: File) => {
      const isHeic =
        file.type.includes("heic") ||
        file.type.includes("heif") ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      const processFile = async () => {
        let previewUrl: string;
        let width = 0;
        let height = 0;

        if (isHeic) {
          try {
            const heic2any = (await import("heic2any")).default;
            const result = await heic2any({
              blob: file,
              toType: "image/png",
              quality: 0.1,
            });
            const blob = Array.isArray(result) ? result[0] : result;
            previewUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.error("Failed to convert HEIC for preview:", e);
            previewUrl = "";
          }
        } else {
          previewUrl = URL.createObjectURL(file);
        }

        if (previewUrl) {
          const img = new Image();
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            setImages((prev) => [
              ...prev,
              {
                file,
                preview: previewUrl,
                originalFormat: getFormatFromFile(file),
                dimensions: { width, height },
                size: file.size,
              },
            ]);
          };
          img.src = previewUrl;
        }
      };

      processFile();
    },
    [setImages],
  );

  const handleMultipleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const isImage =
          file.type.startsWith("image/") ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif");
        if (isImage) {
          handleFileChange(file);
        }
      });
    },
    [handleFileChange],
  );

  const convertImage = useCallback(
    async (item: ImageItem, format: OutputFormat): Promise<Blob> => {
      const isHeic =
        item.file.type.includes("heic") ||
        item.file.type.includes("heif") ||
        item.file.name.toLowerCase().endsWith(".heic") ||
        item.file.name.toLowerCase().endsWith(".heif");

      const targetMime = `image/${format}`;

      if (isHeic) {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({
          blob: item.file,
          toType: targetMime as any,
          quality: quality / 100,
        });
        return Array.isArray(result) ? result[0] : result;
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to convert image"));
            },
            targetMime,
            quality / 100,
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = item.preview;
      });
    },
    [quality],
  );

  const handleBatchProcess = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    const zip = new JSZip();

    for (let i = 0; i < images.length; i += 1) {
      if (!images[i].converted) {
        try {
          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? { ...img, isConverting: true, error: undefined }
                : img,
            ),
          );

          const blob = await convertImage(images[i], globalOutputFormat);
          const baseName = images[i].file.name.replace(/\.[^/.]+$/, "");
          const filename = `${baseName}.${globalOutputFormat}`;
          zip.file(filename, blob);

          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? {
                    ...img,
                    isConverting: false,
                    converted: { blob, url: URL.createObjectURL(blob) },
                  }
                : img,
            ),
          );
        } catch (e) {
          setImages((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? { ...img, isConverting: false, error: (e as Error).message }
                : img,
            ),
          );
        }
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tuziyo-converted-images.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setIsProcessing(false);
  }, [images, convertImage, globalOutputFormat]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      if (newImages[index].preview)
        URL.revokeObjectURL(newImages[index].preview);
      if (newImages[index].converted?.url)
        URL.revokeObjectURL(newImages[index].converted.url);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SEOMeta page="convert" />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
            <ShieldCheck className="size-3.5 text-green-600" />
            {t.common.freeForever}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.convert.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.convert.description}
          </p>
        </div>

        <section className="relative">
          <div
            className={`group relative flex flex-col items-center justify-center p-12 md:p-16 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 ${
              images.length === 0
                ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
            } hover:border-primary-brand/50 hover:bg-primary-brand/5`}
          >
            <div className="size-20 bg-primary-brand/10 rounded-3xl flex items-center justify-center mb-6 text-primary-brand group-hover:scale-110 transition-transform">
              <ImagePlus className="size-10" />
            </div>
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.inpainting.dropzone}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {t.convert.description}
              </p>
            </div>
            <label
              htmlFor="file-upload"
              className="flex items-center gap-3 px-10 py-4 bg-primary-brand text-white rounded-2xl font-bold shadow-xl shadow-primary-brand/25 hover:shadow-primary-brand/40 transition-all active:scale-95 cursor-pointer font-display uppercase tracking-widest text-xs"
            >
              <Upload className="size-5" />
              {t.common.newProject}
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleMultipleFiles(e.target.files)
                }
              />
            </label>

            {/* Supported Formats Info */}
            <div className="mt-12 flex flex-col md:flex-row items-center gap-6 md:gap-12 border-t border-slate-100 dark:border-slate-800 pt-10 w-full max-w-2xl justify-center">
              <div className="space-y-1.5 text-center">
                <p className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {t.convert.supportedFormats}
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary-brand" />
                    {t.convert.inputFormats}
                  </p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    {t.convert.outputFormats}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {images.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-8">
                <label htmlFor="target-format" className="flex flex-col gap-2">
                  <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">
                    {t.convert.targetFormat}
                  </span>
                  <select
                    id="target-format"
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-brand min-w-45 py-3 px-4 text-slate-700 dark:text-slate-200"
                    value={globalOutputFormat}
                    onChange={(e) =>
                      setGlobalOutputFormat(e.target.value as OutputFormat)
                    }
                  >
                    {OUTPUT_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label
                  htmlFor="quality-setting"
                  className="flex flex-col gap-2"
                >
                  <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">
                    {t.convert.quality}
                  </span>
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl">
                    <input
                      id="quality-setting"
                      className="w-32 accent-primary-brand"
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                    />
                    <span className="text-sm font-bold text-primary-brand w-8">
                      {quality}%
                    </span>
                  </div>
                </label>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBatchProcess}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  <span className={isProcessing ? "animate-spin" : ""}>
                    {isProcessing ? (
                      <RefreshCw className="size-5" />
                    ) : (
                      <PlayCircle className="size-5" />
                    )}
                  </span>
                  {isProcessing ? t.common.processing : t.convert.convertAll}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-2xs font-bold uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">{t.common.source}</th>
                      <th className="px-8 py-5">{t.common.size}</th>
                      <th className="px-8 py-5">{t.common.status}</th>
                      <th className="px-8 py-5 text-right">
                        {t.common.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {images.map((img, index) => (
                      <tr
                        key={img.preview || index}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="size-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img
                                src={img.preview}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-50">
                                {img.file.name}
                              </p>
                              <p className="text-xs text-slate-400 font-medium">
                                {img.dimensions.width} x {img.dimensions.height}{" "}
                                pixels
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-2xs font-bold text-slate-500 uppercase">
                            {formatSize(img.size)} • {img.originalFormat}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {img.isConverting && (
                              <>
                                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary-brand/40 w-1/2 animate-pulse" />
                                </div>
                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-tighter">
                                  {t.common.processing}
                                </span>
                              </>
                            )}
                            {!img.isConverting && img.converted && (
                              <div className="flex items-center gap-2 text-emerald-500">
                                <CheckCircle2 className="size-5" />
                                <span className="text-2xs font-bold uppercase tracking-tighter">
                                  {t.common.completed}
                                </span>
                              </div>
                            )}
                            {!img.isConverting &&
                              !img.converted &&
                              img.error && (
                                <div className="flex items-center gap-2 text-red-500">
                                  <AlertCircle className="size-5" />
                                  <span className="text-2xs font-bold uppercase tracking-tighter">
                                    {t.common.failed}
                                  </span>
                                </div>
                              )}
                            {!img.isConverting &&
                              !img.converted &&
                              !img.error && (
                                <span className="text-2xs font-bold text-primary-brand uppercase tracking-tighter">
                                  {t.common.ready}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {img.converted && (
                              <a
                                href={img.converted.url}
                                download={`${img.file.name.replace(
                                  /\.[^/.]+$/,
                                  "",
                                )}.${globalOutputFormat}`}
                                className="size-10 flex items-center justify-center rounded-xl bg-primary-brand/10 text-primary-brand hover:bg-primary-brand hover:text-white transition-all"
                              >
                                <Download className="size-5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              {img.isConverting ? (
                                <X className="size-5" />
                              ) : (
                                <Trash2 className="size-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">
                    {images.length} Files Selected
                  </p>
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">
                    {t.common.total}:{" "}
                    {formatSize(images.reduce((a, b) => a + b.size, 0))}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {[
            {
              id: "private",
              icon: Lock,
              title: t.home.privacyTitle,
              desc: t.home.privacyDesc,
              color: "blue",
            },
            {
              id: "fast",
              icon: Zap,
              title: t.home.speedTitle,
              desc: t.home.speedDesc,
              color: "purple",
            },
            {
              id: "free",
              icon: CircleDollarSign,
              title: t.common.freeForever,
              desc: t.home.aiDesc,
              color: "green",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-4xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm"
            >
              <div
                className={`size-12 rounded-2xl flex items-center justify-center mx-auto ${
                  feature.color === "blue" ? "bg-blue-50 text-blue-500" : ""
                } ${
                  feature.color === "purple"
                    ? "bg-purple-50 text-purple-500"
                    : ""
                } ${
                  feature.color === "green" ? "bg-green-50 text-green-500" : ""
                }`}
              >
                <feature.icon className="size-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {feature.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
