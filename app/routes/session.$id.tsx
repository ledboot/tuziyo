import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router"
import { toast } from "sonner"
import { api } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import ImageDetailModal from "~/components/ImageDetailModal"
import PromptArea, { type UploadedImage } from "~/components/PromptArea"
import { AIToolkitSidebar } from "~/components/AIToolkitSidebar"
import MessageImageCard from "~/components/MessageImageCard"
import {
  mergeTaskOutputs,
  type GeneratedImageMessage,
  type GeneratedImageOutput,
} from "~/types/generatedImage"
import { createNoIndexMeta } from "~/lib/seo"
import {
  classifyAnalyticsError,
  getCreditBalanceBucket,
  getGenerationTaskContext,
  trackFreeCreditProgress,
  trackGenerationOutcomeOnce,
} from "~/lib/analytics"

export function meta() {
  return createNoIndexMeta("Creative Session | tuziyo")
}

type ModelId = string

type Message = GeneratedImageMessage

const TASK_POLL_INTERVAL_MS = 5_000
const TASK_POLL_TIMEOUT_MS = 20 * 60 * 1_000

interface Session {
  id: string
  title: string
  is_pinned: number
  preview_image: string | null
  created_at: number
  updated_at: number
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const generationState = location.state as any
  const {
    user,
    token,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    setCredits,
  } = useUserStore()

  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{
    message: Message
    outputId: string
  } | null>(null)
  const [activeOutputIds, setActiveOutputIds] = useState<Record<string, string>>({})
  const [recreatePrompt, setRecreatePrompt] = useState(
    generationState?.autoGenerate ? (generationState.prompt ?? "") : ""
  )
  const [recreateNegativePrompt, setRecreateNegativePrompt] = useState<string | undefined>()
  const [recreateVersion, setRecreateVersion] = useState(0)
  const [editImages] = useState<UploadedImage[]>(generationState?.images ?? [])
  const [editImagesVersion] = useState(0)

