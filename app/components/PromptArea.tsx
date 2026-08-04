import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react"
import { createPortal } from "react-dom"
import {
  X,
  ImagePlus,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Video,
  Plus,
  Images,
  Film,
  AudioLines,
  Check,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "~/lib/i18n"
import { CustomSelect, type SelectOption } from "~/components/CustomSelect"
import { ModelOptions, type OptionGroup } from "~/components/ModelOptions"
import { useUserStore } from "~/stores/userStore"
import {
  useModelStore,
  type Model,
  type ModelOptionsConfig,
  type PersistedReferenceMedia,
} from "~/stores/modelStore"
import { api, getApiErrorMessage } from "~/lib/api"
import {
  inspectReferenceMedia,
  validateReferenceFile,
  validateReferenceImage,
  validateReferenceSelection,
  type ReferenceMediaMetadata,
} from "~/lib/referenceMediaValidation"
import {
  formatPromptLimit,
  getPromptLimitMessage,
  getPromptLimitStatus,
} from "~/lib/promptValidation"
import { getFloatingMenuPlacement, type VerticalPlacement } from "~/lib/floatingPlacement"
import {
  classifyAnalyticsError,
  getCreditBalanceBucket,
  markGenerationStarted,
  markPricingIntent,
  rememberGenerationTask,
  trackEvent,
  trackModelOptionSelection,
} from "~/lib/analytics"

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
const REFERENCE_VIDEO_ACCEPT = "video/mp4,video/quicktime"
const REFERENCE_VIDEO_MAX_BYTES = 50 * 1024 * 1024
const REFERENCE_AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
const REFERENCE_AUDIO_MAX_BYTES = 15 * 1024 * 1024
const DEFAULT_PROMPT_MAX_LENGTH = 80000
const PROMPT_MIN_WIDTH = 800
const PROMPT_MIN_HEIGHT_REM = 15.9375

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
type ReferenceMediaKind = "image" | "video" | "audio"
type ReferenceMediaRole = "start_frame" | "end_frame" | "reference"
type VideoInputMode = "start_end_frame" | "image_reference" | "video_reference"

interface ReferenceMentionState {
  start: number
  end: number
  query: string
  activeIndex: number
  anchorRect: {
    left: number
    top: number
    bottom: number
  }
}

export interface UploadedImage {
  id: string
  previewUrl: string
  key?: string
  url?: string
  contentType?: string
  size?: number
  status: UploadedImageStatus
  error?: string
  kind?: ReferenceMediaKind
  role?: ReferenceMediaRole
  fileName?: string
  width?: number
  height?: number
  durationSeconds?: number
  fps?: number
}

function getReferenceAssetByTag(tag: string, assets: UploadedImage[]) {
  const match = tag.match(/^@(image|video|audio)(\d+)$/)
  if (!match) return undefined

  const kind = match[1] as ReferenceMediaKind
  const index = Number(match[2]) - 1
  return assets.filter(item => item.status === "uploaded" && (item.kind ?? "image") === kind)[index]
}

function appendPromptText(fragment: DocumentFragment, value: string) {
  const lines = value.split("\n")
  lines.forEach((line, index) => {
    if (index > 0) fragment.append(document.createElement("br"))
    if (line) fragment.append(document.createTextNode(line))
  })
}

function syncPromptEditor(
  editor: HTMLDivElement,
  value: string,
  assets: UploadedImage[],
  onMediaError?: () => void
) {
  const fragment = document.createDocumentFragment()
  const tagPattern = /@(image|video|audio)\d+/g
  let lastIndex = 0

  for (const match of value.matchAll(tagPattern)) {
    const tag = match[0]
    const matchIndex = match.index ?? 0
    appendPromptText(fragment, value.slice(lastIndex, matchIndex))

    const asset = getReferenceAssetByTag(tag, assets)
    if (!asset) {
      appendPromptText(fragment, tag)
      lastIndex = matchIndex + tag.length
      continue
    }

    const kind = asset.kind ?? "image"
    const chip = document.createElement("span")
    chip.className = `liquid-prompt-reference-chip liquid-prompt-reference-chip--${kind}`
    chip.contentEditable = "false"
    chip.dataset.referenceTag = tag
    chip.dataset.kind = kind

    const preview = document.createElement("span")
    preview.className = "liquid-prompt-reference-chip__preview"
    if (kind === "image") {
      const image = document.createElement("img")
      image.src = asset.previewUrl
      image.alt = ""
      if (onMediaError) image.addEventListener("error", onMediaError, { once: true })
      preview.appendChild(image)
    } else if (kind === "video") {
      const video = document.createElement("video")
      video.src = asset.previewUrl
      video.muted = true
      if (onMediaError) video.addEventListener("error", onMediaError, { once: true })
      preview.appendChild(video)
    }

    const label = document.createElement("span")
    label.className = "liquid-prompt-reference-chip__label"
    label.textContent = tag
    chip.appendChild(preview)
    chip.appendChild(label)
    fragment.append(chip)
    lastIndex = matchIndex + tag.length
  }

  appendPromptText(fragment, value.slice(lastIndex))
  editor.replaceChildren(fragment)
}

function getPromptEditorValue(editor: HTMLElement) {
  if (!editor.textContent) return ""
  return editor.innerText.replace(/\r\n/g, "\n")
}

function getPromptEditorCaretOffset(editor: HTMLDivElement) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return getPromptEditorValue(editor).length

  const range = selection.getRangeAt(0)
  if (!editor.contains(range.endContainer)) return getPromptEditorValue(editor).length

  const prefix = range.cloneRange()
  prefix.selectNodeContents(editor)
  prefix.setEnd(range.endContainer, range.endOffset)
  return prefix.toString().length
}

function getPromptEditorCaretRect(editor: HTMLDivElement) {
  const selection = window.getSelection()
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0).cloneRange()
    if (editor.contains(range.endContainer)) {
      range.collapse(false)
      const rect = range.getBoundingClientRect()
      if (rect.width || rect.height) {
        return { left: rect.left, top: rect.top, bottom: rect.bottom }
      }
    }
  }

  const rect = editor.getBoundingClientRect()
  return { left: rect.left + 8, top: rect.top + 8, bottom: rect.top + 28 }
}

