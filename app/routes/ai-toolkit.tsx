import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import PromptArea from "~/components/PromptArea"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import { useGenerateStore } from "~/stores/generateStore"
import { api, type ApiToolkitShowcaseItem } from "~/lib/api"
import { AIToolkitSidebar } from "~/components/AIToolkitSidebar"

type ModelId = string

const SKELETON_SHOWCASE_ITEMS: ApiToolkitShowcaseItem[] = Array.from({ length: 15 }).map(
  (_, i) => ({
    id: `skeleton-${i}`,
    src: "",
    alt: "",
    prompt: "",
    model: "",
    aspectRatio: "",
    width: 0,
    height: 0,
  })
)

function getMasonryColumnCount(width: number) {
  if (width >= 1024) return 5
  if (width >= 768) return 4
  return 2
}

const MASONRY_TILE_HEIGHTS = [
  "14rem",
  "28rem",
  "20rem",
  "40rem",
  "16rem",
  "34rem",
  "22rem",
  "44rem",
  "18rem",
  "30rem",
  "24rem",
  "38rem",
]

function getMasonryTileHeight(columnIndex: number, itemIndex: number) {
  return MASONRY_TILE_HEIGHTS[(columnIndex * 3 + itemIndex * 2) % MASONRY_TILE_HEIGHTS.length]
}

function distributeMasonryItems(items: ApiToolkitShowcaseItem[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as ApiToolkitShowcaseItem[])
  items.forEach((item, index) => {
    columns[index % columnCount].push(item)
  })
  return columns
}

