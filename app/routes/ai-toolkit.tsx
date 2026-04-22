import { useState, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Upload,
  X,
  Square,
  Maximize,
  Smartphone,
  RectangleHorizontal,
} from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { CustomSelect, type SelectOption } from "~/components/CustomSelect";

type Model = "gpt-image-1.5" | "wan-2.6-image" | "seedream-5" | "nano-banana-2";

const MODELS: { id: Model; label: string; supportsImage?: boolean }[] = [
  { id: "gpt-image-1.5", label: "GPT Image 1.5" },
  { id: "wan-2.6-image", label: "WAN 2.6 Image" },
  { id: "seedream-5", label: "Seedream 5", supportsImage: true },
  { id: "nano-banana-2", label: "Nano Banana 2", supportsImage: true },
];

const MODEL_OPTIONS: SelectOption[] = MODELS.map((m) => ({
  value: m.id,
  label: m.label,
}));

const QUALITY_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const SIZE_OPTIONS_GPT = [
  { value: "1024x1024", label: "1024 × 1024" },
  { value: "1792x1024", label: "1792 × 1024" },
  { value: "1024x1792", label: "1024 × 1792" },
  { value: "512x512", label: "512 × 512" },
  { value: "256x256", label: "256 × 256" },
];

const STYLE_OPTIONS = [
  { value: "vivid", label: "Vivid" },
  { value: "natural", label: "Natural" },
];

const SIZE_OPTIONS_WAN = [
  { value: "1024x1024", label: "1024 × 1024" },
  { value: "1792x1024", label: "1792 × 1024" },
  { value: "1024x1792", label: "1024 × 1792" },
  { value: "512x512", label: "512 × 512" },
  { value: "256x256", label: "256 × 256" },
  { value: "custom", label: "Custom" },
];

const SIZE_OPTIONS_SEEDREAM = [
  { value: "512x512", label: "512 × 512" },
  { value: "1024x1024", label: "1024 × 1024" },
  { value: "768x768", label: "768 × 768" },
  { value: "custom", label: "Custom" },
];

const ASPECT_RATIO_OPTIONS: SelectOption[] = [
  { value: "1:1", label: "1:1", icon: <Square className="size-4" /> },
  {
    value: "4:3",
    label: "4:3",
    icon: <RectangleHorizontal className="size-4" />,
  },
  { value: "3:4", label: "3:4", icon: <Smartphone className="size-4" /> },
  { value: "16:9", label: "16:9", icon: <Maximize className="size-4" /> },
  { value: "9:16", label: "9:16", icon: <Maximize className="size-4" /> },
];

const RESOLUTION_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

const OUTPUT_FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
];

const MAX_IMAGES_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
];

const SEQUENTIAL_OPTIONS = [
  { value: "disabled", label: "Off" },
  { value: "auto", label: "Auto" },
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
];

