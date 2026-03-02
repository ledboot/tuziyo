import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { requireUser } from "../lib/auth.server";
import { getMessagesForSession, type Message } from "../lib/db";
import {
  Image as ImageIcon,
  Loader2,
  Paperclip,
  ArrowUp,
  ChevronDown,
  Check,
  Sparkles,
  Monitor,
  Cpu,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const modelOptions = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash-image" },
  {
    label: "Gemini 3.1 Flash Preview",
    value: "gemini-3.1-flash-image-preview",
  },
  { label: "Gemini 3 Pro Preview", value: "gemini-3-pro-image-preview" },
];

const aspectRatioOptions = [
  { label: "1:1 Square", value: "1:1" },
  { label: "16:9 Landscape", value: "16:9" },
  { label: "9:16 Portrait", value: "9:16" },
  { label: "4:3 Standard", value: "4:3" },
  { label: "3:4 Vertical", value: "3:4" },
];

const resolutionOptions = [
  { label: "1K", value: "1K" },
  { label: "2K", value: "2K" },
  { label: "4K", value: "4K" },
];

function CustomDropdown({
  icon,
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {icon}
        {label}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {open && !disabled && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-xl rounded-xl overflow-hidden z-50 py-1 origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center justify-between transition-colors ${value === opt.value ? "text-primary-brand font-medium" : "text-gray-700 dark:text-gray-200"}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              type="button"
            >
              {opt.label}
              {value === opt.value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const sessionId = params.sessionId;

  if (!sessionId) {
    throw new Response("Session ID required", { status: 400 });
  }

  const db = context.cloudflare.env.DB;
  const messages = await getMessagesForSession(db, sessionId);

  return Response.json({ messages, sessionId });
}

export default function ChatSession() {
  const { messages, sessionId } = useLoaderData() as {
    messages: Message[];
    sessionId: string;
  };
  const fetcher = useFetcher();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash-image");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [enableSearch, setEnableSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<
    Array<{ dataUrl: string; file: File }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGenerating = fetcher.state !== "idle";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, fetcher.data]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages((prev) => [
            ...prev,
            { dataUrl: reader.result as string, file },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedImages.length === 0) return;

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("sessionId", sessionId);
    formData.append("model", model);
    formData.append("aspectRatio", aspectRatio);
    formData.append("resolution", resolution);
    formData.append("enableSearch", enableSearch.toString());

    if (selectedImages.length > 0) {
      const imagesData = selectedImages.map((img) => ({
        base64: img.dataUrl,
        mimeType: img.file.type,
      }));
      formData.append("images", JSON.stringify(imagesData));
    }

    fetcher.submit(formData, { method: "POST", action: "/api/chat" });

    setPrompt("");
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 w-full custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start a conversation to generate images!</p>
            </div>
          </div>
        ) : (
          messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary-brand text-white rounded-br-none"
                    : "bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-bl-none"
                }`}
              >
                {message.image_url && message.role === "user" && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(message.image_url.startsWith("[")
                      ? JSON.parse(message.image_url)
                      : [message.image_url]
                    ).map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`User attachment ${idx + 1}`}
                        className="max-w-50 h-auto rounded-lg object-contain bg-white/10"
                      />
                    ))}
                  </div>
                )}
                {message.content && (
                  <p
                    className={`whitespace-pre-wrap text-sm ${message.role === "assistant" ? "text-gray-800 dark:text-gray-200" : ""}`}
                  >
                    {message.content}
                  </p>
                )}
                {message.role === "user" && message.aspect_ratio && (
                  <div className="mt-2 text-xs opacity-70 flex gap-2">
                    <span>{message.aspect_ratio}</span>
                    <span>• {message.resolution}</span>
                    {message.enable_search === 1 && <span>• Web Search</span>}
                  </div>
                )}
                {message.image_url && message.role === "assistant" && (
                  <div className="mt-2 space-y-2">
                    {(message.image_url.startsWith("[")
                      ? JSON.parse(message.image_url)
                      : [message.image_url]
                    ).map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Generated ${idx + 1}`}
                        className="rounded-lg w-full object-cover shadow-sm bg-gray-100 dark:bg-zinc-900"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Optimistic UI taking generation time into account */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl p-6 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-bl-none flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary-brand animate-spin" />
              <span className="text-sm text-gray-500">
                Generating your image...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0 w-full mb-2">
        <div className="bg-white dark:bg-zinc-800/80 rounded-4xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-200/60 dark:border-zinc-700 flex flex-col relative transition-all focus-within:ring-2 focus-within:ring-primary-brand/30">
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-3 px-6 pt-5 pb-1">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative inline-block group">
                  <img
                    src={img.dataUrl}
                    alt={`Preview ${idx + 1}`}
                    className="h-20 w-auto max-w-xs object-contain rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm bg-gray-50 dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages((prev) =>
                        prev.filter((_, i) => i !== idx),
                      );
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-2 -right-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="relative flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Describe the image you want to generate..."
                className="w-full bg-transparent px-6 border-none outline-none resize-none max-h-40 min-h-20 text-[15px] pt-4 pb-2 text-gray-900 dark:text-white placeholder:text-gray-400 custom-scrollbar"
                rows={Math.min(4, Math.max(1, prompt.split("\n").length))}
                disabled={isGenerating}
              />
            </div>

            {/* Toolbar Area */}
            <div className="flex items-center justify-between px-3 pb-3 mt-1">
              {/* Left Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Mode Indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 ml-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[13px] font-semibold cursor-default">
                  <Sparkles className="w-3.5 h-3.5" />
                  Image Gen
                </div>

                <div className="w-px h-3.5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

                {/* Attach Reference Button */}
                <label
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-full transition-colors font-medium cursor-pointer ${isGenerating ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImagesChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isGenerating}
                  />
                  <Paperclip className="w-3.5 h-3.5" />
                  Reference
                </label>

                {/* Model Select */}
                <CustomDropdown
                  icon={<Cpu className="w-3.5 h-3.5" />}
                  label={
                    modelOptions.find((o) => o.value === model)?.label ||
                    "Model"
                  }
                  options={modelOptions}
                  value={model}
                  onChange={setModel}
                  disabled={isGenerating}
                />

                {/* Aspect Ratio */}
                <CustomDropdown
                  icon={<Monitor className="w-3.5 h-3.5" />}
                  label={
                    aspectRatioOptions.find((o) => o.value === aspectRatio)
                      ?.label || "Ratio"
                  }
                  options={aspectRatioOptions}
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  disabled={isGenerating}
                />

                {/* Resolution */}
                <CustomDropdown
                  icon={<ImageIcon className="w-3.5 h-3.5" />}
                  label={
                    resolutionOptions.find((o) => o.value === resolution)
                      ?.label || "Resolution"
                  }
                  options={resolutionOptions}
                  value={resolution}
                  onChange={setResolution}
                  disabled={isGenerating}
                />
              </div>

              {/* Right Send Button */}
              <button
                type="submit"
                disabled={
                  isGenerating ||
                  (!prompt.trim() && selectedImages.length === 0)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white w-9 h-9 rounded-full transition-colors shrink-0 flex items-center justify-center mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
