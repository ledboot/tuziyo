import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, ImagePlus, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "~/lib/i18n"
import { CustomSelect, type SelectOption } from "~/components/CustomSelect"
import { ModelOptions, type OptionGroup } from "~/components/ModelOptions"
import { useUserStore } from "~/stores/userStore"
import { useModelStore, type Model, type ModelOptionsConfig } from "~/stores/modelStore"
import { api, getApiErrorMessage } from "~/lib/api"

interface PromptAreaProps {
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
  modelOptions: Record<string, string>
  onOptionsChange: (options: Record<string, string>) => void
  currentSessionId?: string | null
  onGenerateStart?: (sessionId: string, prompt: string, data?: any) => void
  onGenerateSuccess?: (sessionId: string, data: any) => void
  onGeneratePending?: (sessionId: string, taskId: string, prompt: string) => void
  initialPrompt?: string
  initialNegativePrompt?: string
  initialPromptVersion?: number
  initialImages?: UploadedImage[]
  initialImagesVersion?: number
  autoGenerate?: boolean
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

const REFERENCE_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp"
const REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const DEFAULT_PROMPT_MAX_LENGTH = 80000
const PROMPT_MIN_WIDTH = 800

const getPromptMaxWidth = () => {
  if (typeof window === "undefined") return 1100
  const w = window.innerWidth
  if (w >= 3840) return 2000
  if (w >= 2560) return 1650
  if (w >= 1920) return 1450
  if (w >= 1440) return 1250
  return 1100
}

type UploadedImageStatus = "uploading" | "uploaded" | "error"

export interface UploadedImage {
  id: string
  previewUrl: string
  key?: string
  url?: string
  contentType?: string
  size?: number
  status: UploadedImageStatus
  error?: string
}

function formatOptionLabel(value: string) {
  return OPTION_LABELS[value] ?? value.replace(/x/g, "×")
}

function areOptionsEqual(a: Record<string, string>, b: Record<string, string>) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  return aKeys.length === bKeys.length && aKeys.every(key => a[key] === b[key])
}

function getPromptCharacterCount(value: string) {
  return Array.from(value).length
}

