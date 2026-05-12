import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, ImagePlus, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "~/lib/i18n"
import { CustomSelect, type SelectOption } from "~/components/CustomSelect"
import { ModelOptions, type OptionGroup } from "~/components/ModelOptions"
import { useUserStore } from "~/stores/userStore"
import { useModelStore, type Model, type ModelOptionsConfig } from "~/stores/modelStore"
import { api, getApiErrorMessage, MODEL_CREDITS } from "~/lib/api"

interface PromptAreaProps {
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
  modelOptions: Record<string, string>
  onOptionsChange: (options: Record<string, string>) => void
  currentSessionId?: string | null
  onGenerateSuccess?: () => void
  className?: string
}

const EMPTY_MODEL_OPTIONS_CONFIG: ModelOptionsConfig = {}

const OPTION_LABELS: Record<string, string> = {
  auto: "Auto",
  low: "Low",
  medium: "Medium",
  high: "High",
  vivid: "Vivid",
  natural: "Natural",
  png: "PNG",
  jpeg: "JPEG",
  webp: "WEBP",
}

function formatOptionLabel(value: string) {
  return OPTION_LABELS[value] ?? value.replace(/x/g, "×")
}

function areOptionsEqual(a: Record<string, string>, b: Record<string, string>) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  return aKeys.length === bKeys.length && aKeys.every(key => a[key] === b[key])
}

function buildOptionGroups(
  config: ModelOptionsConfig,
  options: Record<string, string>,
  onChange: (options: Record<string, string>) => void
): OptionGroup[] {
  return Object.entries(config).flatMap(([key, option]) => {
    if (option.type === "textarea" || option.values.length === 0) return []

    const value = options[key] ?? option.defaultValue ?? option.values[0] ?? ""

    return [
      {
        id: key,
        label: option.name,
        options: option.values.map(optionValue => ({
          value: optionValue,
          label: formatOptionLabel(optionValue),
        })),
        value,
        type: option.type,
        onChange: (nextValue: string) => onChange({ ...options, [key]: nextValue }),
      },
    ]
  })
}

