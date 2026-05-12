import { useState, useRef, useEffect, useMemo } from "react"
import { Toaster } from "sonner"
import { useNavigate } from "react-router"
import PromptArea from "~/components/PromptArea"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import { useGenerateStore } from "~/stores/generateStore"
import { api, type ApiToolkitShowcaseItem } from "~/lib/api"
import { AIToolkitSidebar } from "~/components/AIToolkitSidebar"

type ModelId = string

const BASE_FALLBACK_SHOWCASE_ITEMS: ApiToolkitShowcaseItem[] = [
  {
    id: "fallback-lake",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=720&q=82",
    alt: "Still lake beneath mountain ridges",
    prompt: "Quiet alpine lake at blue hour",
    model: "Seedream 5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "fallback-fashion",
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=82",
    alt: "Editorial fashion portrait in a studio",
    prompt: "High fashion studio portrait",
    model: "GPT Image 1.5",
    aspectRatio: "2 / 3",
    width: 720,
    height: 1080,
  },
  {
    id: "fallback-forest",
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=720&q=82",
    alt: "Mist in a green forest",
    prompt: "Misty forest path with soft moss",
    model: "Seedream 5",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "fallback-architecture",
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=720&q=82",
    alt: "Modern office tower facade",
    prompt: "Modern office facade with strong geometry",
    model: "Nano Banana 2",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "fallback-product",
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&q=82",
    alt: "Minimal watch product photo",
    prompt: "Minimal product photo on warm stone",
    model: "Nano Banana 2",
    aspectRatio: "1 / 1",
    width: 720,
    height: 720,
  },
  {
    id: "fallback-coast",
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=82",
    alt: "Coastal waves and cliffs",
    prompt: "Coastal cliff with white surf",
    model: "WAN 2.6",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
]

const FALLBACK_ASPECT_RATIOS = ["4 / 5", "3 / 4", "2 / 3", "3 / 5", "1 / 1", "4 / 5"]

const MASONRY_TILE_HEIGHTS = ["14rem", "28rem", "20rem", "40rem", "16rem", "34rem", "22rem", "44rem", "18rem", "30rem", "24rem", "38rem"]

const FALLBACK_SHOWCASE_ITEMS: ApiToolkitShowcaseItem[] = Array.from({ length: 15 }).flatMap(
  (_, repeatIndex) =>
    BASE_FALLBACK_SHOWCASE_ITEMS.map((item, itemIndex) => ({
      ...item,
      id: repeatIndex === 0 ? item.id : `${item.id}-${repeatIndex + 1}`,
      aspectRatio:
        FALLBACK_ASPECT_RATIOS[(itemIndex + repeatIndex) % FALLBACK_ASPECT_RATIOS.length],
    }))
)

function getMasonryColumnCount(width: number) {
  if (width >= 1024) return 5
  if (width >= 768) return 4
  return 2
}

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
  const [selectedModel, setSelectedModel] = useState<ModelId>("google/nano-banana-2")
  const [modelOptions, setModelOptions] = useState<Record<string, string>>({})
  const [showcaseItems, setShowcaseItems] =
    useState<ApiToolkitShowcaseItem[]>(FALLBACK_SHOWCASE_ITEMS)
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
  const [isNewSession, setIsNewSession] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const sessionsFetchedRef = useRef(false)
  const navigate = useNavigate()

  const { user, token } = useUserStore()
  const { regenerateData, clearRegenerateData } = useGenerateStore()
  const { models, fetchModels } = useModelStore()

  useEffect(() => {
    if (!regenerateData) return

    const nextOptions: Record<string, string> = {}
    setSelectedModel(regenerateData.model as ModelId)

    if (regenerateData.size) nextOptions.size = regenerateData.size
    if (regenerateData.quality) nextOptions.quality = regenerateData.quality
    if (regenerateData.style) nextOptions.style = regenerateData.style
    if (regenerateData.aspect_ratio) nextOptions.aspect_ratio = regenerateData.aspect_ratio
    if (regenerateData.resolution) nextOptions.resolution = regenerateData.resolution
    if (regenerateData.output_format) nextOptions.output_format = regenerateData.output_format
    if (regenerateData.num_images) nextOptions.num_images = String(regenerateData.num_images)

    setModelOptions(prev => ({ ...prev, ...nextOptions }))
    clearRegenerateData()
  }, [clearRegenerateData, regenerateData])

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
    setIsNewSession(true)
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
        setIsNewSession(false)
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const masonryColumns = useMemo(
    () => distributeMasonryItems(showcaseItems, masonryColumnCount),
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

      <main className={`ai-toolkit-stage ${user ? "ai-toolkit-stage--with-sidebar" : ""}`}>
        <div className={`ai-toolkit-hero-copy ${isNewSession ? "is-visible" : ""}`}>
          <h1>What will you create today?</h1>
          <p>Describe the image you want, then tune the model details below.</p>
        </div>
      </main>

      <div
        className={`ai-toolkit-prompt-dock ${user ? "ai-toolkit-prompt-dock--with-sidebar" : ""} ${isPromptVisible ? "is-visible" : ""}`}
      >
        <div className="ai-toolkit-prompt-dock__inner pointer-events-auto">
          <PromptArea
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            modelOptions={modelOptions}
            onOptionsChange={setModelOptions}
            className="ai-toolkit-prompt-area"
            onGenerateSuccess={() => setIsNewSession(false)}
          />
        </div>
      </div>
      <Toaster position="top-center" />

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
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
