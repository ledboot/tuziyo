import { useEffect, useRef, useState } from "react"
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

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modelOptionConfig = useModelStore(
    state => state.modelOptionsConfig[selectedModel] ?? EMPTY_MODEL_OPTIONS_CONFIG
  )
  const normalizeModelOptions = useModelStore(state => state.normalizeModelOptions)

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

  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      <div
        id="prompt-area"
        className="liquid-glass bg-base-100/10 relative rounded-4xl overflow-visible"
      >
        <div className="card-body p-4 relative z-10 overflow-visible">
          {selectedModelInfo?.supportsImage && (
            <div className="mt-4">
              <div className="flex gap-2">
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost btn-square w-10 h-10"
                  >
                    <ImagePlus />
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
                {uploadedImages.map(img => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="btn btn-circle h-4 w-4 absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.aiToolkit?.promptPlaceholder || "Describe your image..."}
              className="textarea textarea-ghost w-full text-base resize-none focus:outline-none"
              rows={2}
            />
          </div>

          {showNegativePrompt && (
            <div className="mt-2">
              <textarea
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..."
                className="textarea textarea-ghost textarea-sm w-full resize-none focus:outline-none"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <CustomSelect
              label="Models"
              options={modelSelectOptions}
              value={selectedModel}
              onChange={onModelChange}
              className="min-w-10"
            />

            {optionGroups.length > 0 && <ModelOptions groups={optionGroups} />}

            {supportsNegativePrompt && (
              <button
                type="button"
                onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                className="btn btn-ghost items-center whitespace-nowrap border border-base-200 hover:border-primary hover:bg-base-100"
              >
                {negativePromptConfig?.name ?? "Negative Prompt"}
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || hasInsufficientCredits}
              className={`btn ${hasInsufficientCredits ? "btn-disabled" : "btn-primary"}`}
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