function clampPrompt(value: string, maxLength: number) {
  const characters = Array.from(value)
  return characters.length > maxLength ? characters.slice(0, maxLength).join("") : value
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

function calculateRequiredCredits(
  model: Model | undefined,
  normalizedOptions: Record<string, string>,
  referenceImageCount: number
): number {
  if (!model) return 0
  const baseCredits = model.credits || 0
  let singleImageCredits = baseCredits

  if (model.options) {
    for (const [key, option] of Object.entries(model.options)) {
      const selectedValue = normalizedOptions[key]
      if (selectedValue && option.valueCredits) {
        const premium = option.valueCredits[selectedValue]
        if (typeof premium === "number") {
          singleImageCredits += premium
        }
      }
    }
  }

  const numImages = Math.max(1, Number(normalizedOptions["num_images"]) || 1)
  let totalCredits = singleImageCredits * numImages

  totalCredits += referenceImageCount * 5

  return totalCredits
}

export default function PromptArea({
  models,
  selectedModel,
  onModelChange,
  modelOptions,
  onOptionsChange,
  currentSessionId,
  onGenerateStart,
  onGenerateSuccess,
  onGeneratePending,
  initialPrompt = "",
  initialNegativePrompt,
  initialPromptVersion,
  initialImages = [],
  initialImagesVersion,
  autoGenerate = false,
  className = "",
}: PromptAreaProps) {
  const { t } = useI18n()
  const { user, token } = useUserStore()

  const userPrompt = useModelStore(state => state.userPrompt)
  const setUserPrompt = useModelStore(state => state.setUserPrompt)

  const [prompt, setPrompt] = useState(initialPrompt || userPrompt || "")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages)
  const [hoveredImage, setHoveredImage] = useState<{ url: string; rect: DOMRect } | null>(null)

  // Resize: use CSS variables — no React state, no re-renders during drag
  const shellRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadedImagesRef = useRef<UploadedImage[]>([])

  const modelOptionConfig = useModelStore(
    state => state.modelOptionsConfig[selectedModel] ?? EMPTY_MODEL_OPTIONS_CONFIG
  )
  const isModelsLoading = useModelStore(state => state.isLoading)
  const modelError = useModelStore(state => state.error)
  const normalizeModelOptions = useModelStore(state => state.normalizeModelOptions)

  const [hasStartedLoading, setHasStartedLoading] = useState(false)

  useEffect(() => {
    if (isModelsLoading) {
      setHasStartedLoading(true)
    }
  }, [isModelsLoading])

  const shouldHide =
    !isModelsLoading && (modelError !== null || (hasStartedLoading && models.length === 0))

  if (shouldHide) {
    return null
  }

  const isModelDataPending = isModelsLoading || models.length === 0

  const selectedModelInfo = models.find(m => m.id === selectedModel)
  const promptMaxLength = selectedModelInfo?.promptMaxLength ?? DEFAULT_PROMPT_MAX_LENGTH
  const normalizedModelOptions = normalizeModelOptions(selectedModel, modelOptions)
  const requiredCredits = calculateRequiredCredits(
    selectedModelInfo,
    normalizedModelOptions,
    uploadedImages.length
  )
  const availableCredits = user?.credits ?? 0
  const hasInsufficientCredits = Boolean(user && availableCredits < requiredCredits)
  const creditEstimateText =
    requiredCredits > 0
      ? `Cost ≈ ${requiredCredits.toLocaleString("en-US")} credits`
      : "Cost ≈ 0 credits"
  const optionGroups = buildOptionGroups(modelOptionConfig, normalizedModelOptions, onOptionsChange)
  const negativePromptConfig = modelOptionConfig.negative_prompt
  const supportsNegativePrompt = negativePromptConfig?.type === "textarea"
  const promptCharacterCount = getPromptCharacterCount(prompt)
  const promptCharacterLimitText = promptMaxLength.toLocaleString("en-US")
  const isPromptOverCharacterLimit = promptCharacterCount > promptMaxLength
  const isPromptAtCharacterLimit = promptCharacterCount >= promptMaxLength
  const isUploadingImages = uploadedImages.some(image => image.status === "uploading")
  const hasFailedUploads = uploadedImages.some(image => image.status === "error")
  const modelSelectOptions: SelectOption[] = models.map(model => {
    return {
      value: model.id,
      label: model.name,
      icon: <img src={model.icon} alt={model.provider} className="size-5 rounded invert" />,
      badge: model.isNew ? (
        <span className="ml-2 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-primary text-white rounded-full flex items-center gap-1 shadow-[0_0_12px_rgba(139,92,246,0.5)] border border-primary/30">
          <Sparkles className="size-2.5 text-white" />
          NEW
        </span>
      ) : undefined,
    }
  })

  useEffect(() => {
    if (models.length === 0) return

    // If currently selected model is valid, do nothing
    if (selectedModelInfo) {
      return
    }

    // Otherwise, select the first model
    const firstModel = models[0]
    if (firstModel) {
      onModelChange(firstModel.id)
    }
  }, [models, selectedModelInfo, onModelChange])

  useEffect(() => {
    if (!initialPrompt && !initialPromptVersion) return
    setPrompt(initialPrompt)
    setUserPrompt(initialPrompt)
  }, [initialPrompt, initialPromptVersion, setUserPrompt])

  useEffect(() => {
    if (initialNegativePrompt === undefined) return
    setNegativePrompt(initialNegativePrompt)
    setShowNegativePrompt(Boolean(initialNegativePrompt))
  }, [initialNegativePrompt, initialPromptVersion])

  useEffect(() => {
    if (!initialImagesVersion) return
    setUploadedImages(prev => {
      const nextImages = [...prev]
      for (const image of initialImages) {
        const existingIndex = nextImages.findIndex(existing => {
          if (image.key && existing.key) return existing.key === image.key
          return existing.id === image.id
        })
        if (existingIndex >= 0) {
          nextImages[existingIndex] = image
        } else {
          nextImages.push(image)
        }
      }
      return nextImages
    })
    setHoveredImage(null)
  }, [initialImages, initialImagesVersion])

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

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages
  }, [uploadedImages])

  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const uploadReferenceImage = async (file: File) => {
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setUploadedImages(prev => [
      ...prev,
      {
        id,
        previewUrl,
        contentType: file.type,
        size: file.size,
        status: "uploading",
      },
    ])

    try {
      const uploadedImage = await api.uploads.referenceImage(file, selectedModel)
      setUploadedImages(prev =>
        prev.map(image =>
          image.id === id
            ? {
                ...image,
                key: uploadedImage.key,
                url: uploadedImage.url,
                contentType: uploadedImage.contentType,
                size: uploadedImage.size,
                status: "uploaded",
              }
            : image
        )
      )
    } catch (error) {
      console.error("Reference image upload error:", error)
      setUploadedImages(prev =>
        prev.map(image =>
          image.id === id
            ? {
                ...image,
                status: "error",
                error: getApiErrorMessage(error, "Failed to upload reference image"),
              }
            : image
        )
      )
      toast.error(getApiErrorMessage(error, "Failed to upload reference image"))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      e.target.value = ""
      return
    }

    const maxCount = selectedModelInfo?.referenceImageCount ?? Infinity
    const remaining = maxCount - uploadedImages.length
    if (remaining <= 0) {
      toast.error(
        `This model supports at most ${maxCount} reference image${maxCount === 1 ? "" : "s"}.`
      )
      e.target.value = ""
      return
    }
    const toAdd = Array.from(files).slice(0, remaining)
    if (toAdd.length < files.length) {
      toast.warning(
        `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (limit: ${maxCount}).`
      )
    }

    toAdd.forEach(file => {
      if (!REFERENCE_IMAGE_ACCEPT.split(",").includes(file.type)) {
        toast.error("Reference image must be PNG, JPEG, or WEBP.")
        return
      }

      if (file.size > REFERENCE_IMAGE_MAX_BYTES) {
        toast.error("Reference image must be smaller than 10MB.")
        return
      }

      void uploadReferenceImage(file)
    })
    e.target.value = ""
  }

  const removeImage = (id: string) => {
    const image = uploadedImages.find(img => img.id === id)
    if (image) URL.revokeObjectURL(image.previewUrl)
    setHoveredImage(null)
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextPrompt = e.target.value
    const clampedPrompt = clampPrompt(nextPrompt, promptMaxLength)
    setPrompt(clampedPrompt)
    setUserPrompt(clampedPrompt)
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (isPromptOverCharacterLimit) {
      toast.error(`Prompt must not exceed ${promptCharacterLimitText} characters for this model.`)
      return
    }

    if (uploadedImages.length > 0 && !selectedModelInfo?.supportsImage) {
      toast.error(
        `This model does not support image input. Remove uploaded images or select a different model.`
      )
      return
    }

    if (uploadedImages.length > (selectedModelInfo?.referenceImageCount ?? Infinity)) {
      toast.error(
        `This model supports at most ${selectedModelInfo?.referenceImageCount} reference images.`
      )
      return
    }

    if (isUploadingImages) {
      toast.error("Please wait for reference images to finish uploading.")
      return
    }

    if (hasFailedUploads) {
      toast.error("Remove failed reference images before generating.")
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

      const referenceImages = uploadedImages
        .filter(image => image.status === "uploaded" && image.key)
        .map(image => image.key as string)

      if (referenceImages.length > 0) {
        requestBody.reference_images = referenceImages
      }

      if (sessionId) {
        onGenerateStart?.(sessionId, prompt)
      }

      const data = await api.generate.create(
        requestBody as Parameters<typeof api.generate.create>[0]
      )
      if (data.error) {
        toast.error(`ERROR: ${data.error}`)
        return
      }

      const returnedTaskId = data.taskId
      const returnedSessionId = data.sessionId || sessionId

      setPrompt("")
      setUserPrompt("")
      setShowNegativePrompt(false)
      uploadedImages.forEach(image => URL.revokeObjectURL(image.previewUrl))
      setUploadedImages([])
      setHoveredImage(null)

      if (onGeneratePending && returnedTaskId) {
        onGeneratePending(returnedSessionId!, returnedTaskId, prompt)
      } else {
        onGenerateSuccess?.(returnedSessionId!, data)
      }
    } catch (error) {
      console.error("Generate error:", error)
      toast.error(
        `ERROR: ${getApiErrorMessage(error, "Failed to generate image. Please try again.")}`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const hasAutoGenerated = useRef(false)
  useEffect(() => {
    if (autoGenerate && prompt && !isGenerating && !hasAutoGenerated.current) {
      hasAutoGenerated.current = true
      handleGenerate()
    }
  }, [autoGenerate])

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
    const panel = panelRef.current
    const shell = shellRef.current
    if (!panel) return
    const startW = shell?.offsetWidth ?? panel.offsetWidth
    const startH = panel.offsetHeight
    const clampPromptWidth = (width: number) => {
      const maxWidth = Math.min(window.innerWidth * 0.9, getPromptMaxWidth())
      const minWidth = Math.min(PROMPT_MIN_WIDTH, maxWidth)
      return Math.min(maxWidth, Math.max(minWidth, width))
    }
    let frameId: number | null = null
    let pendingWidth: number | null = null
    let pendingHeight: number | null = null

    const applyResize = () => {
      if (pendingWidth !== null) {
        shellRef.current?.style.setProperty("--prompt-w", `${clampPromptWidth(pendingWidth)}px`)
      }
      if (pendingHeight !== null) {
        panelRef.current?.style.setProperty("--prompt-h", `${pendingHeight}px`)
      }
      pendingWidth = null
      pendingHeight = null
      frameId = null
    }

    const scheduleResize = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(applyResize)
    }

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      // Width is hard-limited so dragging cannot keep expanding the prompt surface.
      if (dir === "left" || dir === "top-left") {
        pendingWidth = clampPromptWidth(startW - dx)
      }
      if (dir === "right" || dir === "top-right") {
        pendingWidth = clampPromptWidth(startW + dx)
      }

      // Height: panel anchored at bottom, drag up to grow
      if (dir === "top" || dir === "top-left" || dir === "top-right") {
        pendingHeight = startH - dy
      }

      scheduleResize()
    }

    const onUp = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
        applyResize()
      }
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      shellRef.current?.classList.remove("is-resizing")
      panelRef.current?.classList.remove("is-resizing")
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    shell?.classList.add("is-resizing")
    panel.classList.add("is-resizing")
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
                {/* Upload button — always visible, does not scroll */}
                {(() => {
                  const maxCount = selectedModelInfo?.referenceImageCount ?? Infinity
                  const atLimit = uploadedImages.length >= maxCount
                  return (
                    <button
                      onClick={() => !atLimit && fileInputRef.current?.click()}
                      disabled={atLimit}
                      className="btn btn-ghost btn-square liquid-icon-button flex-shrink-0"
                      aria-label="Add reference image"
                      title={
                        maxCount === Infinity
                          ? "Add reference image"
                          : `${uploadedImages.length} / ${maxCount} images`
                      }
                    >
                      <ImagePlus className="size-5" />
                    </button>
                  )
                })()}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={REFERENCE_IMAGE_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Scrollable image strip */}
                {uploadedImages.length > 0 && (
                  <div className="liquid-upload-images-scroll">
                    {uploadedImages.map(img => (
                      <div
                        key={img.id}
                        className="relative rounded-xl group"
                        onMouseEnter={e => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setHoveredImage({ url: img.previewUrl, rect })
                        }}
                        onMouseLeave={() => setHoveredImage(null)}
                      >
                        <img src={img.previewUrl} alt="Preview" className="liquid-upload-preview" />
                        {img.status !== "uploaded" && (
                          <div className="absolute inset-0 grid place-items-center bg-base-300/70 text-base-content rounded-xl">
                            {img.status === "uploading" && (
                              <Loader2 className="size-4 animate-spin" />
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(img.id)}
                          className="btn btn-circle liquid-upload-remove absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="Remove reference image"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    className="rounded-lg shadow-xl overflow-hidden"
                    style={{
                      background: "rgba(10, 12, 20, 0.92)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <img
                      src={hoveredImage.url}
                      alt="Preview"
                      className="block"
                      style={{ maxWidth: 260, maxHeight: 260 }}
                    />
                  </div>
                </div>,
                document.body
              )}

            <div className="liquid-prompt-input">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                aria-describedby="prompt-character-limit"
                placeholder={t.aiToolkit?.promptPlaceholder || "Describe your image..."}
                className="textarea textarea-ghost pt-3 pl-2 liquid-prompt-textarea w-full text-base focus:outline-none"
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

          <div
            id="prompt-character-limit"
            className={`liquid-prompt-hint ${
              isPromptAtCharacterLimit ? "liquid-prompt-hint--limit" : ""
            }`}
            role={isPromptAtCharacterLimit ? "status" : undefined}
          >
            <span>
              {isPromptOverCharacterLimit
                ? `已超出 ${promptCharacterLimitText} 字符上限`
                : isPromptAtCharacterLimit
                  ? `已达到 ${promptCharacterLimitText} 字符上限`
                  : ""}
            </span>
            <span className="liquid-prompt-hint__count">
              {promptCharacterCount.toLocaleString("en-US")} / {promptCharacterLimitText}
            </span>
          </div>

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

            {prompt.trim() && (
              <div
                className={`liquid-credit-estimate ${
                  hasInsufficientCredits ? "liquid-credit-estimate--warning" : ""
                }`}
                aria-live="polite"
              >
                {creditEstimateText}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={
                !prompt.trim() ||
                isGenerating ||
                hasInsufficientCredits ||
                isUploadingImages ||
                hasFailedUploads
              }
              className={`btn liquid-generate-button ${
                hasInsufficientCredits ? "btn-disabled" : "btn-primary"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t.aiToolkit?.generating || "Generating..."}
                </>
              ) : isUploadingImages ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Uploading...
                </>
              ) : hasFailedUploads ? (
                <>Upload failed</>
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