  // Sidebar state — required by AIToolkitSidebar
  const [showSidebar, setShowSidebar] = useState(false)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [isDeletingSession, setIsDeletingSession] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  const {
    models,
    fetchModels,
    userSelectedModel,
    userModelOptions,
    setUserSelectedModel,
    setUserModelOptions,
    setUserMediaType,
  } = useModelStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null)

  const selectedModel =
    userSelectedModel || (models.length > 0 ? models[0].id : "google/nano-banana-2")
  const modelOptions = userModelOptions || {}

  const handleSetModelOptions = (
    options: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    if (typeof options === "function") {
      setUserModelOptions(options(modelOptions))
    } else {
      setUserModelOptions(options)
    }
  }

  const fetchSessionData = async () => {
    if (!id || !user || !token) return
    try {
      const [sessionData, listData] = await Promise.all([api.sessions.get(id), api.sessions.list()])
      setSession(sessionData.session)
      setMessages(sessionData.messages as Message[])
      setAllSessions(listData.sessions as unknown as Session[])

      // Auto-resume polling if there are pending tasks
      if (sessionData.pendingTasks && sessionData.pendingTasks.length > 0) {
        const activeTask = sessionData.pendingTasks[0]
        setPollingTaskId(activeTask.id)
        setIsGenerating(true)
      }
    } catch (error) {
      console.error("Failed to load session:", error)
      toast.error("Failed to load session")
    }
  }

  // Extract taskId from URL search parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const urlTaskId = searchParams.get("taskId")
    if (urlTaskId && id) {
      setPollingTaskId(urlTaskId)
      setIsGenerating(true)
      const statePrompt = location.state?.prompt
      if (statePrompt) {
        setPendingPrompt(statePrompt)
      }
      // Strip taskId from the URL to keep it clean
      navigate(`/session/${id}`, { replace: true, state: location.state })
    }
  }, [location.search, id, navigate, location.state])

  // Poll for task status
  useEffect(() => {
    if (!pollingTaskId || !id) return

    let isSubscribed = true
    let intervalId: ReturnType<typeof setInterval> | null = null
    const pollingStartedAt = Date.now()

    const stopPollingAfterTimeout = () => {
      if (!isSubscribed) return

      isSubscribed = false
      if (intervalId) clearInterval(intervalId)
      setIsGenerating(false)
      setPendingPrompt(null)
      setPollingTaskId(null)
      toast.warning("Generation is taking longer than expected. Polling has stopped.")
    }

    const checkStatus = async () => {
      if (Date.now() - pollingStartedAt >= TASK_POLL_TIMEOUT_MS) {
        stopPollingAfterTimeout()
        return
      }

      try {
        const res = await api.generate.getTaskStatus(pollingTaskId)
        if (!isSubscribed) return

        if (res.outputs?.length) {
          setMessages(previous => mergeTaskOutputs(previous, res.outputs as GeneratedImageOutput[]))
        }

        if (res.status === "completed") {
          const taskContext = getGenerationTaskContext(pollingTaskId)
          const creditsData = await api.credits.get().catch(() => null)
          if (creditsData) {
            setCredits(creditsData.credits.balance)
            if (user?.userType === "free") {
              trackFreeCreditProgress({
                userId: user.userId,
                totalGranted: creditsData.credits.total_purchased,
                totalUsed: creditsData.credits.total_used,
                balance: creditsData.credits.balance,
              })
            }
          }
          trackGenerationOutcomeOnce(pollingTaskId, "completed", {
            task_id: res.analytics?.task_id ?? pollingTaskId,
            model_id: taskContext?.model_id ?? res.analytics?.model ?? "unknown",
            provider: res.analytics?.provider ?? "unknown",
            media_type: taskContext?.media_type ?? "image",
            credit_cost: taskContext?.credit_cost,
            requested_outputs:
              taskContext?.requested_outputs ?? res.analytics?.requested_count ?? 1,
            completed_outputs: res.analytics?.completed_count ?? res.outputs?.length ?? 0,
            failed_outputs: res.analytics?.failed_count ?? 0,
            duration_seconds:
              res.analytics?.duration_seconds ??
              (taskContext ? Math.round((Date.now() - taskContext.started_at_ms) / 1000) : 0),
            is_first_generation: taskContext?.is_first_generation,
            remaining_credit_bucket: creditsData
              ? getCreditBalanceBucket(creditsData.credits.balance)
              : undefined,
          })
          setIsGenerating(false)
          setPendingPrompt(null)
          setPollingTaskId(null)
          toast.success("Generation completed!")
          await fetchSessionData()
        } else if (res.status === "failed") {
          const taskContext = getGenerationTaskContext(pollingTaskId)
          trackGenerationOutcomeOnce(pollingTaskId, "failed", {
            task_id: pollingTaskId,
            model_id: taskContext?.model_id ?? res.analytics?.model ?? "unknown",
            provider: res.analytics?.provider ?? "unknown",
            media_type: taskContext?.media_type ?? "image",
            failure_stage: "processing",
            error_type: classifyAnalyticsError(res.error),
            duration_seconds:
              res.analytics?.duration_seconds ??
              (taskContext ? Math.round((Date.now() - taskContext.started_at_ms) / 1000) : 0),
          })
          setIsGenerating(false)
          setPendingPrompt(null)
          setPollingTaskId(null)
          toast.error(res.error || "Generation failed")
          await fetchSessionData()
        }
      } catch (error) {
        console.error("Failed to poll task status:", error)
      }
    }

    intervalId = setInterval(checkStatus, TASK_POLL_INTERVAL_MS)
    const timeoutId = setTimeout(stopPollingAfterTimeout, TASK_POLL_TIMEOUT_MS)
    void checkStatus()

    return () => {
      isSubscribed = false
      if (intervalId) clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [pollingTaskId, id])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    if (isUserLoading || isUserFetching) {
      setLoading(true)
      return
    }

    if (!user || !token) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchSessionData().finally(() => setLoading(false))
    fetchModels()
  }, [id, user, token, isUserLoading, isUserFetching])

  const handleRecreate = (image: Message) => {
    const nextOptions: Record<string, string> = {}

    if (image.image_size) nextOptions.size = image.image_size
    if (image.quality) nextOptions.quality = image.quality
    if (image.style) nextOptions.style = image.style
    if (image.aspect_ratio) nextOptions.aspect_ratio = image.aspect_ratio
    if (image.resolution) nextOptions.resolution = image.resolution
    if (image.output_format) nextOptions.output_format = image.output_format
    if (image.num_images) nextOptions.num_images = String(image.num_images)
    if (image.google_search) nextOptions.google_search = "true"
    if (image.image_search) nextOptions.image_search = "true"
    if (image.duration) nextOptions.duration = String(image.duration)
    if (image.media_type === "video") {
      nextOptions.generate_audio = image.generate_audio ? "true" : "false"
    }

    setUserSelectedModel(image.model)
    setUserMediaType(image.media_type === "video" ? "video" : "image")
    setUserModelOptions({ ...modelOptions, ...nextOptions })
    setRecreatePrompt(image.prompt)
    setRecreateNegativePrompt(image.negative_prompt ?? "")
    setRecreateVersion(version => version + 1)
  }

  const handleSelectOutput = (messageId: string, outputId: string) => {
    setActiveOutputIds(previous => ({ ...previous, [messageId]: outputId }))
  }

  const handleOpenImage = (message: Message, outputId: string) => {
    handleSelectOutput(message.id, outputId)
    setSelectedImage({ message, outputId })
  }

  const handleFavoriteToggle = (outputId: string, isFavorited: boolean) => {
    const updateOutputs = (outputs: GeneratedImageOutput[]) =>
      outputs.map(output =>
        output.id === outputId ? { ...output, is_favorite: isFavorited ? 1 : 0 } : output
      )

    setMessages(previous =>
      previous.map(message => ({ ...message, outputs: updateOutputs(message.outputs) }))
    )
    setSelectedImage(previous =>
      previous
        ? {
            ...previous,
            message: {
              ...previous.message,
              outputs: updateOutputs(previous.message.outputs),
            },
          }
        : previous
    )
  }

  // Adapt allSessions → the shape AIToolkitSidebar expects
  const sidebarSessions = allSessions.map(s => ({
    id: s.id,
    title: s.title,
    lastModified: s.updated_at,
    pinned: Boolean(s.is_pinned),
    preview_image: s.preview_image ?? undefined,
  }))

  const currentSidebarSession = session
    ? {
        id: session.id,
        title: session.title,
        lastModified: session.updated_at,
        preview_image: session.preview_image ?? undefined,
      }
    : null

  const handleCreateSession = () => navigate("/ai-toolkit")
  const handleSelectSession = (sid: string) => navigate(`/session/${sid}`)

  const handleDeleteSession = async (sessionId: string) => {
    if (isDeletingSession) return

    setIsDeletingSession(true)
    try {
      await api.sessions.delete(sessionId)
      setAllSessions(previous => previous.filter(item => item.id !== sessionId))
      setDeleteSessionId(null)
      toast.success("Session deleted")
      if (sessionId === id) {
        navigate("/ai-toolkit", { replace: true })
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast.error("Failed to delete session")
    } finally {
      setIsDeletingSession(false)
    }
  }

  const images = messages.filter(message =>
    message.outputs.some(output => output.status !== "deleted")
  )

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <button onClick={() => navigate("/ai-toolkit")} className="btn btn-primary">
            Go to AI Toolkit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      {/* Sidebar — reuse AIToolkitSidebar component */}
      <AIToolkitSidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        sessionHistory={sidebarSessions}
        currentSession={currentSidebarSession}
        editingSessionId={editingSessionId}
        setEditingSessionId={setEditingSessionId}
        setSessionHistory={(updater: any) => {
          setAllSessions(prev => {
            const next =
              typeof updater === "function"
                ? updater(prev.map(s => ({ ...s, pinned: Boolean(s.is_pinned) })))
                : updater
            // merge updated fields back into allSessions shape
            return prev.map(s => {
              const updated = next.find((n: any) => n.id === s.id)
              if (!updated) return s
              return {
                ...s,
                title: updated.title ?? s.title,
                is_pinned: updated.is_pinned ?? (updated.pinned ? 1 : 0),
              }
            })
          })
        }}
        setDeleteSessionId={setDeleteSessionId}
        handleCreateSession={handleCreateSession}
        handleSelectSession={handleSelectSession}
        editInputRef={editInputRef}
      />

      {/* Main Content — offset for fixed header (4.5rem) and fixed sidebar (6rem) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-base-100 pl-24 pt-[4.5rem]">
        <div className="flex items-center gap-4 px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold truncate text-white">{session.title}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          {images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-base-content/60">
                <p className="text-lg">No media generated yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map(image => {
                return (
                  <MessageImageCard
                    key={image.id}
                    message={image}
                    activeOutputId={activeOutputIds[image.id]}
                    onSelectOutput={handleSelectOutput}
                    onOpen={handleOpenImage}
                  />
                )
              })}
            </div>
          )}
        </div>

        <ImageDetailModal
          image={selectedImage?.message ?? null}
          initialOutputId={selectedImage?.outputId ?? null}
          sessionTitle={session.title}
          onClose={() => setSelectedImage(null)}
          onRecreate={handleRecreate}
          onFavoriteToggle={handleFavoriteToggle}
        />
      </div>

      <div
        className={`ai-toolkit-prompt-dock ${user ? "ai-toolkit-prompt-dock--with-sidebar" : ""} is-visible`}
      >
        <div className="ai-toolkit-prompt-dock__inner pointer-events-auto">
          <PromptArea
            models={models}
            selectedModel={selectedModel}
            onModelChange={setUserSelectedModel}
            modelOptions={modelOptions}
            onOptionsChange={handleSetModelOptions}
            className="ai-toolkit-prompt-area"
            currentSessionId={id}
            initialPrompt={recreatePrompt}
            initialNegativePrompt={recreateNegativePrompt}
            initialPromptVersion={recreateVersion}
            initialImages={editImages}
            initialImagesVersion={editImagesVersion}
            autoGenerate={generationState?.autoGenerate}
            onGenerateStart={(sid, prompt) => {
              if (sid === id) {
                setIsGenerating(true)
                setPendingPrompt(prompt)
              }
            }}
            onGenerateSuccess={async (sid, data) => {
              if (sid === id) {
                setIsGenerating(false)
                setPendingPrompt(null)
                await fetchSessionData()
              }
            }}
            onGeneratePending={(sid, taskId, prompt) => {
              if (sid === id) {
                setPendingPrompt(prompt)
                setPollingTaskId(taskId)
                setIsGenerating(true)
                void fetchSessionData()
              }
            }}
          />
        </div>
      </div>

      {deleteSessionId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Delete Session</h3>
            <p className="py-4">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isDeletingSession}
                onClick={() => setDeleteSessionId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={isDeletingSession}
                onClick={() => void handleDeleteSession(deleteSessionId)}
              >
                {isDeletingSession ? <span className="loading loading-spinner loading-sm" /> : null}
                Delete
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close delete confirmation"
            disabled={isDeletingSession}
            onClick={() => setDeleteSessionId(null)}
          />
        </div>
      )}
    </div>
  )
}
