import { useState, useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import {
  ZoomOut,
  ZoomIn,
  Maximize,
  Crop,
  Plus,
  ChevronsUpDown,
  RefreshCw,
  Scaling,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Image as ImageIcon,
  Smartphone,
} from "lucide-react";
import type { Route } from "./+types/crop";
import { useI18n } from "~/lib/i18n";
import { SEOMeta } from "~/components/SeoMeta";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:3";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageItem {
  file: File;
  preview: string;
  cropArea?: CropArea;
}

const ASPECT_RATIOS: (
  t: any,
) => { label: string; value: AspectRatio; icon: any }[] = (t) => [
  { label: t.common.free, value: "free", icon: Scaling },
  { label: "1:1", value: "1:1", icon: Square },
  { label: "4:3", value: "4:3", icon: RectangleHorizontal },
  { label: "16:9", value: "16:9", icon: RectangleHorizontal },
  { label: "3:2", value: "3:2", icon: ImageIcon },
  { label: "2:3", value: "2:3", icon: Smartphone },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Precise Image Cropper | Crop Photos to Fixed Aspect Ratios" },
    {
      name: "description",
      content:
        "Crop images with pixel-perfect accuracy. Presets for 16:9, 4:3, and 1:1. High-quality lossless rendering in your browser.",
    },
    {
      name: "keywords",
      content:
        "crop image online free, photo cropper 4:3, pixel perfect crop tool, resize and crop image browser",
    },
    {
      property: "og:title",
      content: "Precise Image Cropper | Free Online Photo Tool",
    },
    {
      property: "og:description",
      content:
        "Crop images with pixel-perfect accuracy. High-quality lossless rendering.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tuziyo.com/crop" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "index, follow" },
  ];
}