function setPromptEditorCaretOffset(editor: HTMLDivElement, requestedOffset: number) {
  const range = document.createRange()
  const selection = window.getSelection()
  let remaining = Math.max(0, requestedOffset)

  const placeCaret = (node: Node): boolean => {
    if (node instanceof HTMLElement && node.dataset.referenceTag) {
      const tagLength = node.dataset.referenceTag.length
      if (remaining <= tagLength) {
        range.setStartAfter(node)
        return true
      }
      remaining -= tagLength
      return false
    }
    if (node instanceof HTMLBRElement) {
      if (remaining <= 1) {
        range.setStartAfter(node)
        return true
      }
      remaining -= 1
      return false
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length ?? 0
      if (remaining <= length) {
        range.setStart(node, remaining)
        return true
      }
      remaining -= length
      return false
    }

    for (const child of node.childNodes) {
      if (placeCaret(child)) return true
    }
    return false
  }

  if (!placeCaret(editor)) range.selectNodeContents(editor)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function mergeReferenceMedia(
  current: UploadedImage[],
  persisted: PersistedReferenceMedia[]
): UploadedImage[] {
  const merged = new Map<string, UploadedImage>()

  for (const item of persisted) {
    merged.set(item.key || item.id, {
      ...item,
      previewUrl: item.url,
      status: "uploaded",
    })
  }
  for (const item of current) {
    merged.set(item.key || item.id, item)
  }

  return [...merged.values()]
}

interface ReferenceRoleOption {
  value: ReferenceMediaRole
  label: string
}

interface ReferenceRoleSelectProps {
  assetId: string
  value: ReferenceMediaRole
  options: ReferenceRoleOption[]
  onChange: (assetId: string, role: ReferenceMediaRole) => void
}

function ReferenceRoleSelect({ assetId, value, options, onChange }: ReferenceRoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value) ?? options[0]

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      const gap = 8
      const estimatedMenuHeight = options.length * 48 + 16
      const openBelow =
        window.innerHeight - rect.bottom >= estimatedMenuHeight || rect.top < estimatedMenuHeight
      const menuWidth = 224

      setMenuStyle({
        position: "fixed",
        left: Math.min(Math.max(12, rect.left), window.innerWidth - menuWidth - 12),
        ...(openBelow
          ? { top: rect.bottom + gap }
          : { bottom: window.innerHeight - rect.top + gap }),
        width: menuWidth,
        zIndex: 10000,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen, options.length])

  useEffect(() => {
    if (!isOpen) return

    const isWithinSelect = (target: EventTarget | null) =>
      target instanceof Node &&
      (buttonRef.current?.contains(target) || menuRef.current?.contains(target))

    const handlePointerOutside = (event: MouseEvent) => {
      if (isWithinSelect(event.target)) return
      setIsOpen(false)
    }

    const handleFocusOutside = (event: globalThis.FocusEvent) => {
      if (isWithinSelect(event.target)) return
      setIsOpen(false)
    }

    document.addEventListener("mousedown", handlePointerOutside)
    document.addEventListener("focusin", handleFocusOutside)
    return () => {
      document.removeEventListener("mousedown", handlePointerOutside)
      document.removeEventListener("focusin", handleFocusOutside)
    }
  }, [isOpen])

  const handleRoleChange = (role: ReferenceMediaRole) => {
    onChange(assetId, role)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const roleMenu = isOpen ? (
    <div
      ref={menuRef}
      className="liquid-reference-role-menu"
      style={menuStyle}
      role="menu"
      aria-label="Image role"
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="menuitemradio"
          aria-checked={option.value === value}
          className={option.value === value ? "is-active" : ""}
          onClick={() => handleRoleChange(option.value)}
        >
          <ImageIcon className="size-5" aria-hidden="true" />
          <span>{option.label}</span>
          {option.value === value && <Check className="ml-auto size-5" aria-hidden="true" />}
        </button>
      ))}
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="liquid-reference-asset__role"
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label ?? "Image Reference"}</span>
        <ChevronDown
          className={`size-3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {typeof document !== "undefined" && createPortal(roleMenu, document.body)}
    </>
  )
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
        type: option.uiControl === "slider" ? "range" : option.type,
        min: option.min,
        max: option.max,
        step: option.step,
        onChange: (nextValue: string) => onChange({ ...options, [key]: nextValue }),
      },
    ]
  })
}

function calculateRequiredCredits(
  model: Model | undefined,
  normalizedOptions: Record<string, string>,
  referenceMedia: UploadedImage[]
): number {
  if (!model) return 0
  if (model.pricingMode === "per_second") {
    let creditsPerSecond = model.creditsPerSecond || 0
    const selectedOptions: Record<string, string> = {}
    if (model.options) {
      for (const [key, option] of Object.entries(model.options)) {
        const selectedValue = normalizedOptions[key] ?? option.defaultValue
        if (selectedValue !== undefined) selectedOptions[key] = selectedValue
        const premium = selectedValue ? option.valueCredits?.[selectedValue] : undefined
        if (typeof premium === "number") creditsPerSecond += premium
      }
    }
    const override = model.creditOverrides?.find(rule =>
      Object.entries(rule.when).every(([key, value]) => selectedOptions[key] === value)
    )
    if (override) creditsPerSecond = override.creditsPerSecond
    const durationValue = normalizedOptions.duration ?? model.options?.duration?.defaultValue ?? "5"
    const duration = durationValue === "auto" ? 10 : Math.max(1, Number(durationValue) || 5)
    let totalCredits = creditsPerSecond * duration
    const referencePricing = model.referenceCredits
    if (referencePricing) {
      totalCredits +=
        referenceMedia.filter(item => (item.kind ?? "image") === "image").length *
        (referencePricing.imagePerItem ?? 0)
      const resolution =
        selectedOptions.resolution ??
        normalizedOptions.resolution ??
        model.options?.resolution?.defaultValue ??
        ""
      const videoRate =
        referencePricing.videoPerSecondByResolution?.[resolution] ??
        referencePricing.videoPerSecond ??
        0
      const billedSeconds = (kind: "video" | "audio") =>
        referenceMedia
          .filter(item => item.kind === kind)
          .reduce((sum, item) => sum + Math.ceil(item.durationSeconds ?? 0), 0)
      totalCredits += billedSeconds("video") * videoRate
      totalCredits += billedSeconds("audio") * (referencePricing.audioPerSecond ?? 0)
    }
    return Math.ceil(totalCredits)
  }

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

  totalCredits += referenceMedia.filter(item => (item.kind ?? "image") === "image").length * 5

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
  const { user } = useUserStore()

  const userPrompt = useModelStore(state => state.userPrompt)
  const setUserPrompt = useModelStore(state => state.setUserPrompt)
  const mediaType = useModelStore(state => state.userMediaType)
  const setMediaType = useModelStore(state => state.setUserMediaType)
  const persistedReferenceMedia = useModelStore(state => state.referenceMedia)
  const setPersistedReferenceMedia = useModelStore(state => state.setReferenceMedia)

  const [prompt, setPrompt] = useState(initialPrompt || userPrompt || "")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages)
  const [hoveredImage, setHoveredImage] = useState<{ url: string; rect: DOMRect } | null>(null)
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode | null>(null)
  const [showVideoInputMenu, setShowVideoInputMenu] = useState(false)
  const [videoInputMenuPlacement, setVideoInputMenuPlacement] = useState<VerticalPlacement>("up")
  const [referenceMention, setReferenceMention] = useState<ReferenceMentionState | null>(null)
  const [referenceMediaRefreshNonce, setReferenceMediaRefreshNonce] = useState(0)

  // Resize: use CSS variables — no React state, no re-renders during drag
  const shellRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLDivElement>(null)
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const videoInputMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const videoInputMenuRef = useRef<HTMLDivElement>(null)
  const pendingImageRoleRef = useRef<ReferenceMediaRole>("reference")
  const uploadedImagesRef = useRef<UploadedImage[]>([])
  const initialImagesRef = useRef(initialImages)
  const lastEditorPromptRef = useRef("")
  const lastEditorAssetsRef = useRef("")
  const lastReferenceMediaRefreshRequestRef = useRef(0)
  const isRestoringReferenceMediaRef = useRef(false)
  const referenceMediaOwnerRef = useRef<string | null>(null)
  const insufficientCreditsEventRef = useRef<string | null>(null)

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

  useLayoutEffect(() => {
    if (!showVideoInputMenu) return
    const updatePlacement = () => {
      const trigger = videoInputMenuTriggerRef.current
      const menu = videoInputMenuRef.current
      if (!trigger || !menu) return
      const triggerRect = trigger.getBoundingClientRect()
      setVideoInputMenuPlacement(
        getFloatingMenuPlacement({
          triggerTop: triggerRect.top,
          triggerBottom: triggerRect.bottom,
          menuHeight: menu.getBoundingClientRect().height,
          viewportHeight: window.innerHeight,
        })
      )
    }

    updatePlacement()
    window.addEventListener("resize", updatePlacement)
    window.addEventListener("scroll", updatePlacement, true)
    const resizeObserver = new ResizeObserver(updatePlacement)
    if (videoInputMenuTriggerRef.current) resizeObserver.observe(videoInputMenuTriggerRef.current)
    if (videoInputMenuRef.current) resizeObserver.observe(videoInputMenuRef.current)
    return () => {
      window.removeEventListener("resize", updatePlacement)
      window.removeEventListener("scroll", updatePlacement, true)
      resizeObserver.disconnect()
    }
  }, [showVideoInputMenu, selectedModel])

  const availableModels = models.filter(model => model.mediaType === mediaType)
  const isModelDataPending = isModelsLoading || models.length === 0

  const selectedModelInfo = availableModels.find(m => m.id === selectedModel)
  const referenceMediaConstraints = selectedModelInfo?.referenceMediaConstraints
  const referenceImageConstraints =
    selectedModelInfo?.referenceImageConstraints ?? referenceMediaConstraints?.image
  const selectedVideoInputMode = selectedModelInfo?.videoInputModes?.find(
    mode => mode.id === videoInputMode
  )
  const hasAudioOnlyReference =
    mediaType === "video" &&
    Boolean(selectedVideoInputMode?.requiresImageOrVideo) &&
    uploadedImages.some(item => item.kind === "audio") &&
    !uploadedImages.some(item => (item.kind ?? "image") === "image" || item.kind === "video")
  const referenceSelectionError = validateReferenceSelection(
    uploadedImages,
    referenceMediaConstraints
  )
  const referenceUsageText = (() => {
    if (!referenceMediaConstraints || uploadedImages.length === 0) return ""
    const totalBytes = uploadedImages.reduce((sum, item) => sum + (item.size ?? 0), 0)
    const videoSeconds = uploadedImages
      .filter(item => item.kind === "video")
      .reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0)
    const audioSeconds = uploadedImages
      .filter(item => item.kind === "audio")
      .reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0)
    const parts = [
      `References ${(totalBytes / 1_000_000).toFixed(1)}/${referenceMediaConstraints.totalMaxBytes / 1_000_000}MB`,
    ]
    if (videoSeconds > 0) {
      parts.push(
        `video ${videoSeconds.toFixed(1)}/${referenceMediaConstraints.video.maxTotalDurationSeconds}s`
      )
    }
    if (audioSeconds > 0) {
      parts.push(
        `audio ${audioSeconds.toFixed(1)}/${referenceMediaConstraints.audio.maxTotalDurationSeconds}s`
      )
    }
    return parts.join(" · ")
  })()
  const isSeedanceModel = mediaType === "video" && selectedModel.startsWith("bytedance/seedance-")
  const supportsAtReferenceTags =
    isSeedanceModel || selectedVideoInputMode?.referenceTagStyle === "at"
  const requestReferenceMediaRefresh = () => {
    const now = Date.now()
    if (now - lastReferenceMediaRefreshRequestRef.current < 2000) return
    lastReferenceMediaRefreshRequestRef.current = now
    setReferenceMediaRefreshNonce(value => value + 1)
  }
  const referenceMediaKeysSignature = JSON.stringify(
    user
      ? persistedReferenceMedia
          .filter(item => item.ownerUserId === user.userId)
          .map(item => item.key)
          .filter(Boolean)
      : []
  )
  const promptMaxLength = selectedModelInfo?.promptMaxLength ?? DEFAULT_PROMPT_MAX_LENGTH
  const promptLimits = selectedModelInfo?.promptLimits
  const promptInputMaxLength = promptLimits ? Number.POSITIVE_INFINITY : promptMaxLength
  const normalizedModelOptions = normalizeModelOptions(selectedModel, modelOptions)
  const billableReferenceMedia = (() => {
    if (mediaType === "image") {
      return uploadedImages
        .filter(item => (item.kind ?? "image") === "image")
        .slice(0, selectedModelInfo?.referenceImageCount ?? 0)
    }
    if (selectedVideoInputMode?.id === "start_end_frame") {
      return uploadedImages
        .filter(
          item =>
            (item.kind ?? "image") === "image" &&
            (item.role === "start_frame" || item.role === "end_frame")
        )
        .slice(0, selectedVideoInputMode.imageCount ?? 0)
    }
    if (selectedVideoInputMode?.id === "image_reference") {
      const images = uploadedImages
        .filter(item => (item.kind ?? "image") === "image")
        .slice(0, selectedVideoInputMode.imageCount ?? 0)
      const audios = uploadedImages
        .filter(item => item.kind === "audio")
        .slice(0, selectedVideoInputMode.audioCount ?? 0)
      return [...images, ...audios]
    }
    if (selectedVideoInputMode?.id === "video_reference") {
      const images = uploadedImages
        .filter(item => (item.kind ?? "image") === "image")
        .slice(0, selectedVideoInputMode.imageCount ?? 0)
      const videos = uploadedImages
        .filter(item => item.kind === "video")
        .slice(0, selectedVideoInputMode.videoCount ?? 0)
      const audios = uploadedImages
        .filter(item => item.kind === "audio")
        .slice(0, selectedVideoInputMode.audioCount ?? 0)
      return [...images, ...videos, ...audios]
    }
    return []
  })()
  const requiredCredits = calculateRequiredCredits(
    selectedModelInfo,
    normalizedModelOptions,
    billableReferenceMedia
  )
  const availableCredits = user?.credits ?? 0
  const hasInsufficientCredits = Boolean(user && availableCredits < requiredCredits)
  const creditEstimateText =
    requiredCredits > 0
      ? `Cost ≈ ${requiredCredits.toLocaleString("en-US")} credits`
      : "Cost ≈ 0 credits"
  const handleModelOptionsChange = (nextOptions: Record<string, string>) => {
    const changedOption = Object.entries(nextOptions).find(
      ([key, value]) => normalizedModelOptions[key] !== value
    )

    if (changedOption) {
      const [optionId, optionValue] = changedOption
      trackModelOptionSelection({
        modelId: selectedModel,
        optionId,
        optionValue,
        previousOptionValue: normalizedModelOptions[optionId],
      })
    }

    onOptionsChange(nextOptions)
  }
  const optionGroups = buildOptionGroups(
    modelOptionConfig,
    normalizedModelOptions,
    handleModelOptionsChange
  )
  const negativePromptConfig = modelOptionConfig.negative_prompt
  const supportsNegativePrompt = negativePromptConfig?.type === "textarea"
  const promptLimitStatus = promptLimits
    ? getPromptLimitStatus(prompt, promptLimits)
    : {
        count: getPromptCharacterCount(prompt),
        rule: { max: promptMaxLength, unit: "characters" as const },
        isAtLimit: getPromptCharacterCount(prompt) >= promptMaxLength,
        isOverLimit: getPromptCharacterCount(prompt) > promptMaxLength,
      }
  const promptCount = promptLimitStatus.count
  const promptLimitText = formatPromptLimit(promptLimitStatus.rule)
  const promptLimitError = promptLimits
    ? getPromptLimitMessage(prompt, promptLimits)
    : promptLimitStatus.isOverLimit
      ? `Prompt must not exceed ${promptMaxLength.toLocaleString("en-US")} characters.`
      : null
  const isPromptOverCharacterLimit = promptLimitStatus.isOverLimit
  const isPromptAtCharacterLimit = promptLimitStatus.isAtLimit
  const modelSelectOptions: SelectOption[] = availableModels.map(model => {
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

  const handleModelChange = (model: string) => {
    trackEvent("select_model", { model_id: model, previous_model_id: selectedModel })
    onModelChange(model)
  }

  const handleSelectImageMode = () => setMediaType("image")
  const handleSelectVideoMode = () => setMediaType("video")

  useEffect(() => {
    setHoveredImage(null)
    setShowVideoInputMenu(false)
    setReferenceMention(null)

    if (mediaType !== "video") {
      setVideoInputMode(null)
      return
    }
    if (!selectedModelInfo) return

    const modes = selectedModelInfo.videoInputModes ?? []
    if (videoInputMode && modes.some(mode => mode.id === videoInputMode)) return

    const currentMedia = uploadedImages
    const hasFrameImages = currentMedia.some(
      item =>
        (item.kind ?? "image") === "image" &&
        (item.role === "start_frame" || item.role === "end_frame")
    )
    const hasReferenceImages = currentMedia.some(
      item => (item.kind ?? "image") === "image" && (item.role ?? "reference") === "reference"
    )
    const hasVideoOrAudio = currentMedia.some(
      item => item.kind === "video" || item.kind === "audio"
    )
    const startEndMode = modes.find(mode => mode.id === "start_end_frame")
    const imageReferenceMode = modes.find(mode => mode.id === "image_reference")
    const videoReferenceMode = modes.find(mode => mode.id === "video_reference")

    if (hasFrameImages && startEndMode) {
      setVideoInputMode(startEndMode.id)
      return
    }

    if (hasFrameImages && !startEndMode && imageReferenceMode) {
      setUploadedImages(previous =>
        previous.map(item =>
          (item.kind ?? "image") === "image" &&
          (item.role === "start_frame" || item.role === "end_frame")
            ? { ...item, role: "reference" }
            : item
        )
      )
      setVideoInputMode(imageReferenceMode.id)
      return
    }

    if (hasVideoOrAudio && videoReferenceMode) {
      setVideoInputMode(videoReferenceMode.id)
      return
    }

    if (hasReferenceImages && imageReferenceMode) {
      setVideoInputMode(imageReferenceMode.id)
      return
    }

    setVideoInputMode(null)
  }, [mediaType, selectedModelInfo, uploadedImages, videoInputMode])

  useEffect(() => {
    if (availableModels.length === 0) return

    // If currently selected model is valid, do nothing
    if (selectedModelInfo) {
      return
    }

    // Otherwise, select the first model
    const firstModel = availableModels[0]
    if (firstModel) {
      onModelChange(firstModel.id)
    }
  }, [availableModels, selectedModelInfo, onModelChange])

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
    const editor = inputRef.current
    if (!editor) return

    const assetSignature = uploadedImages
      .map(item => `${item.id}:${item.status}:${item.previewUrl}`)
      .join("|")
    if (lastEditorPromptRef.current === prompt && lastEditorAssetsRef.current === assetSignature) {
      return
    }

    const shouldRestoreCaret = document.activeElement === editor
    const caretOffset = shouldRestoreCaret ? getPromptEditorCaretOffset(editor) : prompt.length
    syncPromptEditor(editor, prompt, uploadedImages, requestReferenceMediaRefresh)
    lastEditorPromptRef.current = prompt
    lastEditorAssetsRef.current = assetSignature
    if (shouldRestoreCaret) {
      requestAnimationFrame(() => setPromptEditorCaretOffset(editor, caretOffset))
    }
  }, [prompt, uploadedImages])

  useEffect(() => {
    initialImagesRef.current = initialImages
  }, [initialImages])

  useEffect(() => {
    if (!user) {
      if (referenceMediaOwnerRef.current) {
        setUploadedImages(initialImagesRef.current)
        referenceMediaOwnerRef.current = null
      }
      return
    }

    setUploadedImages(previous => {
      const ownedMedia = persistedReferenceMedia.filter(item => item.ownerUserId === user.userId)
      const base =
        referenceMediaOwnerRef.current && referenceMediaOwnerRef.current !== user.userId
          ? initialImagesRef.current
          : previous
      const merged = mergeReferenceMedia(base, ownedMedia)
      const previousSignature = previous
        .map(
          item =>
            `${item.key ?? item.id}:${item.url ?? item.previewUrl}:${item.role ?? "reference"}`
        )
        .join("|")
      const mergedSignature = merged
        .map(
          item =>
            `${item.key ?? item.id}:${item.url ?? item.previewUrl}:${item.role ?? "reference"}`
        )
        .join("|")
      if (previousSignature === mergedSignature) return previous

      isRestoringReferenceMediaRef.current = true
      return merged
    })
    referenceMediaOwnerRef.current = user.userId
  }, [persistedReferenceMedia, user])

  useEffect(() => {
    if (!user) return

    if (isRestoringReferenceMediaRef.current) {
      isRestoringReferenceMediaRef.current = false
      return
    }

    const nextPersisted = uploadedImages.flatMap<PersistedReferenceMedia>(item => {
      if (item.status !== "uploaded" || !item.key || !item.url) return []
      return [
        {
          id: item.id,
          ownerUserId: user.userId,
          key: item.key,
          url: item.url,
          contentType: item.contentType,
          size: item.size,
          kind: item.kind ?? "image",
          role: item.role ?? "reference",
          fileName: item.fileName,
          width: item.width,
          height: item.height,
          durationSeconds: item.durationSeconds,
          fps: item.fps,
        },
      ]
    })
    const nextStoredMedia = [
      ...persistedReferenceMedia.filter(item => item.ownerUserId !== user.userId),
      ...nextPersisted,
    ]
    const currentSignature = JSON.stringify(persistedReferenceMedia)
    const nextSignature = JSON.stringify(nextStoredMedia)
    if (currentSignature !== nextSignature) {
      setPersistedReferenceMedia(nextStoredMedia)
    }
  }, [persistedReferenceMedia, setPersistedReferenceMedia, uploadedImages, user])

  useEffect(() => {
    if (!user) return

    const keys = JSON.parse(referenceMediaKeysSignature) as string[]
    if (keys.length === 0) return

    let cancelled = false
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    const scheduleRefresh = (delayMs: number) => {
      if (cancelled) return
      refreshTimer = setTimeout(() => setReferenceMediaRefreshNonce(value => value + 1), delayMs)
    }
    const refreshUrls = async () => {
      try {
        const { items, expiresIn } = await api.uploads.resolveReferenceMedia(keys)
        if (cancelled) return
        const urls = new Map(items.map(item => [item.key, item.url]))
        setUploadedImages(previous =>
          previous.map(item => {
            const resolvedUrl = item.key ? urls.get(item.key) : undefined
            if (!resolvedUrl || resolvedUrl === item.url) return item
            if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl)
            return { ...item, url: resolvedUrl, previewUrl: resolvedUrl }
          })
        )
        const expiresInSeconds =
          Number.isFinite(expiresIn) && expiresIn > 5 * 60 ? expiresIn : 60 * 60
        scheduleRefresh(Math.max(60_000, (expiresInSeconds - 5 * 60) * 1000))
      } catch (error) {
        if (!cancelled) console.error("Failed to refresh reference media URLs:", error)
        scheduleRefresh(30_000)
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        setReferenceMediaRefreshNonce(value => value + 1)
      }
    }

    void refreshUrls()
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      cancelled = true
      if (refreshTimer) clearTimeout(refreshTimer)
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [referenceMediaKeysSignature, referenceMediaRefreshNonce, user?.userId])

  useEffect(() => {
    if (!user || !prompt.trim() || !hasInsufficientCredits) {
      insufficientCreditsEventRef.current = null
      return
    }

    const eventKey = `${selectedModel}:${requiredCredits}:${availableCredits}`
    if (insufficientCreditsEventRef.current === eventKey) return
    insufficientCreditsEventRef.current = eventKey
    markPricingIntent("credit_insufficient")
    trackEvent("credit_insufficient_shown", {
      model_id: selectedModel,
      required_credits: requiredCredits,
      credit_balance_bucket: getCreditBalanceBucket(availableCredits),
    })
  }, [availableCredits, hasInsufficientCredits, prompt, requiredCredits, selectedModel, user])

  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const uploadReferenceMedia = async (
    file: File,
    kind: ReferenceMediaKind,
    role: ReferenceMediaRole = "reference",
    metadata: ReferenceMediaMetadata = {}
  ) => {
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setUploadedImages(prev => {
      const retained =
        role === "reference"
          ? prev
          : prev.filter(item => {
              if (item.role !== role) return true
              URL.revokeObjectURL(item.previewUrl)
              return false
            })
      return [
        ...retained,
        {
          id,
          previewUrl,
          contentType: file.type,
          size: file.size,
          status: "uploading",
          kind,
          role,
          fileName: file.name,
          ...metadata,
        },
      ]
    })

    try {
      const uploadedImage = await api.uploads.referenceMedia(file, selectedModel, kind)
      setUploadedImages(prev =>
        prev.map(image =>
          image.id === id
            ? {
                ...image,
                key: uploadedImage.key,
                url: uploadedImage.url,
                contentType: uploadedImage.contentType,
                size: uploadedImage.size,
                ...metadata,
                status: "uploaded",
              }
            : image
        )
      )
    } catch (error) {
      console.error(`Reference ${kind} upload error:`, error)
      setUploadedImages(prev =>
        prev.map(image =>
          image.id === id
            ? {
                ...image,
                status: "error",
                error: getApiErrorMessage(error, `Failed to upload reference ${kind}`),
              }
            : image
        )
      )
      toast.error(getApiErrorMessage(error, `Failed to upload reference ${kind}`))
    }
  }

  const inspectAndUploadReferenceMedia = async (
    file: File,
    kind: ReferenceMediaKind,
    role: ReferenceMediaRole = "reference"
  ) => {
    try {
      const metadata = await inspectReferenceMedia(file, kind)
      if (referenceMediaConstraints) {
        const validationError = validateReferenceFile(
          file,
          kind,
          metadata,
          referenceMediaConstraints
        )
        if (validationError) {
          toast.error(validationError)
          return
        }
        const aggregateError = validateReferenceSelection(
          [
            ...uploadedImagesRef.current,
            {
              kind,
              size: file.size,
              durationSeconds: metadata.durationSeconds,
              status: "uploaded",
            },
          ],
          referenceMediaConstraints
        )
        if (aggregateError) {
          toast.error(aggregateError)
          return
        }
      } else if (kind === "image" && referenceImageConstraints) {
        const validationError = validateReferenceImage(file, metadata, referenceImageConstraints)
        if (validationError) {
          toast.error(validationError)
          return
        }
      }
      await uploadReferenceMedia(file, kind, role, metadata)
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to inspect reference ${kind}`))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (!user) {
      trackEvent("login_prompt", { source: "reference_image_upload" })
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      e.target.value = ""
      return
    }

    const imageCount = uploadedImages.filter(item => (item.kind ?? "image") === "image").length
    const maxCount =
      mediaType === "video"
        ? (selectedVideoInputMode?.imageCount ?? 0)
        : (selectedModelInfo?.referenceImageCount ?? Infinity)
    const replacingFrame =
      mediaType === "video" &&
      pendingImageRoleRef.current !== "reference" &&
      uploadedImages.some(item => item.role === pendingImageRoleRef.current)
    const remaining = maxCount - imageCount + (replacingFrame ? 1 : 0)
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
      const acceptedImageTypes =
        referenceImageConstraints?.mimeTypes ?? REFERENCE_IMAGE_ACCEPT.split(",")
      if (!acceptedImageTypes.includes(file.type)) {
        toast.error(
          referenceImageConstraints && !referenceImageConstraints.mimeTypes.includes("image/webp")
            ? "Reference image must be PNG or JPEG."
            : "Reference image must be PNG, JPEG, or WEBP."
        )
        return
      }

      const maxBytes = referenceImageConstraints?.maxBytes ?? REFERENCE_IMAGE_MAX_BYTES
      if (file.size > maxBytes) {
        toast.error(`Reference image must not exceed ${Math.floor(maxBytes / 1_000_000)}MB.`)
        return
      }

      void inspectAndUploadReferenceMedia(file, "image", pendingImageRoleRef.current)
    })
    e.target.value = ""
  }

  const handleMediaUpload =
    (kind: "video" | "audio") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      if (!user) {
        trackEvent("login_prompt", { source: `reference_${kind}_upload` })
        window.dispatchEvent(new CustomEvent("openLoginModal"))
        e.target.value = ""
        return
      }

      const maxCount =
        kind === "video"
          ? (selectedVideoInputMode?.videoCount ?? 0)
          : (selectedVideoInputMode?.audioCount ?? 0)
      const currentCount = uploadedImages.filter(item => item.kind === kind).length
      const remaining = maxCount - currentCount
      if (remaining <= 0) {
        toast.error(
          `This mode supports at most ${maxCount} ${kind} file${maxCount === 1 ? "" : "s"}.`
        )
        e.target.value = ""
        return
      }

      Array.from(files)
        .slice(0, remaining)
        .forEach(file => {
          const accepted =
            referenceMediaConstraints?.[kind].mimeTypes ??
            (kind === "video" ? REFERENCE_VIDEO_ACCEPT : REFERENCE_AUDIO_ACCEPT).split(",")
          const maxBytes =
            referenceMediaConstraints?.[kind].maxBytes ??
            (kind === "video" ? REFERENCE_VIDEO_MAX_BYTES : REFERENCE_AUDIO_MAX_BYTES)
          if (!accepted.includes(file.type)) {
            toast.error(
              kind === "video"
                ? "Reference video must be MP4 or MOV."
                : "Reference audio must be MP3 or WAV."
            )
            return
          }
          if (file.size > maxBytes) {
            toast.error(`Reference ${kind} must be smaller than ${maxBytes / 1024 / 1024}MB.`)
            return
          }
          void inspectAndUploadReferenceMedia(file, kind)
        })
      e.target.value = ""
    }

  const removeImage = (id: string) => {
    const image = uploadedImages.find(img => img.id === id)
    if (image) URL.revokeObjectURL(image.previewUrl)
    setHoveredImage(null)
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const openImageUpload = (role: ReferenceMediaRole = "reference") => {
    pendingImageRoleRef.current = role
    fileInputRef.current?.click()
  }

  const insertReferenceTag = (tag: string) => {
    const editor = inputRef.current
    setReferenceMention(null)
    const start = editor ? getPromptEditorCaretOffset(editor) : prompt.length
    const end = start
    const leadingSpace = start > 0 && !/\s/.test(prompt[start - 1] ?? "") ? " " : ""
    const trailingSpace = end < prompt.length && !/\s/.test(prompt[end] ?? "") ? " " : ""
    const nextPrompt = clampPrompt(
      `${prompt.slice(0, start)}${leadingSpace}${tag}${trailingSpace}${prompt.slice(end)}`,
      promptInputMaxLength
    )
    setPrompt(nextPrompt)
    setUserPrompt(nextPrompt)
    requestAnimationFrame(() => {
      const cursor = Math.min(
        nextPrompt.length,
        start + leadingSpace.length + tag.length + trailingSpace.length
      )
      if (!editor) return
      editor.focus()
      setPromptEditorCaretOffset(editor, cursor)
    })
  }

  const handlePromptChange = (event: React.FormEvent<HTMLDivElement>) => {
    const editor = event.currentTarget
    const nextPrompt = getPromptEditorValue(editor)
    const clampedPrompt = clampPrompt(nextPrompt, promptInputMaxLength)
    lastEditorPromptRef.current = nextPrompt === clampedPrompt ? clampedPrompt : ""
    setPrompt(clampedPrompt)
    setUserPrompt(clampedPrompt)

    const cursor = Math.min(getPromptEditorCaretOffset(editor), clampedPrompt.length)
    const mentionMatch = clampedPrompt.slice(0, cursor).match(/(?:^|\s)@([a-zA-Z0-9]*)$/)
    const hasMentionableAssets = uploadedImages.some(
      item => item.status === "uploaded" && (item.role ?? "reference") === "reference"
    )
    if (supportsAtReferenceTags && hasMentionableAssets && mentionMatch) {
      const tokenLength = mentionMatch[0].trimStart().length
      setReferenceMention({
        start: cursor - tokenLength,
        end: cursor,
        query: mentionMatch[1].toLowerCase(),
        activeIndex: 0,
        anchorRect: getPromptEditorCaretRect(editor),
      })
    } else {
      setReferenceMention(null)
    }
  }

  const handleGenerate = async () => {
    let submittedTaskId: string | undefined

    if (!prompt.trim() || isGenerating) return
    if (!user) {
      trackEvent("login_prompt", { source: "generate" })
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (isPromptOverCharacterLimit) {
      toast.error(promptLimitError ?? "Prompt exceeds this model's limit.")
      return
    }

    if (hasAudioOnlyReference) {
      toast.error("Audio requires at least one reference image or video.")
      return
    }

    if (referenceSelectionError) {
      toast.error(referenceSelectionError)
      return
    }

    const allReferenceImages = uploadedImages.filter(item => (item.kind ?? "image") === "image")
    const allReferenceVideos = uploadedImages.filter(item => item.kind === "video")
    const allReferenceAudios = uploadedImages.filter(item => item.kind === "audio")
    const effectiveVideoInputMode =
      selectedVideoInputMode ??
      (allReferenceImages.some(item => item.role === "start_frame" || item.role === "end_frame")
        ? selectedModelInfo?.videoInputModes?.find(mode => mode.id === "start_end_frame")
        : allReferenceVideos.length > 0
          ? selectedModelInfo?.videoInputModes?.find(mode => mode.id === "video_reference")
          : allReferenceImages.length > 0
            ? selectedModelInfo?.videoInputModes?.find(mode => mode.id === "image_reference")
            : undefined)

    let usableReferenceImages: UploadedImage[] = []
    let usableReferenceVideos: UploadedImage[] = []
    let usableReferenceAudios: UploadedImage[] = []

    if (mediaType === "image") {
      if (selectedModelInfo?.supportsImage) {
        usableReferenceImages = allReferenceImages.slice(
          0,
          selectedModelInfo.referenceImageCount ?? 0
        )
      }
    } else if (effectiveVideoInputMode?.id === "start_end_frame") {
      usableReferenceImages = allReferenceImages
        .filter(item => item.role === "start_frame" || item.role === "end_frame")
        .slice(0, effectiveVideoInputMode.imageCount ?? 0)
    } else if (effectiveVideoInputMode?.id === "image_reference") {
      usableReferenceImages = allReferenceImages.slice(0, effectiveVideoInputMode.imageCount ?? 0)
      usableReferenceAudios = allReferenceAudios.slice(0, effectiveVideoInputMode.audioCount ?? 0)
    } else if (effectiveVideoInputMode?.id === "video_reference") {
      usableReferenceImages = allReferenceImages.slice(0, effectiveVideoInputMode.imageCount ?? 0)
      usableReferenceVideos = allReferenceVideos.slice(0, effectiveVideoInputMode.videoCount ?? 0)
      usableReferenceAudios = allReferenceAudios.slice(0, effectiveVideoInputMode.audioCount ?? 0)
    }

    const usableReferenceMedia = [
      ...usableReferenceImages,
      ...usableReferenceVideos,
      ...usableReferenceAudios,
    ]
    if (
      mediaType === "video" &&
      effectiveVideoInputMode?.id === "start_end_frame" &&
      usableReferenceImages.some(item => item.role === "end_frame") &&
      !usableReferenceImages.some(item => item.role === "start_frame")
    ) {
      toast.error("Add a start frame before using an end frame.")
      return
    }
    if (
      mediaType === "video" &&
      uploadedImages.length > 0 &&
      effectiveVideoInputMode?.id === "image_reference" &&
      usableReferenceImages.length === 0
    ) {
      toast.error("Image Reference mode requires at least one image.")
      return
    }
    if (
      mediaType === "video" &&
      uploadedImages.length > 0 &&
      effectiveVideoInputMode?.id === "video_reference" &&
      usableReferenceVideos.length === 0
    ) {
      toast.error("Video Reference mode requires at least one video.")
      return
    }

    if (usableReferenceMedia.some(item => item.status === "uploading")) {
      toast.error("Please wait for supported reference materials to finish uploading.")
      return
    }

    if (usableReferenceMedia.some(item => item.status === "error")) {
      toast.error("Remove failed supported reference materials before generating.")
      return
    }

    setIsGenerating(true)
    try {
      const hasReferenceMaterials = usableReferenceMedia.length > 0
      const resolvedGenerationMode =
        mediaType === "video"
          ? hasReferenceMaterials
            ? (effectiveVideoInputMode?.generationMode ?? "image_to_video")
            : "text_to_video"
          : usableReferenceImages.length > 0
            ? "image_to_image"
            : "text_to_image"
      const requestBody: Record<string, unknown> = {
        prompt,
        model: selectedModel,
        provider: selectedModelInfo?.provider,
        media_type: mediaType,
        generation_mode: resolvedGenerationMode,
        ...normalizedModelOptions,
      }
      if (mediaType === "video" && hasReferenceMaterials && effectiveVideoInputMode) {
        requestBody.video_input_mode = effectiveVideoInputMode.id
      }

      if (currentSessionId) requestBody.sessionId = currentSessionId

      if (supportsNegativePrompt && negativePrompt) requestBody.negative_prompt = negativePrompt

      const frameOrder: Record<ReferenceMediaRole, number> = {
        start_frame: 0,
        end_frame: 1,
        reference: 2,
      }
      const orderedReferenceImages = usableReferenceImages
        .filter(image => image.status === "uploaded" && image.key)
        .sort(
          (left, right) =>
            frameOrder[left.role ?? "reference"] - frameOrder[right.role ?? "reference"]
        )
      const referenceImages = orderedReferenceImages.map(image => image.key as string)
      const referenceVideos = usableReferenceVideos
        .filter(item => item.status === "uploaded" && item.key)
        .map(item => item.key as string)
      const referenceAudios = usableReferenceAudios
        .filter(item => item.status === "uploaded" && item.key)
        .map(item => item.key as string)

      if (referenceImages.length > 0) {
        requestBody.reference_images = referenceImages
        requestBody.reference_image_roles = orderedReferenceImages.map(
          image => image.role ?? "reference"
        )
      }
      if (referenceVideos.length > 0) requestBody.reference_videos = referenceVideos
      if (referenceAudios.length > 0) requestBody.reference_audios = referenceAudios

      if (currentSessionId) {
        onGenerateStart?.(currentSessionId, prompt)
      }

      const data = await api.generate.create(
        requestBody as Parameters<typeof api.generate.create>[0]
      )
      submittedTaskId = data.taskId
      if (data.error) {
        trackEvent("generate_failed", {
          task_id: submittedTaskId ?? "not_created",
          model_id: selectedModel,
          provider: submittedTaskId ? "pending" : "not_assigned",
          failure_stage: "submission",
          error_type: classifyAnalyticsError(data.error),
        })
        toast.error(`ERROR: ${data.error}`)
        return
      }

      const returnedTaskId = data.taskId
      const returnedSessionId = data.sessionId || currentSessionId
      if (!returnedSessionId) {
        throw new Error("Generate API did not return a session ID")
      }

      const requestedOutputs = Math.max(
        1,
        (data.requestedCount ?? Number(normalizedModelOptions.num_images)) || 1
      )
      const isFirstGeneration = markGenerationStarted(user.userId)
      trackEvent("generate_start", {
        model_id: selectedModel,
        media_type: mediaType,
        credit_cost: requiredCredits,
        requested_outputs: requestedOutputs,
        reference_image_count: referenceImages.length,
        is_first_generation: isFirstGeneration,
        is_new_session: !currentSessionId,
        user_type: user.userType,
        credit_balance_bucket: getCreditBalanceBucket(availableCredits),
      })
      if (returnedTaskId) {
        rememberGenerationTask(returnedTaskId, {
          model_id: selectedModel,
          media_type: mediaType,
          credit_cost: requiredCredits,
          starting_credit_balance: availableCredits,
          requested_outputs: requestedOutputs,
          reference_image_count: referenceImages.length,
          is_first_generation: isFirstGeneration,
          started_at_ms: Date.now(),
          user_type: user.userType,
        })
      }

      setPrompt("")
      setUserPrompt("")
      setShowNegativePrompt(false)
      uploadedImages.forEach(image => URL.revokeObjectURL(image.previewUrl))
      setUploadedImages([])
      setHoveredImage(null)

      if (onGeneratePending && returnedTaskId) {
        onGeneratePending(returnedSessionId, returnedTaskId, prompt)
      } else {
        onGenerateSuccess?.(returnedSessionId, data)
      }
    } catch (error) {
      console.error("Generate error:", error)
      trackEvent("generate_failed", {
        task_id: submittedTaskId ?? "not_created",
        model_id: selectedModel,
        provider: submittedTaskId ? "pending" : "not_assigned",
        failure_stage: "submission",
        error_type: classifyAnalyticsError(error),
      })
      toast.error(
        `ERROR: ${getApiErrorMessage(error, "Failed to generate media. Please try again.")}`
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (referenceMention && referenceMentionAssets.length > 0) {
      if (event.key === "Escape") {
        event.preventDefault()
        setReferenceMention(null)
        return
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        const direction = event.key === "ArrowDown" ? 1 : -1
        setReferenceMention(current =>
          current
            ? {
                ...current,
                activeIndex:
                  (current.activeIndex + direction + referenceMentionAssets.length) %
                  referenceMentionAssets.length,
              }
            : null
        )
        return
      }
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing &&
        event.nativeEvent.keyCode !== 229
      ) {
        event.preventDefault()
        insertMentionAsset(
          referenceMentionAssets[
            Math.min(referenceMention.activeIndex, referenceMentionAssets.length - 1)
          ]
        )
        return
      }
    }

    if (event.key !== "Enter" || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return

    event.preventDefault()
    generateButtonRef.current?.click()
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
    const clampPromptHeight = (height: number) => {
      const rootFontSize =
        Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
      const maxHeight = Math.max(0, window.innerHeight - rootFontSize * 6.5)
      const minHeight = Math.min(PROMPT_MIN_HEIGHT_REM * rootFontSize, maxHeight)
      return Math.min(maxHeight, Math.max(minHeight, height))
    }
    let frameId: number | null = null
    let pendingWidth: number | null = null
    let pendingHeight: number | null = null

    const applyResize = () => {
      if (pendingWidth !== null) {
        shellRef.current?.style.setProperty("--prompt-w", `${clampPromptWidth(pendingWidth)}px`)
      }
      if (pendingHeight !== null) {
        panelRef.current?.style.setProperty("--prompt-h", `${clampPromptHeight(pendingHeight)}px`)
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

  const selectVideoInputMode = (mode: VideoInputMode) => {
    if (mode === "start_end_frame") {
      const frameLimit =
        selectedModelInfo?.videoInputModes?.find(item => item.id === mode)?.imageCount ?? 1
      let frameIndex = 0
      setUploadedImages(previous =>
        previous.map(item => {
          if ((item.kind ?? "image") !== "image" || frameIndex >= frameLimit) return item
          const role: ReferenceMediaRole = frameIndex === 0 ? "start_frame" : "end_frame"
          frameIndex += 1
          return { ...item, role }
        })
      )
    } else if (mode === "image_reference") {
      setUploadedImages(previous =>
        previous.map(item =>
          (item.kind ?? "image") === "image" ? { ...item, role: "reference" } : item
        )
      )
    }
    setHoveredImage(null)
    setVideoInputMode(mode)
    setShowVideoInputMenu(false)
  }

  const handleVideoInputMenuBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setShowVideoInputMenu(false)
  }

  const changeReferenceImageRole = (assetId: string, role: ReferenceMediaRole) => {
    const selectedAsset = uploadedImages.find(item => item.id === assetId)
    if (!selectedAsset) return
    if (
      role === "end_frame" &&
      !uploadedImages.some(item => item.id !== assetId && item.role === "start_frame")
    ) {
      toast.error("Add a start frame before using an end frame.")
      return
    }

    const previousRole = selectedAsset.role ?? "reference"
    const nextAssets = uploadedImages.map(item => {
      if (item.id === assetId) return { ...item, role }
      if (role !== "reference" && (item.kind ?? "image") === "image" && item.role === role) {
        return { ...item, role: previousRole }
      }
      return item
    })

    const hasVideoOrAudioReference = nextAssets.some(
      item => item.kind === "video" || item.kind === "audio"
    )
    const hasImageReference = nextAssets.some(
      item => (item.kind ?? "image") === "image" && (item.role ?? "reference") === "reference"
    )
    const nextMode = hasVideoOrAudioReference
      ? (selectedModelInfo?.videoInputModes?.find(mode => mode.id === "video_reference") ??
        selectedModelInfo?.videoInputModes?.find(mode => mode.id === "image_reference"))
      : hasImageReference
        ? selectedModelInfo?.videoInputModes?.find(mode => mode.id === "image_reference")
        : selectedModelInfo?.videoInputModes?.find(mode => mode.id === "start_end_frame")

    setUploadedImages(nextAssets)
    if (nextMode) setVideoInputMode(nextMode.id)
  }

  const getReferenceTag = (asset: UploadedImage) => {
    const kind = asset.kind ?? "image"
    const sameKind = uploadedImages.filter(
      item => item.status === "uploaded" && (item.kind ?? "image") === kind
    )
    const index = sameKind.findIndex(item => item.id === asset.id) + 1
    const apiIndex = Math.max(1, index)
    return selectedVideoInputMode?.referenceTagStyle === "character" && kind === "image"
      ? `character${apiIndex}`
      : `@${kind}${apiIndex}`
  }

  const mentionableReferenceAssets = isSeedanceModel
    ? uploadedImages.filter(
        item => item.status === "uploaded" && (item.role ?? "reference") === "reference"
      )
    : []
  const referenceMentionAssets = referenceMention
    ? mentionableReferenceAssets.filter(asset =>
        getReferenceTag(asset).slice(1).toLowerCase().startsWith(referenceMention.query)
      )
    : []

  const insertMentionAsset = (asset: UploadedImage) => {
    if (!referenceMention) return

    const editor = inputRef.current
    const currentPrompt = editor ? getPromptEditorValue(editor) : prompt
    const tag = getReferenceTag(asset)
    const needsTrailingSpace =
      referenceMention.end >= currentPrompt.length ||
      !/\s/.test(currentPrompt[referenceMention.end] ?? "")
    const trailingSpace = needsTrailingSpace ? " " : ""
    const nextPrompt = clampPrompt(
      `${currentPrompt.slice(0, referenceMention.start)}${tag}${trailingSpace}${currentPrompt.slice(
        referenceMention.end
      )}`,
      promptInputMaxLength
    )
    const cursor = Math.min(
      nextPrompt.length,
      referenceMention.start + tag.length + trailingSpace.length
    )

    setPrompt(nextPrompt)
    setUserPrompt(nextPrompt)
    setReferenceMention(null)
    requestAnimationFrame(() => {
      if (!editor) return
      editor.focus()
      setPromptEditorCaretOffset(editor, cursor)
    })
  }

  const referenceMentionMenu =
    referenceMention && referenceMentionAssets.length > 0 ? (
      <div
        className="liquid-reference-mention-menu"
        role="listbox"
        aria-label="Reference assets"
        style={{
          position: "fixed",
          left: Math.min(
            Math.max(8, referenceMention.anchorRect.left),
            typeof window === "undefined"
              ? referenceMention.anchorRect.left
              : window.innerWidth - 184
          ),
          ...(referenceMention.anchorRect.top > 140
            ? { bottom: window.innerHeight - referenceMention.anchorRect.top + 7 }
            : { top: referenceMention.anchorRect.bottom + 7 }),
          width: 176,
          zIndex: 10000,
        }}
        onMouseDown={event => event.preventDefault()}
      >
        {referenceMentionAssets.map((asset, index) => {
          const kind = asset.kind ?? "image"
          const tag = getReferenceTag(asset)
          return (
            <button
              key={asset.id}
              type="button"
              role="option"
              aria-selected={referenceMention.activeIndex === index}
              className={referenceMention.activeIndex === index ? "is-active" : ""}
              onMouseEnter={() =>
                setReferenceMention(current =>
                  current ? { ...current, activeIndex: index } : null
                )
              }
              onClick={() => insertMentionAsset(asset)}
            >
              <span className="liquid-reference-mention-menu__preview">
                {kind === "image" ? (
                  <img src={asset.previewUrl} alt="" onError={requestReferenceMediaRefresh} />
                ) : kind === "video" ? (
                  <video src={asset.previewUrl} muted onError={requestReferenceMediaRefresh} />
                ) : (
                  <AudioLines className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <span>{tag}</span>
            </button>
          )
        })}
      </div>
    ) : null

  const renderReferenceAsset = (asset: UploadedImage) => {
    const kind = asset.kind ?? "image"
    const tag = getReferenceTag(asset)
    const isTaggable =
      mediaType === "video" &&
      videoInputMode !== "start_end_frame" &&
      asset.status === "uploaded" &&
      supportsAtReferenceTags &&
      (asset.role ?? "reference") === "reference"
    const startEndMode = selectedModelInfo?.videoInputModes?.find(
      mode => mode.id === "start_end_frame"
    )
    const hasImageReferenceMode = selectedModelInfo?.videoInputModes?.some(
      mode => mode.id === "image_reference"
    )
    const roleOptions: ReferenceRoleOption[] =
      mediaType === "video" && kind === "image"
        ? [
            ...(startEndMode ? [{ value: "start_frame" as const, label: "Start Frame" }] : []),
            ...(startEndMode && (startEndMode.imageCount ?? 1) > 1
              ? [{ value: "end_frame" as const, label: "End Frame" }]
              : []),
            ...(hasImageReferenceMode
              ? [{ value: "reference" as const, label: "Image Reference" }]
              : []),
          ]
        : []
    const currentRole = asset.role ?? "reference"
    const roleLabel =
      kind === "video"
        ? "Video Reference"
        : kind === "audio"
          ? "Audio Reference"
          : currentRole === "start_frame"
            ? "Start Frame"
            : currentRole === "end_frame"
              ? "End Frame"
              : "Image Reference"

    return (
      <div key={asset.id} className="liquid-reference-asset group">
        <button
          type="button"
          className="liquid-reference-asset__preview"
          onClick={() => isTaggable && insertReferenceTag(tag)}
          onMouseEnter={event => {
            if (kind !== "image") return
            setHoveredImage({
              url: asset.previewUrl,
              rect: event.currentTarget.getBoundingClientRect(),
            })
          }}
          onMouseLeave={() => setHoveredImage(null)}
          aria-label={isTaggable ? `Insert ${tag} into prompt` : asset.role?.replace("_", " ")}
        >
          {kind === "image" ? (
            <img
              src={asset.previewUrl}
              alt=""
              className="liquid-upload-preview"
              onError={requestReferenceMediaRefresh}
            />
          ) : kind === "video" ? (
            <video
              src={asset.previewUrl}
              className="liquid-upload-preview"
              muted
              onError={requestReferenceMediaRefresh}
            />
          ) : (
            <span className="liquid-reference-asset__audio">
              <AudioLines className="size-5" />
            </span>
          )}
          {asset.status !== "uploaded" && (
            <span className="absolute inset-0 grid place-items-center rounded-xl bg-base-300/70">
              {asset.status === "uploading" && <Loader2 className="size-4 animate-spin" />}
            </span>
          )}
        </button>
        <div className="liquid-reference-asset__meta">
          <button
            type="button"
            onClick={() => isTaggable && insertReferenceTag(tag)}
            className="liquid-reference-asset__tag"
            disabled={!isTaggable}
          >
            {tag}
          </button>
          {roleOptions.length > 1 ? (
            <ReferenceRoleSelect
              assetId={asset.id}
              value={currentRole}
              options={roleOptions}
              onChange={changeReferenceImageRole}
            />
          ) : (
            <span className="liquid-reference-asset__role-label">{roleLabel}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeImage(asset.id)}
          className="liquid-reference-asset__remove"
          aria-label={`Remove ${kind}`}
        >
          <X className="size-3" />
        </button>
      </div>
    )
  }

  if (shouldHide) {
    return null
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
            {(selectedModelInfo?.supportsImage ||
              (selectedModelInfo?.videoInputModes?.length ?? 0) > 0 ||
              uploadedImages.length > 0) && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={referenceImageConstraints?.mimeTypes.join(",") ?? REFERENCE_IMAGE_ACCEPT}
                  multiple={mediaType !== "video" || videoInputMode !== "start_end_frame"}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept={
                    referenceMediaConstraints?.video.mimeTypes.join(",") ?? REFERENCE_VIDEO_ACCEPT
                  }
                  multiple
                  className="hidden"
                  onChange={handleMediaUpload("video")}
                />
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept={
                    referenceMediaConstraints?.audio.mimeTypes.join(",") ?? REFERENCE_AUDIO_ACCEPT
                  }
                  multiple
                  className="hidden"
                  onChange={handleMediaUpload("audio")}
                />

                {mediaType === "image" ? (
                  <div className="liquid-prompt-upload-row">
                    {selectedModelInfo?.supportsImage && (
                      <button
                        type="button"
                        onClick={() => openImageUpload()}
                        className="btn btn-ghost btn-square liquid-icon-button flex-shrink-0"
                        aria-label="Add reference image"
                      >
                        <ImagePlus className="size-5" />
                      </button>
                    )}
                    {uploadedImages.length > 0 && (
                      <div className="liquid-upload-images-scroll">
                        {uploadedImages.map(renderReferenceAsset)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="liquid-video-input">
                    {(selectedModelInfo?.videoInputModes?.length ?? 0) > 0 && (
                      <div className="liquid-video-input__toolbar">
                        <div className="relative" onBlur={handleVideoInputMenuBlur}>
                          <button
                            ref={videoInputMenuTriggerRef}
                            type="button"
                            onClick={() => setShowVideoInputMenu(value => !value)}
                            className="btn btn-ghost btn-square liquid-icon-button"
                            aria-label="Add video input material"
                            aria-expanded={showVideoInputMenu}
                          >
                            <Plus className="size-5" />
                          </button>
                          {showVideoInputMenu && (
                            <div
                              ref={videoInputMenuRef}
                              className={`liquid-video-input-menu is-${videoInputMenuPlacement}`}
                              role="menu"
                            >
                              {selectedModelInfo?.videoInputModes?.map(mode => (
                                <button
                                  key={mode.id}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => selectVideoInputMode(mode.id)}
                                  className={videoInputMode === mode.id ? "is-active" : ""}
                                >
                                  {mode.id === "video_reference" ? (
                                    <Film className="size-5" />
                                  ) : (
                                    <Images className="size-5" />
                                  )}
                                  <span>{mode.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedVideoInputMode?.id === "start_end_frame" && (
                      <div className="liquid-frame-slots">
                        {(["start_frame", "end_frame"] as const)
                          .slice(0, selectedVideoInputMode.imageCount ?? 1)
                          .map(role => {
                            const asset = uploadedImages.find(item => item.role === role)
                            return asset ? (
                              renderReferenceAsset(asset)
                            ) : (
                              <button
                                key={role}
                                type="button"
                                onClick={() => openImageUpload(role)}
                                disabled={
                                  role === "end_frame" &&
                                  !uploadedImages.some(item => item.role === "start_frame")
                                }
                                className="liquid-frame-slot"
                              >
                                <ImagePlus className="size-5" />
                                <span>{role === "start_frame" ? "Start Frame" : "End Frame"}</span>
                              </button>
                            )
                          })}
                      </div>
                    )}

                    {selectedVideoInputMode && selectedVideoInputMode.id !== "start_end_frame" && (
                      <div className="liquid-reference-inputs">
                        <div className="liquid-reference-inputs__materials">
                          {uploadedImages.length > 0 && (
                            <div className="liquid-upload-images-scroll">
                              {uploadedImages.map(renderReferenceAsset)}
                            </div>
                          )}
                          <div className="liquid-reference-inputs__actions">
                            {(selectedVideoInputMode.imageCount ?? 0) > 0 && (
                              <button type="button" onClick={() => openImageUpload()}>
                                <ImagePlus className="size-4" />
                                Image Reference
                              </button>
                            )}
                            {(selectedVideoInputMode.videoCount ?? 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => videoFileInputRef.current?.click()}
                              >
                                <Film className="size-4" />
                                Video Reference
                              </button>
                            )}
                            {(selectedVideoInputMode.audioCount ?? 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => audioFileInputRef.current?.click()}
                              >
                                <AudioLines className="size-4" />
                                Audio Reference
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!selectedVideoInputMode && uploadedImages.length > 0 && (
                      <div className="liquid-upload-images-scroll">
                        {uploadedImages.map(renderReferenceAsset)}
                      </div>
                    )}
                  </div>
                )}
              </>
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
                    }}
                  >
                    <img
                      src={hoveredImage.url}
                      alt="Preview"
                      className="block"
                      style={{ maxWidth: 260, maxHeight: 260 }}
                      onError={requestReferenceMediaRefresh}
                    />
                  </div>
                </div>,
                document.body
              )}

            {referenceMentionMenu &&
              typeof document !== "undefined" &&
              createPortal(referenceMentionMenu, document.body)}

            <div className="liquid-prompt-input">
              <div
                ref={inputRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                onInput={handlePromptChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setReferenceMention(null)}
                aria-describedby="prompt-character-limit"
                aria-autocomplete={isSeedanceModel ? "list" : undefined}
                aria-expanded={isSeedanceModel ? Boolean(referenceMentionAssets.length) : undefined}
                aria-label={
                  isSeedanceModel
                    ? "Click a material tag to insert it into the prompt, for example @image1, @video1, or @audio1."
                    : mediaType === "video"
                      ? "Describe the video, camera movement, action, and sound…"
                      : t.aiToolkit?.promptPlaceholder || "Describe your image…"
                }
                data-placeholder={
                  isSeedanceModel
                    ? "Click a material tag to insert it into the prompt, for example @image1, @video1, or @audio1."
                    : mediaType === "video"
                      ? "Describe the video, camera movement, action, and sound…"
                      : t.aiToolkit?.promptPlaceholder || "Describe your image…"
                }
                className="textarea textarea-ghost liquid-prompt-textarea w-full text-base focus:outline-none"
              />
            </div>

            <div
              id="prompt-character-limit"
              className={`liquid-prompt-hint ${
                isPromptAtCharacterLimit ? "liquid-prompt-hint--limit" : ""
              }`}
              role={
                isPromptAtCharacterLimit || hasAudioOnlyReference || referenceSelectionError
                  ? "status"
                  : undefined
              }
            >
              <span>
                {hasAudioOnlyReference
                  ? "Audio requires at least one reference image or video."
                  : referenceSelectionError
                    ? referenceSelectionError
                    : isPromptOverCharacterLimit
                      ? (promptLimitError ?? `已超出 ${promptLimitText} 限制`)
                      : isPromptAtCharacterLimit
                        ? `已达到 ${promptLimitText} 限制`
                        : referenceUsageText}
              </span>
              <span className="liquid-prompt-hint__count">
                {promptCount.toLocaleString("en-US")} / {promptLimitText}
              </span>
            </div>
          </div>

          {showNegativePrompt && (
            <div className="mt-2">
              <textarea
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="What to avoid…"
                className="textarea textarea-ghost textarea-sm liquid-prompt-textarea w-full resize-none focus:outline-none"
                rows={2}
              />
            </div>
          )}

          <div className="liquid-prompt-controls flex items-center gap-2 overflow-visible">
            <div className="liquid-media-switch" role="group" aria-label="Content type">
              <button
                type="button"
                onClick={handleSelectImageMode}
                className={mediaType === "image" ? "is-active" : ""}
                aria-label="Image"
                aria-pressed={mediaType === "image"}
                title="Image"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleSelectVideoMode}
                className={mediaType === "video" ? "is-active" : ""}
                aria-label="Video"
                aria-pressed={mediaType === "video"}
                title="Video"
              >
                <Video className="size-4" aria-hidden="true" />
              </button>
            </div>

            <CustomSelect
              label="Models"
              options={modelSelectOptions}
              value={selectedModel}
              onChange={handleModelChange}
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

            <div className="liquid-controls-spacer" aria-hidden="true" />

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
              ref={generateButtonRef}
              onClick={handleGenerate}
              disabled={
                !prompt.trim() ||
                isGenerating ||
                hasInsufficientCredits ||
                hasAudioOnlyReference ||
                Boolean(referenceSelectionError)
              }
              title={
                hasAudioOnlyReference
                  ? "Add at least one reference image or video."
                  : (referenceSelectionError ?? undefined)
              }
              className={`btn liquid-generate-button ${
                hasInsufficientCredits ? "btn-disabled" : "btn-primary"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {t.aiToolkit?.generating || "Generating…"}
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