export default function PromptArea({
  models,
  selectedModel,
  onModelChange,
  modelOptions,
  onOptionsChange,
  currentSessionId,
  onGenerateSuccess,
  className = "",
}: PromptAreaProps) {
  const { t } = useI18n()
  const { user, token } = useUserStore()

  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string }[]>([])
  const [hoveredImage, setHoveredImage] = useState<{ url: string; rect: DOMRect } | null>(null)

  // Resize: use CSS variables — no React state, no re-renders during drag
  const shellRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modelOptionConfig = useModelStore(
    state => state.modelOptionsConfig[selectedModel] ?? EMPTY_MODEL_OPTIONS_CONFIG
  )
  const isModelsLoading = useModelStore(state => state.isLoading)
  const normalizeModelOptions = useModelStore(state => state.normalizeModelOptions)
  const isModelDataPending = isModelsLoading || models.length === 0

  const selectedModelInfo = models.find(m => m.id === selectedModel)
  const requiredCredits = MODEL_CREDITS[selectedModel] || 0
  const hasInsufficientCredits = Boolean(user && (user.credits || 0) < requiredCredits)
  const normalizedModelOptions = normalizeModelOptions(selectedModel, modelOptions)
  const optionGroups = buildOptionGroups(modelOptionConfig, normalizedModelOptions, onOptionsChange)
  const negativePromptConfig = modelOptionConfig.negative_prompt
  const supportsNegativePrompt = negativePromptConfig?.type === "textarea"
  const modelSelectOptions: SelectOption[] = models.map(model => ({
    value: model.id,
    label: model.name,
    icon: <img src={model.icon} alt={model.provider} className="size-5 rounded invert" />,
    badge: model.isNew ? (
      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-content rounded-full flex items-center gap-0.5">
        <Sparkles className="size-2.5" />
        NEW
      </span>
    ) : undefined,
  }))

  useEffect(() => {
    if (models.length === 0 || selectedModelInfo) return
    onModelChange(models[0].id)
  }, [models, onModelChange, selectedModelInfo])

  useEffect(() => {
    const normalizedOptions = normalizeModelOptions(selectedModel, modelOptions)
    if (!areOptionsEqual(normalizedOptions, modelOptions)) {
      onOptionsChange(normalizedOptions)
    }
  }, [modelOptionConfig, modelOptions, normalizeModelOptions, onOptionsChange, selectedModel])

  useEffect(() => {
    if (supportsNegativePrompt) return
    setShowNegativePrompt(false)
    setNegativePrompt("")
  }, [supportsNegativePrompt])

  // Auto-resize textarea: set min-height to grow the panel; overflow-y:auto handles the rest
  const resizeTextarea = () => {
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      // Reset to measure true scrollHeight
      el.style.minHeight = "auto"
      el.style.minHeight = `${el.scrollHeight}px`
    })
  }

  useEffect(() => {
    resizeTextarea()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

  // Re-run textarea resize when panel width changes (drag resize reflows text)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const ro = new ResizeObserver(() => resizeTextarea())
    ro.observe(panel)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      setUploadedImages(prev => [...prev, { id: crypto.randomUUID(), url }])
    })
  }

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (uploadedImages.length > 0 && !selectedModelInfo?.supportsImage) {
      toast.error(
        `This model does not support image input. Remove uploaded images or select a different model.`
      )
      return
    }

    setIsGenerating(true)
    try {
      let sessionId = currentSessionId

      if (!sessionId && token) {
        const title = prompt.slice(0, 20).trim() || "New Chat"
        const sessionData = await api.sessions.create(title)
        if (sessionData.session) {
          sessionId = sessionData.session.id
        }
      }

      const requestBody: Record<string, unknown> = {
        prompt,
        model: selectedModel,
        provider: selectedModelInfo?.provider,
        sessionId,
        ...normalizedModelOptions,
      }

      if (supportsNegativePrompt && negativePrompt) requestBody.negative_prompt = negativePrompt

      const data = await api.generate.create(
        requestBody as Parameters<typeof api.generate.create>[0]
      )
      if (data.error) {
        toast.error(`ERROR: ${data.error}`)
        return
      }

      setPrompt("")
      setShowNegativePrompt(false)
      onGenerateSuccess?.()
    } catch (error) {
      console.error("Generate error:", error)
      toast.error(
        `ERROR: ${getApiErrorMessage(error, "Failed to generate image. Please try again.")}`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  type ResizeDir = "left" | "right" | "top" | "top-left" | "top-right"

  const startResize = (e: React.MouseEvent, dir: ResizeDir) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const el = panelRef.current
    if (!el) return
    const startW = shellRef.current?.offsetWidth ?? el.offsetWidth
    const startH = el.offsetHeight

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const shell = shellRef.current
      const panel = panelRef.current

      // Width: panel is centered so expand symmetrically
      if (dir === "left" || dir === "top-left") {
        const newW = startW - dx * 2
        shell?.style.setProperty("--prompt-w", `${newW}px`)
      }
      if (dir === "right" || dir === "top-right") {
        const newW = startW + dx * 2
        shell?.style.setProperty("--prompt-w", `${newW}px`)
      }

      // Height: panel anchored at bottom, drag up to grow
      if (dir === "top" || dir === "top-left" || dir === "top-right") {
        const newH = startH - dy
        panel?.style.setProperty("--prompt-h", `${newH}px`)
      }
    }

    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor =
      dir === "left" || dir === "right"
        ? "ew-resize"
        : dir === "top"
          ? "ns-resize"
          : dir === "top-left"
            ? "nwse-resize"
            : "nesw-resize"

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // ── Skeleton placeholder while data loads ──
  if (isModelDataPending) {
    return (
      <div className={`prompt-area-shell mx-auto ${className}`}>
        <div className="liquid-prompt-panel">
          <div className="liquid-prompt-panel__content">
            <div className="liquid-prompt-editor">
              <div className="liquid-prompt-upload-row">
                <div className="skeleton liquid-icon-button opacity-30" aria-hidden="true" />
              </div>

              {/* Textarea skeleton */}
              <div className="liquid-prompt-input flex-1 pt-2 mt-2 px-1">
                <div className="skeleton h-20 w-full rounded-xl opacity-25" />
              </div>
            </div>

            {/* Controls row skeleton */}
            <div className="liquid-prompt-controls flex items-center gap-2 overflow-visible pt-2">
              <div className="skeleton h-9 w-32 rounded-lg opacity-30 flex-shrink-0" />
              <div className="skeleton h-9 w-28 rounded-lg opacity-25 flex-shrink-0" />
              <div className="flex-1" />
              <div className="skeleton h-9 w-24 rounded-lg opacity-30 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={shellRef} className={`prompt-area-shell mx-auto ${className}`}>
      <div
        id="prompt-area"
        ref={panelRef}
        className="liquid-prompt-panel relative overflow-visible"
      >
        {/* ── Resize handles ── */}
        {/* Top edge */}
        <div
          onMouseDown={e => startResize(e, "top")}
          className="prompt-resize-handle prompt-resize-top"
          title="Drag to resize"
        />
        {/* Left edge */}
        <div
          onMouseDown={e => startResize(e, "left")}
          className="prompt-resize-handle prompt-resize-left"
          title="Drag to resize"
        />
        {/* Right edge */}
        <div
          onMouseDown={e => startResize(e, "right")}
          className="prompt-resize-handle prompt-resize-right"
          title="Drag to resize"
        />
        {/* Top-left corner */}
        <div
          onMouseDown={e => startResize(e, "top-left")}
          className="prompt-resize-handle prompt-resize-corner-tl"
          title="Drag to resize"
        />
        {/* Top-right corner */}
        <div
          onMouseDown={e => startResize(e, "top-right")}
          className="prompt-resize-handle prompt-resize-corner-tr"
          title="Drag to resize"
        />
        <div className="liquid-prompt-panel__content relative z-10 overflow-visible">
          <div className="liquid-prompt-editor">
            {selectedModelInfo?.supportsImage && (
              <div className="liquid-prompt-upload-row">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-ghost btn-square liquid-icon-button"
                  aria-label="Add reference image"
                >
                  <ImagePlus className="size-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {uploadedImages.map(img => (
                  <div
                    key={img.id}
                    className="relative group"
                    onMouseEnter={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setHoveredImage({ url: img.url, rect })
                    }}
                    onMouseLeave={() => setHoveredImage(null)}
                  >
                    <img
                      src={img.url}
                      alt="Preview"
                      className="liquid-upload-preview object-cover"
                    />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="btn btn-circle liquid-upload-remove absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove reference image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hover preview portal */}
            {hoveredImage &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  className="pointer-events-none"
                  style={{
                    position: "fixed",
                    left: hoveredImage.rect.left + hoveredImage.rect.width / 2,
                    bottom: window.innerHeight - hoveredImage.rect.top + 10,
                    transform: "translateX(-50%)",
                    zIndex: 9999,
                  }}
                >
                  <div
                    className="rounded-lg p-1 shadow-xl"
                    style={{
                      background: "rgba(10, 12, 20, 0.92)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <img
                      src={hoveredImage.url}
                      alt="Preview"
                      className="rounded-lg object-cover block"
                      style={{ width: 180, height: 180 }}
                    />
                  </div>
                </div>,
                document.body
              )}

            <div className="liquid-prompt-input">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.aiToolkit?.promptPlaceholder || "Describe your image..."}
                className="textarea textarea-ghost py-3 px-2 liquid-prompt-textarea w-full text-base focus:outline-none"
              />
            </div>
          </div>

          {showNegativePrompt && (
            <div className="mt-2">
              <textarea
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..."
                className="textarea textarea-ghost textarea-sm liquid-prompt-textarea w-full resize-none focus:outline-none"
                rows={2}
              />
            </div>
          )}

          <div className="liquid-prompt-controls flex items-center gap-2 overflow-visible">
            <CustomSelect
              label="Models"
              options={modelSelectOptions}
              value={selectedModel}
              onChange={onModelChange}
              className="liquid-model-select min-w-10"
            />

            {optionGroups.length > 0 && <ModelOptions groups={optionGroups} />}

            {supportsNegativePrompt && (
              <button
                type="button"
                onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                className="btn btn-ghost liquid-secondary-button items-center whitespace-nowrap"
              >
                {negativePromptConfig?.name ?? "Negative Prompt"}
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || hasInsufficientCredits}
              className={`btn liquid-generate-button ${
                hasInsufficientCredits ? "btn-disabled" : "btn-primary"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t.aiToolkit?.generating || "Generating..."}
                </>
              ) : hasInsufficientCredits ? (
                <>Credit insufficient</>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
