import { useState, useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import {
  ZoomOut,
  ZoomIn,
  Maximize,
  Upload,
  Scaling,
  FileText,
  Plus,
  Ruler,
  Link as LinkIcon,
  Link2Off,
  RefreshCw,
  Download,
} from "lucide-react";
import type { Route } from "./+types/resize";
import { useI18n } from "~/lib/i18n";
import { SEOMeta } from "~/components/SeoMeta";
import { createSeoMeta, createWebApplicationSchema } from "~/lib/seo";

type ResizeMode = "px" | "percentage";

interface ImageItem {
  file: File;
  preview: string;
  originalWidth: number;
  originalHeight: number;
  size: number;
}

export function meta({}: Route.MetaArgs) {
  const title = "Batch Image Resizer | Resize Images by Percentage or Pixels";
  const description =
    "Resize multiple images at once with precision. Support for aspect ratio locking and percentage scaling. 100% private and fast.";

  return createSeoMeta({
    title,
    description,
    path: "/resize",
    keywords: "tuziyo, bulk image resizer, image resizer online, resize images, percentage image resizer",
    schema: createWebApplicationSchema({ name: "tuziyo Batch Image Resizer", description, path: "/resize" }),
  });
}

export default function ResizePage() {
  const { t } = useI18n();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("px");
  const [percentage, setPercentage] = useState(100);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(85);
  const [outputFormat, setOutputFormat] = useState("WEBP");
  const [isDragging, setIsDragging] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentImage = images[selectedIndex];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileChange = useCallback(
    (file: File) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const newItem = {
          file,
          preview: url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          size: file.size,
        };
        setImages((prev) => [...prev, newItem]);
        if (images.length === 0) {
          setTargetWidth(img.naturalWidth);
          setTargetHeight(img.naturalHeight);
        }
      };
      img.src = url;
    },
    [images.length],
  );

  const handleMultipleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          handleFileChange(file);
        }
      });
    },
    [handleFileChange],
  );

  const getNewDimensions = useCallback(() => {
    if (!currentImage) return { width: 0, height: 0 };
    if (resizeMode === "percentage") {
      return {
        width: Math.round(currentImage.originalWidth * (percentage / 100)),
        height: Math.round(currentImage.originalHeight * (percentage / 100)),
      };
    }
    return { width: targetWidth, height: targetHeight };
  }, [currentImage, resizeMode, percentage, targetWidth, targetHeight]);

  useEffect(() => {
    if (!currentImage || !previewCanvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = previewCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const { width, height } = getNewDimensions();
      const maxDisplaySize = 1200;
      const scale = Math.min(maxDisplaySize / width, maxDisplaySize / height, 1);
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = currentImage.preview;
  }, [currentImage, getNewDimensions]);

  const processImage = useCallback(
    async (item: ImageItem): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          const { width, height } = getNewDimensions();
          canvas.width = width;
          canvas.height = height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject()),
            `image/${outputFormat.toLowerCase()}`,
            outputFormat === "PNG" ? undefined : 0.92,
          );
        };
        img.src = item.preview;
      });
    },
    [getNewDimensions, outputFormat],
  );

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    if (images.length === 1) {
      const blob = await processImage(currentImage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const { width, height } = getNewDimensions();
      a.href = url;
      a.download = `tuziyo_${width}x${height}_${currentImage.file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const zip = new JSZip();
      for (let i = 0; i < images.length; i += 1) {
        const blob = await processImage(images[i]);
        const { width, height } = getNewDimensions();
        zip.file(`tuziyo_${width}x${height}_${images[i].file.name}`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tuziyo-resized-images.zip";
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsProcessing(false);
  }, [images, currentImage, processImage, getNewDimensions]);

  const applyPreset = (w: number, h: number) => {
    setResizeMode("px");
    setTargetWidth(w);
    setTargetHeight(h);
    if (currentImage) {
      setPercentage(Math.round((w / currentImage.originalWidth) * 100));
    }
  };

  const { width: displayWidth, height: displayHeight } = getNewDimensions();

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <SEOMeta page="resize" />
      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 relative flex flex-col bg-base-200 overflow-hidden">
          {images.length > 0 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="btn-group">
                <button className="btn btn-sm btn-ghost" onClick={() => setZoom(Math.max(10, zoom - 10))}>
                  <ZoomOut className="size-4" />
                </button>
                <button className="btn btn-sm btn-ghost">{zoom}%</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                  <ZoomIn className="size-4" />
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setZoom(100)} title={t.resize.zoom}>
                  <Maximize className="size-4" />
                </button>
              </div>
            </div>
          )}

          <div
            className={`flex-1 flex items-center justify-center p-12 relative overflow-auto transition-colors ${isDragging && images.length > 0 ? "bg-primary/5" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files && handleMultipleFiles(e.dataTransfer.files); }}
          >
            {images.length === 0 ? (
              <div className="max-w-md w-full text-center">
                <div className={`card bg-base-100 shadow-2xl ${isDragging ? "ring-4 ring-primary ring-offset-4" : ""}`}>
                  <div className="card-body items-center">
                    <div className={`size-20 rounded-3xl flex items-center justify-center mb-6 ${isDragging ? "bg-primary text-primary-content" : "bg-primary/10 text-primary"}`}>
                      <Upload className="size-10" />
                    </div>
                    <h2 className="card-title text-xl">{t.resize.title}</h2>
                    <p className="text-base-content/60">{t.inpainting.dropzone}</p>
                    <div className="card-actions mt-4">
                      <label className="btn btn-primary">
                        {t.common.uploadImage}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative transition-all duration-300" style={{ transform: `scale(${zoom / 100})` }}>
                <div className="card bg-base-100 shadow-2xl p-2">
                  <canvas ref={previewCanvasRef} className="block rounded-lg max-w-full" />
                  <div className="flex gap-4 mt-4 text-sm font-bold text-base-content/60 uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Scaling className="size-4 text-primary" />
                      {displayWidth} × {displayHeight} PX
                    </span>
                    <span className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      {formatSize(currentImage.size)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-20 bg-base-100/80 backdrop-blur-md rounded-2xl shadow-2xl flex items-center px-4 gap-3 z-20">
              {images.map((img, idx) => (
                <button
                  key={img.preview}
                  onClick={() => { setSelectedIndex(idx); setTargetWidth(img.originalWidth); setTargetHeight(img.originalHeight); }}
                  className={`size-12 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === idx ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <label className="size-12 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center cursor-pointer hover:border-primary transition-all">
                <Plus className="size-6 text-base-content/40" />
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)} />
              </label>
            </div>
          )}
        </section>

        <aside className="w-96 border-l border-base-200 bg-base-100 flex flex-col z-20">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-4 flex items-center gap-2">
                  <Ruler className="size-4" />
                  {t.resize.title}
                </h3>
                <div className="tabs tabs-boxed bg-base-200 mb-4">
                  <button className={`tab ${resizeMode === "px" ? "tab-active" : ""}`} onClick={() => setResizeMode("px")}>
                    {t.resize.pixels}
                  </button>
                  <button className={`tab ${resizeMode === "percentage" ? "tab-active" : ""}`} onClick={() => setResizeMode("percentage")}>
                    {t.resize.percentage}
                  </button>
                </div>

                {resizeMode === "px" ? (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-xs uppercase tracking-wider">{t.resize.width}</span>
                        <span className="label-text-alt text-base-content/50">PX</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        value={targetWidth}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setTargetWidth(w);
                          if (lockRatio && currentImage) {
                            setTargetHeight(Math.round(w * (currentImage.originalHeight / currentImage.originalWidth)));
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-center">
                      <button
                        className={`btn btn-circle btn-sm ${lockRatio ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setLockRatio(!lockRatio)}
                        title={t.resize.aspectRatio}
                      >
                        {lockRatio ? <LinkIcon className="size-4" /> : <Link2Off className="size-4" />}
                      </button>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-xs uppercase tracking-wider">{t.resize.height}</span>
                        <span className="label-text-alt text-base-content/50">PX</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        value={targetHeight}
                        onChange={(e) => {
                          const h = Number(e.target.value);
                          setTargetHeight(h);
                          if (lockRatio && currentImage) {
                            setTargetWidth(Math.round(h * (currentImage.originalWidth / currentImage.originalHeight)));
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-xs uppercase tracking-wider">{t.resize.percentage}</span>
                        <span className="label-text-alt text-primary font-bold">{percentage}%</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={percentage}
                        className="range range-primary"
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setPercentage(p);
                          if (currentImage) {
                            setTargetWidth(Math.round(currentImage.originalWidth * (p / 100)));
                            setTargetHeight(Math.round(currentImage.originalHeight * (p / 100)));
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100, 150, 200].map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setPercentage(p);
                            if (currentImage) {
                              setTargetWidth(Math.round(currentImage.originalWidth * (p / 100)));
                              setTargetHeight(Math.round(currentImage.originalHeight * (p / 100)));
                            }
                          }}
                          className={`btn btn-sm ${percentage === p ? "btn-primary" : "btn-ghost"}`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-4">Presets</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: "HD", w: 1280, h: 720 }, { label: "Full HD", w: 1920, h: 1080 }, { label: "Instagram", w: 1080, h: 1080 }, { label: "4K", w: 3840, h: 2160 }].map((preset) => (
                    <button key={preset.label} onClick={() => applyPreset(preset.w, preset.h)} className="btn btn-outline btn-sm flex-col h-auto py-2">
                      <span className="text-xs font-bold text-base-content/50">{preset.label}</span>
                      <span className="text-sm font-bold">{preset.w} × {preset.h}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs uppercase tracking-wider">{t.crop.format}</span>
                </label>
                <select className="select select-bordered" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  <option>PNG</option>
                  <option>JPG</option>
                  <option>WEBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-base-200 bg-base-100/50 backdrop-blur-sm">
            <button
              onClick={handleDownload}
              disabled={isProcessing || images.length === 0}
              className="btn btn-primary w-full"
            >
              {isProcessing ? (
                <><RefreshCw className="size-5 animate-spin" /> {t.common.processing}</>
              ) : (
                <><Download className="size-5" /> {images.length > 1 ? `${t.crop.downloadAll} (${images.length})` : t.common.saveResult}</>
              )}
            </button>
            <p className="mt-4 text-center text-xs text-base-content/40 uppercase tracking-widest font-bold">
              {t.common.safetyPrivate}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