export default function CropPage() {
  const { t } = useI18n();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(85);
  const [outputFormat, setOutputFormat] = useState("PNG");

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const currentImage = images[selectedIndex];

  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  const handleFileChange = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImages((prev) => [...prev, { file, preview: url }]);
  }, []);

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

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === "free") return;

    const ratioMap: Record<string, number> = {
      "1:1": 1,
      "4:3": 4 / 3,
      "16:9": 16 / 9,
      "3:2": 3 / 2,
      "2:3": 2 / 3,
    };
    const ratio = ratioMap[aspectRatio];

    setCropArea((prev) => {
      const newHeight = prev.width / ratio;
      return { ...prev, height: newHeight };
    });
  }, [aspectRatio]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const maxW = rect.width * 0.8;
    const maxH = rect.height * 0.8;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    setDisplayScale(scale);
    setImgDimensions({ width: imgW * scale, height: imgH * scale });

    const initialSize = Math.min(imgW, imgH) * 0.6 * scale;
    const ratioMap: Record<string, number> = {
      "1:1": 1,
      "4:3": 4 / 3,
      "16:9": 16 / 9,
      "3:2": 3 / 2,
      "2:3": 2 / 3,
      free: 1,
    };
    const ratio = ratioMap[aspectRatio];

    setCropArea({
      x: (imgW * scale - initialSize) / 2,
      y: (imgH * scale - initialSize / ratio) / 2,
      width: initialSize,
      height: initialSize / ratio,
    });
  }, [aspectRatio]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: "move" | string) => {
      e.stopPropagation();
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (type === "move") {
        setIsDragging(true);
      } else {
        setIsResizing(type);
      }
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setCropArea((prev) => {
        let { x, y, width, height } = { ...prev };

        if (isDragging) {
          x = Math.max(0, Math.min(x + deltaX, imgDimensions.width - width));
          y = Math.max(0, Math.min(y + deltaY, imgDimensions.height - height));
        } else if (isResizing) {
          const minSize = 20;
          const ratioMap: Record<string, number> = {
            "1:1": 1,
            "4:3": 4 / 3,
            "16:9": 16 / 9,
            "3:2": 3 / 2,
            "2:3": 2 / 3,
            free: 0,
          };
          const ratio = ratioMap[aspectRatio];

          if (isResizing.includes("e")) {
            width = Math.max(minSize, width + deltaX);
            if (ratio) height = width / ratio;
          }
          if (isResizing.includes("s")) {
            height = Math.max(minSize, height + deltaY);
            if (ratio) width = height * ratio;
          }
          if (isResizing.includes("w")) {
            const maxDeltaW = prev.x; // Can't move left more than current x
            const actualDeltaX = Math.min(deltaX, prev.width - minSize);
            const limitedDeltaX = Math.max(actualDeltaX, -maxDeltaW);

            x = prev.x + limitedDeltaX;
            width = prev.width - limitedDeltaX;
            if (ratio) {
              const newHeight = width / ratio;
              y = prev.y + (prev.height - newHeight) / 2; // Center vertically for 'w' handle if ratio
              height = newHeight;
            }
          }
          if (isResizing.includes("n")) {
            const maxDeltaN = prev.y;
            const actualDeltaY = Math.min(deltaY, prev.height - minSize);
            const limitedDeltaY = Math.max(actualDeltaY, -maxDeltaN);

            y = prev.y + limitedDeltaY;
            height = prev.height - limitedDeltaY;
            if (ratio) {
              const newWidth = height * ratio;
              x = prev.x + (prev.width - newWidth) / 2; // Center horizontally for 'n' handle if ratio
              width = newWidth;
            }
          }

          // Corner handles with ratio
          if (ratio && isResizing.length === 2) {
            if (isResizing === "se") {
              width = Math.min(width, imgDimensions.width - x);
              height = width / ratio;
              if (y + height > imgDimensions.height) {
                height = imgDimensions.height - y;
                width = height * ratio;
              }
            } else if (isResizing === "sw") {
              width = Math.min(width, x + prev.width);
              x = prev.x + (prev.width - width);
              height = width / ratio;
              if (y + height > imgDimensions.height) {
                height = imgDimensions.height - y;
                width = height * ratio;
                x = prev.x + (prev.width - width);
              }
            } else if (isResizing === "ne") {
              width = Math.min(width, imgDimensions.width - x);
              height = width / ratio;
              if (height > y + prev.height) {
                height = y + prev.height;
                width = height * ratio;
              }
              y = prev.y + (prev.height - height);
            } else if (isResizing === "nw") {
              width = Math.min(width, x + prev.width);
              height = width / ratio;
              if (height > y + prev.height) {
                height = y + prev.height;
                width = height * ratio;
              }
              x = prev.x + (prev.width - width);
              y = prev.y + (prev.height - height);
            }
          }

          // Final safety bounds check
          if (x < 0) {
            if (ratio)
              ((width += x * 2), (x = 0)); // Keep centered or just clamp? Let's just clamp for now
            else ((width += x), (x = 0));
          }
          if (y < 0) {
            if (ratio) ((height += y * 2), (y = 0));
            else ((height += y), (y = 0));
          }
          width = Math.min(width, imgDimensions.width - x);
          height = Math.min(height, imgDimensions.height - y);

          if (ratio) {
            if (width / height > ratio) width = height * ratio;
            else height = width / ratio;
          }
        }
        return { x, y, width, height };
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, isResizing, dragStart, imgDimensions, aspectRatio],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  const processImage = useCallback(
    async (item: ImageItem, area: CropArea): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          const scaleX = img.naturalWidth / imgDimensions.width;
          const scaleY = img.naturalHeight / imgDimensions.height;
          const actualCrop = {
            x: area.x * scaleX,
            y: area.y * scaleY,
            width: area.width * scaleX,
            height: area.height * scaleY,
          };
          canvas.width = actualCrop.width;
          canvas.height = actualCrop.height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(
            img,
            actualCrop.x,
            actualCrop.y,
            actualCrop.width,
            actualCrop.height,
            0,
            0,
            actualCrop.width,
            actualCrop.height,
          );
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject()),
            `image/${outputFormat.toLowerCase()}`,
            0.95,
          );
        };
        img.src = item.preview;
      });
    },
    [imgDimensions, outputFormat],
  );

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    if (images.length === 1) {
      const blob = await processImage(currentImage, cropArea);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tuziyo_cropped_${currentImage.file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const zip = new JSZip();
      for (let i = 0; i < images.length; i += 1) {
        const blob = await processImage(images[i], cropArea);
        zip.file(`tuziyo_cropped_${images[i].file.name}`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tuziyo-cropped-images.zip";
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsProcessing(false);
  }, [images, currentImage, processImage, cropArea]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-64px)] flex flex-col">
      <SEOMeta page="crop" />
      <main className="flex-1 flex overflow-hidden">
        {/* Workspace Area */}
        <section className="flex-1 relative flex flex-col bg-[#f1f5f9] dark:bg-slate-950 canvas-pattern overflow-hidden">
          {images.length > 0 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 z-10 shadow-sm">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(Math.max(10, zoom - 10))}
              >
                <ZoomOut className="size-5" />
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-14 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="size-5" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(100)}
              >
                <Maximize className="size-5" />
              </button>
            </div>
          )}

          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-12 relative overflow-auto custom-scrollbar touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {images.length === 0 ? (
              <div className="max-w-md w-full text-center">
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-xl">
                  <div className="size-20 bg-primary-brand/10 rounded-3xl flex items-center justify-center mb-6 mx-auto text-primary-brand">
                    <Crop className="size-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{t.crop.title}</h3>
                  <p className="text-slate-500 mb-8">{t.inpainting.dropzone}</p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary-brand text-white rounded-xl font-bold cursor-pointer hover:opacity-90 transition-all font-display uppercase tracking-widest text-xs"
                  >
                    {t.common.uploadImage}
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files && handleMultipleFiles(e.target.files)
                      }
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div
                className="relative transition-all duration-300"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <div className="relative shadow-2xl bg-white dark:bg-slate-800 rounded-lg overflow-hidden line-spacing-0">
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={currentImage?.preview}
                      alt=""
                      onLoad={handleImageLoad}
                      className="block select-none"
                      style={{
                        width: imgDimensions.width,
                        height: imgDimensions.height,
                      }}
                      draggable={false}
                    />

                    {/* Crop UI */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div
                        className="absolute border-2 border-primary-brand shadow-[0_0_0_2000px_rgba(0,0,0,0.5)] pointer-events-auto cursor-move group"
                        style={{
                          left: cropArea.x,
                          top: cropArea.y,
                          width: cropArea.width,
                          height: cropArea.height,
                        }}
                        onPointerDown={(e) => handlePointerDown(e, "move")}
                      >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 group-hover:opacity-100 transition-opacity">
                          <div className="border-r border-b border-white/50" />
                          <div className="border-r border-b border-white/50" />
                          <div className="border-b border-white/50" />
                          <div className="border-r border-b border-white/50" />
                          <div className="border-r border-b border-white/50" />
                          <div className="border-b border-white/50" />
                          <div className="border-r border-white/50" />
                          <div className="border-r border-white/50" />
                          <div />
                        </div>

                        {/* Resize Handles */}
                        <div
                          className="absolute -top-1.5 -left-1.5 size-3 bg-white border-2 border-primary-brand rounded-full cursor-nw-resize"
                          onPointerDown={(e) => handlePointerDown(e, "nw")}
                        />
                        <div
                          className="absolute -top-1.5 -right-1.5 size-3 bg-white border-2 border-primary-brand rounded-full cursor-ne-resize"
                          onPointerDown={(e) => handlePointerDown(e, "ne")}
                        />
                        <div
                          className="absolute -bottom-1.5 -left-1.5 size-3 bg-white border-2 border-primary-brand rounded-full cursor-sw-resize"
                          onPointerDown={(e) => handlePointerDown(e, "sw")}
                        />
                        <div
                          className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border-2 border-primary-brand rounded-full cursor-se-resize"
                          onPointerDown={(e) => handlePointerDown(e, "se")}
                        />

                        {/* Edge Handles */}
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-6 bg-white border border-primary-brand rounded-full cursor-n-resize opacity-0 group-hover:opacity-100"
                          onPointerDown={(e) => handlePointerDown(e, "n")}
                        />
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-1.5 w-6 bg-white border border-primary-brand rounded-full cursor-s-resize opacity-0 group-hover:opacity-100"
                          onPointerDown={(e) => handlePointerDown(e, "s")}
                        />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-6 bg-white border border-primary-brand rounded-full cursor-w-resize opacity-0 group-hover:opacity-100"
                          onPointerDown={(e) => handlePointerDown(e, "w")}
                        />
                        <div
                          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-6 bg-white border border-primary-brand rounded-full cursor-e-resize opacity-0 group-hover:opacity-100"
                          onPointerDown={(e) => handlePointerDown(e, "e")}
                        />

                        {/* Dimensions Label */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-brand text-white text-2xs font-bold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {Math.round(cropArea.width / displayScale)} ×{" "}
                          {Math.round(cropArea.height / displayScale)} PX
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Settings */}
        <aside className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-20 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-8 flex flex-col gap-10">
              <div>
                <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-6">
                  {t.crop.aspectRatio}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {ASPECT_RATIOS(t).map((ratio) => (
                    <button
                      type="button"
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`p-4 text-left border rounded-2xl transition-all group ${
                        aspectRatio === ratio.value
                          ? "border-primary-brand bg-primary-brand/5 ring-4 ring-primary-brand/10"
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                      }`}
                    >
                      <ratio.icon
                        className={`mb-2 block transition-colors size-6 ${aspectRatio === ratio.value ? "text-primary-brand" : "text-slate-400"}`}
                      />
                      <p
                        className={`text-sm font-bold ${aspectRatio === ratio.value ? "text-primary-brand" : "text-slate-700 dark:text-slate-200"}`}
                      >
                        {ratio.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">
                  {t.crop.format}
                </h3>
                <label htmlFor="output-format" className="relative block">
                  <span className="sr-only">Output Format</span>
                  <select
                    id="output-format"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand px-5 appearance-none text-slate-900 dark:text-white"
                  >
                    <option>PNG</option>
                    <option>JPG</option>
                    <option>WEBP</option>
                  </select>
                  <ChevronsUpDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 size-4" />
                </label>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isProcessing || images.length === 0}
              className="w-full py-5 bg-slate-900 dark:bg-primary-brand text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 dark:hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <span className={isProcessing ? "animate-spin" : ""}>
                {isProcessing ? (
                  <RefreshCw className="size-5" />
                ) : (
                  <Crop className="size-5" />
                )}
              </span>
              {isProcessing && t.common.processing}
              {!isProcessing &&
                images.length > 1 &&
                `${t.crop.downloadAll} (${images.length})`}
              {!isProcessing && images.length <= 1 && t.common.saveResult}
            </button>
            <p className="mt-4 text-2xs text-center text-slate-400 uppercase tracking-widest font-bold">
              {t.common.safetyPrivate}
            </p>
          </div>
        </aside>
      </main>

      {/* Thumbnail strip for multiple files */}
      {images.length > 1 && (
        <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-8 gap-4 overflow-x-auto custom-scrollbar">
          {images.map((img, idx) => (
            <button
              type="button"
              key={img.preview}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Select image ${idx + 1}`}
              className={`shrink-0 size-14 rounded-xl overflow-hidden border-2 transition-all ${
                selectedIndex === idx
                  ? "border-primary-brand scale-110 shadow-lg"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img
                src={img.preview}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          <label
            htmlFor="file-append"
            className="shrink-0 size-14 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all"
          >
            <Plus className="size-6 text-slate-400" />
            <input
              id="file-append"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleMultipleFiles(e.target.files)
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