export default function AIToolkitPage() {
  const { t } = useI18n();
  const [selectedModel, setSelectedModel] = useState<Model>("nano-banana-2");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState("auto");
  const [sizeGpt, setSizeGpt] = useState("1024x1024");
  const [style, setStyle] = useState("vivid");
  const [sizeWan, setSizeWan] = useState("1024x1024");
  const [sizeSeedream, setSizeSeedream] = useState("1024x1024");
  const [resolution, setResolution] = useState("2K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [maxImages, setMaxImages] = useState("1");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images] = useState<string[]>(SAMPLE_IMAGES);
  const [uploadedImages, setUploadedImages] = useState<
    { id: string; url: string }[]
  >([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModelInfo = MODELS.find((m) => m.id === selectedModel);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    const isLoggedIn = false;
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt("");
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setUploadedImages((prev) => [...prev, { id: crypto.randomUUID(), url }]);
    });
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="bg-base-100 pb-48">
      <style>{`
        .masonry-grid {
          column-count: 2;
          column-gap: 1rem;
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 4;
          }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1rem;
        }
      `}</style>

      <main className="p-4">
        <div className="masonry-grid">
          {images.map((src, i) => (
            <div
              key={i}
              className="masonry-item break-inside-avoid group relative overflow-hidden rounded-2xl"
            >
              <img
                src={src}
                alt={`Generated ${i + 1}`}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-base-100 via-base-100 to-transparent pt-12">
        <div className="max-w-3xl mx-auto">
          <div className="card bg-base-100 shadow-2xl border border-base-200">
            <div className="card-body p-4">
              {selectedModelInfo?.supportsImage && (
                <div className="mt-4">
                  <label className="label">
                    <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">
                      Image Input
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt="Uploaded"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline btn-square w-20 h-20"
                    >
                      <Upload className="size-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    t.aiToolkit?.promptPlaceholder || "Describe your image..."
                  }
                  className="textarea textarea-bordered w-full text-base resize-none"
                  rows={2}
                />
              </div>

              <div className="flex flex-row gap-2">
                <CustomSelect
                  label="Model"
                  options={MODEL_OPTIONS}
                  value={selectedModel}
                  onChange={(v) => setSelectedModel(v as Model)}
                  className="min-w-28"
                />
                {selectedModel === "gpt-image-1.5" && (
                  <>
                    <CustomSelect
                      label="Quality"
                      options={QUALITY_OPTIONS.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={quality}
                      onChange={setQuality}
                      className="min-w-8"
                    />
                    <CustomSelect
                      label="Size"
                      options={SIZE_OPTIONS_GPT.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={sizeGpt}
                      onChange={setSizeGpt}
                      className="min-w-8"
                    />
                    <CustomSelect
                      label="Style"
                      options={STYLE_OPTIONS.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={style}
                      onChange={setStyle}
                      className="min-w-8"
                    />
                  </>
                )}

                {selectedModel === "wan-2.6-image" && (
                  <>
                    <CustomSelect
                      label="Size"
                      options={SIZE_OPTIONS_WAN.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={sizeWan}
                      onChange={setSizeWan}
                      className="min-w-8"
                    />
                    <div className="flex-1 min-w-8">
                      <label className="label">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">
                          Negative Prompt
                        </span>
                      </label>
                      <textarea
                        placeholder="What to avoid..."
                        className="textarea textarea-bordered textarea-sm w-full resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedModel === "seedream-5" && (
                  <>
                    <CustomSelect
                      label="Size"
                      options={SIZE_OPTIONS_SEEDREAM.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={sizeSeedream}
                      onChange={setSizeSeedream}
                      className="flex-1 min-w-32"
                    />
                    <div className="flex-1 min-w-32">
                      <label className="label">
                        <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">
                          Negative Prompt
                        </span>
                      </label>
                      <textarea
                        placeholder="What to avoid..."
                        className="textarea textarea-bordered textarea-sm w-full resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {selectedModel === "nano-banana-2" && (
                  <>
                    <CustomSelect
                      label="Aspect Ratio"
                      options={ASPECT_RATIO_OPTIONS}
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      className="flex-1 min-w-24"
                    />
                    <CustomSelect
                      label="Resolution"
                      options={RESOLUTION_OPTIONS.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={resolution}
                      onChange={setResolution}
                      className="flex-1 min-w-24"
                    />
                    <CustomSelect
                      label="Output Format"
                      options={OUTPUT_FORMAT_OPTIONS.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={outputFormat}
                      onChange={setOutputFormat}
                      className="flex-1 min-w-24"
                    />
                    <CustomSelect
                      label="Max Images"
                      options={MAX_IMAGES_OPTIONS.map((o) => ({
                        ...o,
                        icon: undefined,
                      }))}
                      value={maxImages}
                      onChange={setMaxImages}
                      className="flex-1 min-w-24"
                    />
                  </>
                )}

                <div className="ml-auto">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        {t.aiToolkit?.generating || "Generating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