export default function AIToolkitPage() {
  const [showcaseItems, setShowcaseItems] = useState<ApiToolkitShowcaseItem[]>([])
  const [isShowcaseLoading, setIsShowcaseLoading] = useState(true)
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [masonryColumnCount, setMasonryColumnCount] = useState(5)
  const [currentSession, setCurrentSession] = useState<{ id: string; title: string } | null>(null)
  const [sessionHistory, setSessionHistory] = useState<
    {
      id: string
      title: string
      is_pinned: number
      preview_image: string | null
      created_at: number
      updated_at: number
    }[]
  >([])
  const [showSidebar, setShowSidebar] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [regeneratePrompt, setRegeneratePrompt] = useState("")
  const [regenerateNegativePrompt, setRegenerateNegativePrompt] = useState<string | undefined>()
  const sessionsFetchedRef = useRef(false)
  const navigate = useNavigate()

  const { user, token } = useUserStore()
  const { regenerateData, clearRegenerateData } = useGenerateStore()
  const {
    models,
    fetchModels,
    userSelectedModel,
    userModelOptions,
    setUserSelectedModel,
    setUserModelOptions,
    setUserPrompt,
  } = useModelStore()

  const selectedModel = userSelectedModel || (models.length > 0 ? models[0].id : "google/nano-banana-2")
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

  useEffect(() => {
    if (!regenerateData) return

    const nextOptions: Record<string, string> = {}
    setUserSelectedModel(regenerateData.model as ModelId)
    setUserPrompt(regenerateData.prompt)
    setRegeneratePrompt(regenerateData.prompt)
    setRegenerateNegativePrompt(regenerateData.negative_prompt ?? "")

    if (regenerateData.size) nextOptions.size = regenerateData.size
    if (regenerateData.quality) nextOptions.quality = regenerateData.quality
    if (regenerateData.style) nextOptions.style = regenerateData.style
    if (regenerateData.aspect_ratio) nextOptions.aspect_ratio = regenerateData.aspect_ratio
    if (regenerateData.resolution) nextOptions.resolution = regenerateData.resolution
    if (regenerateData.output_format) nextOptions.output_format = regenerateData.output_format
    if (regenerateData.num_images) nextOptions.num_images = String(regenerateData.num_images)
    if (regenerateData.google_search) nextOptions.google_search = regenerateData.google_search
    if (regenerateData.image_search) nextOptions.image_search = regenerateData.image_search
    if (regenerateData.background) nextOptions.background = regenerateData.background

    handleSetModelOptions(prev => ({ ...prev, ...nextOptions }))
    clearRegenerateData()
  }, [clearRegenerateData, regenerateData, setUserPrompt, setUserSelectedModel])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    let ignore = false

    api.aiToolkit
      .showcase()
      .then(data => {
        if (!ignore && data.items?.length) {
          setShowcaseItems(data.items)
        }
      })
      .catch(error => {
        console.error("Failed to load AI toolkit showcase:", error)
      })
      .finally(() => {
        if (!ignore) {
          setIsShowcaseLoading(false)
          // Delay PromptArea entrance until images start fading in
          setTimeout(() => {
            if (!ignore) setIsPromptVisible(true)
          }, 500)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const updateColumnCount = () => {
      setMasonryColumnCount(getMasonryColumnCount(window.innerWidth))
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  useEffect(() => {
    if (user && token && !sessionsFetchedRef.current) {
      sessionsFetchedRef.current = true
      api.sessions
        .list()
        .then(data => {
          if (data.sessions) {
            setSessionHistory(data.sessions)
          }
        })
        .catch(console.error)
    }
  }, [user, token])

  const handleCreateSession = () => {
    setCurrentSession(null)
  }

  const handleSelectSession = async (sessionId: string) => {
    navigate(`/session/${sessionId}`)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !token) return
    try {
      await api.sessions.delete(sessionId)
      setSessionHistory(prev => prev.filter(s => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const masonryColumns = useMemo(
    () => distributeMasonryItems(showcaseItems.length > 0 ? showcaseItems : SKELETON_SHOWCASE_ITEMS, masonryColumnCount),
    [masonryColumnCount, showcaseItems]
  )





  return (
    <div className="ai-toolkit-shell">
      <AIToolkitMasonryBackdrop
        columns={masonryColumns}
        isLoading={isShowcaseLoading}
        hasSidebar={!!user}
      />

      {user && (
        <AIToolkitSidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          sessionHistory={sessionHistory}
          currentSession={currentSession}
          editingSessionId={editingSessionId}
          setEditingSessionId={setEditingSessionId}
          setSessionHistory={setSessionHistory}
          setDeleteSessionId={setDeleteSessionId}
          handleCreateSession={handleCreateSession}
          handleSelectSession={handleSelectSession}
          editInputRef={editInputRef}
        />
      )}

      <main className={`ai-toolkit-stage ${user ? "ai-toolkit-stage--with-sidebar" : ""}`} />

      <div
        className={`ai-toolkit-prompt-dock ${user ? "ai-toolkit-prompt-dock--with-sidebar" : ""} ${isPromptVisible ? "is-visible" : ""}`}
      >
        <div className="ai-toolkit-prompt-dock__inner pointer-events-auto">
          <PromptArea
            models={models}
            selectedModel={selectedModel}
            onModelChange={setUserSelectedModel}
            modelOptions={modelOptions}
            onOptionsChange={handleSetModelOptions}
            className="ai-toolkit-prompt-area"
            initialPrompt={regeneratePrompt}
            initialNegativePrompt={regenerateNegativePrompt}
            onGenerateStart={() => {
              // Now we just wait on this page while generating, UI handles spinner
            }}
            onGenerateSuccess={(sessionId) => {
              navigate(`/session/${sessionId}`)
            }}
            onGeneratePending={(sessionId, taskId, prompt) => {
              navigate(`/session/${sessionId}?taskId=${taskId}`, {
                state: { prompt },
              })
            }}
          />
        </div>
      </div>


      {deleteSessionId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Session</h3>
            <p className="py-4">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteSessionId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => {
                  handleDeleteSession(deleteSessionId)
                  setDeleteSessionId(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteSessionId(null)} />
        </div>
      )}
    </div>
  )
}

function AIToolkitMasonryBackdrop({
  columns,
  isLoading,
  hasSidebar,
}: {
  columns: ApiToolkitShowcaseItem[][]
  isLoading: boolean
  hasSidebar: boolean
}) {
  return (
    <div
      className={`ai-toolkit-backdrop ${isLoading ? "is-loading" : ""} ${
        hasSidebar ? "ai-toolkit-backdrop--with-sidebar" : ""
      }`}
      aria-hidden="true"
    >
      <div className="ai-toolkit-masonry">
        {columns.map((column, columnIndex) => (
          <div className="ai-toolkit-masonry__column" key={columnIndex}>
            {column.map((item, itemIndex) => (
              <figure
                className="ai-toolkit-masonry__tile"
                key={item.id}
                style={{
                  "--tile-height": getMasonryTileHeight(columnIndex, itemIndex),
                  flexShrink: 0,
                } as React.CSSProperties}
              >
                {/* Skeleton placeholder — always rendered, fades out once image loads */}
                <div className="ai-toolkit-masonry__skeleton" aria-hidden="true" />
                {item.src && (
                  <img
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    onLoad={e => {
                      const tile = (e.currentTarget as HTMLImageElement).closest(
                        ".ai-toolkit-masonry__tile"
                      )
                      tile?.classList.add("is-loaded")
                    }}
                  />
                )}
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
