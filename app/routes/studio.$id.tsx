import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Clapperboard,
  Download,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Video,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"
import { api, type LibraryAsset, type StudioProjectDetail } from "~/lib/api"
import { exportSequenceToMp4 } from "~/lib/studioExport"
import { createNoIndexMeta } from "~/lib/seo"

export function meta() {
  return createNoIndexMeta("Studio Project | tuziyo")
}

export default function StudioProjectPage() {
  const { id = "" } = useParams()
  const [data, setData] = useState<StudioProjectDetail | null>(null)
  const [library, setLibrary] = useState<LibraryAsset[]>([])
  const [picker, setPicker] = useState<"shot" | "frame" | "entity" | null>(null)
  const [activeShotId, setActiveShotId] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = async () => setData(await api.studio.getProject(id))

  useEffect(() => {
    setLoadError(null)
    void Promise.all([
      refresh(),
      api.assets.list({ limit: 100 }).then(result => setLibrary(result.assets)),
    ]).catch(error => {
      const message = error instanceof Error ? error.message : "Could not load this project"
      setLoadError(message)
      toast.error(message)
    })
  }, [id])

  const orderedShots = useMemo(() => {
    if (!data) return []
    return data.sequence
      .map(item => data.shots.find(shot => shot.id === item.shot_id))
      .filter(Boolean) as StudioProjectDetail["shots"]
  }, [data])

  const activeShot = orderedShots.find(shot => shot.id === activeShotId) || orderedShots[0]
  const versionFor = (shotId: string) =>
    data?.versions.find(
      version => version.id === data.shots.find(shot => shot.id === shotId)?.active_version_id
    )
  const activeAsset = activeShot ? versionFor(activeShot.id)?.asset : null

  const addAsset = async (asset: LibraryAsset) => {
    try {
      if (picker === "shot") {
        await api.studio.createShot(id, {
          name: `Shot ${orderedShots.length + 1}`,
          prompt: asset.prompt || undefined,
          asset_id: asset.id,
        })
      }
      if (picker === "frame") {
        await api.studio.createFrame(id, {
          asset_id: asset.id,
          label: asset.name,
          frame_type: "storyboard",
        })
      }
      if (picker === "entity") {
        await api.studio.createEntity(id, {
          name: asset.name,
          description: asset.prompt || undefined,
          type: "character",
          asset_ids: [asset.id],
        })
      }
      setPicker(null)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this asset")
    }
  }

  const moveShot = async (shotId: string, direction: -1 | 1) => {
    const ids = orderedShots.map(shot => shot.id)
    const index = ids.indexOf(shotId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    await api.studio.reorderSequence(id, ids)
    await refresh()
  }

  const exportMp4 = async () => {
    try {
      setExportProgress(0)
      const assets = orderedShots
        .map(shot => versionFor(shot.id)?.asset)
        .filter(asset => asset?.kind === "video") as LibraryAsset[]
      const blob = await exportSequenceToMp4(assets, setExportProgress)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${data?.project.name || "studio"}.mp4`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success("MP4 export complete")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setExportProgress(null)
    }
  }

  if (loadError) {
    return (
      <main className="studio-workbench studio-workbench-state">
        <Clapperboard className="size-8" />
        <h1>Project unavailable</h1>
        <p>{loadError}</p>
        <Link to="/studio/projects">Back to My Projects</Link>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="studio-workbench studio-workbench-state">
        <Loader2 className="size-8 animate-spin" aria-label="Loading project" />
      </main>
    )
  }

  return (
    <main className="studio-workbench">
      <header className="studio-workbench-header">
        <Link to="/studio/projects" className="studio-workbench-brand">
          <span>tuziyo</span> Studio <small>Beta</small>
        </Link>
        <Link to="/studio/projects" className="studio-workbench-project-switcher">
          {data.project.name}
          <ChevronDown className="size-4" />
        </Link>
        <div className="studio-workbench-header__actions">
          <Link to="/pricing">Pricing</Link>
          <span>{data.project.aspect_ratio}</span>
          <button
            type="button"
            disabled={exportProgress !== null || !orderedShots.length}
            onClick={() => void exportMp4()}
          >
            {exportProgress !== null ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {Math.round(exportProgress * 100)}%
              </>
            ) : (
              <>
                <Download className="size-4" />
                Export MP4
              </>
            )}
          </button>
        </div>
      </header>

      <div className="studio-workbench-body">
        <nav className="studio-workbench-rail" aria-label="Project tools">
          <button type="button" className="is-active" aria-label="Shots">
            <Video className="size-5" />
          </button>
          <span />
          <button type="button" onClick={() => setPicker("entity")} aria-label="Characters">
            <Users className="size-5" />
          </button>
          <button type="button" onClick={() => setPicker("frame")} aria-label="Reference frames">
            <ImageIcon className="size-5" />
          </button>
          <span />
          <button type="button" onClick={() => setPicker("shot")} aria-label="Add a shot">
            <Clapperboard className="size-5" />
          </button>
        </nav>

        <aside className="studio-directing-panel">
          <div className="studio-directing-toolbar">
            <Link to="/studio/projects" aria-label="Back to projects">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span>Sequence</span>
              <strong>{orderedShots.length} shots</strong>
            </div>
            <SlidersHorizontal className="size-4" />
          </div>

          <div className="studio-directing-tabs">
            <span>Framing</span>
            <button type="button">Directing</button>
          </div>

          <div className="studio-directing-context">
            <button
              type="button"
              onClick={() => setPicker("frame")}
              aria-label="Add reference frame"
            >
              <ImageIcon className="size-4" />
            </button>
            {data.entities.slice(0, 2).map(entity => (
              <span key={entity.id}>
                <Users className="size-3.5" />
                {entity.name}
              </span>
            ))}
            {data.frames.slice(0, 2).map(frame => (
              <span key={frame.id} className="is-image">
                {frame.asset.thumbnail_url ? (
                  <img src={frame.asset.thumbnail_url} alt="" />
                ) : (
                  <ImageIcon className="size-3.5" />
                )}
              </span>
            ))}
            <button
              type="button"
              onClick={() => setPicker("entity")}
              aria-label="Add project entity"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <section className="studio-directing-copy">
            <div>
              <Star className="size-4" />
              <span>{activeShot ? activeShot.name : "No active shot"}</span>
              <WandSparkles className="size-4" />
            </div>
            <p>
              {activeShot?.prompt ||
                "Choose a video from your Library to create a shot, then keep the visual direction beside the frame."}
            </p>
          </section>

          <div className="studio-directing-meta">
            <span>
              {activeShot?.duration_ms ? `${activeShot.duration_ms / 1000} sec` : "4 sec"}
            </span>
            <span>
              <Video className="size-3.5" />
              Motion
            </span>
            <span>
              <Volume2 className="size-3.5" />
              Auto Voice
            </span>
          </div>

          <div className="studio-directing-actions">
            <div>
              <button
                type="button"
                onClick={() => activeShot && void moveShot(activeShot.id, -1)}
                disabled={!activeShot}
              >
                <ArrowUp className="size-4" />
                Earlier
              </button>
              <button
                type="button"
                onClick={() => activeShot && void moveShot(activeShot.id, 1)}
                disabled={!activeShot}
              >
                <ArrowDown className="size-4" />
                Later
              </button>
            </div>
            <button type="button" onClick={() => setPicker("shot")} className="is-primary">
              <Plus className="size-5" />
              Add shot
            </button>
          </div>
        </aside>

        <section className="studio-monitor">
          <div className="studio-monitor-viewer">
            {activeAsset?.display_url ? (
              activeAsset.kind === "video" ? (
                <video
                  key={activeAsset.id}
                  src={activeAsset.display_url}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img src={activeAsset.display_url} alt={activeAsset.name} />
              )
            ) : (
              <div className="studio-monitor-empty">
                <Film className="size-10" />
                <h2>Build the first shot.</h2>
                <p>Add a video from your Library to start directing this sequence.</p>
                <button type="button" onClick={() => setPicker("shot")}>
                  <Plus className="size-4" />
                  Add shot
                </button>
              </div>
            )}
          </div>

          <div className="studio-monitor-timeline">
            <div className="studio-monitor-timeline__ticks">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
            <div className="studio-monitor-timeline__track">
              {orderedShots.length ? (
                orderedShots.map(shot => {
                  const asset = versionFor(shot.id)?.asset
                  return (
                    <button
                      key={shot.id}
                      type="button"
                      onClick={() => setActiveShotId(shot.id)}
                      className={activeShot?.id === shot.id ? "is-active" : ""}
                      aria-label={`Select ${shot.name}`}
                    >
                      {asset?.kind === "video" && asset.display_url ? (
                        <video src={asset.display_url} muted playsInline preload="metadata" />
                      ) : asset?.thumbnail_url ? (
                        <img src={asset.thumbnail_url} alt="" />
                      ) : (
                        <Film className="size-5" />
                      )}
                    </button>
                  )
                })
              ) : (
                <span className="studio-monitor-timeline__empty">
                  Your timeline will appear here.
                </span>
              )}
            </div>
          </div>

          <section className="studio-shots-folder">
            <header>
              <div>
                <FolderOpen className="size-4" />
                <strong>Shots</strong>
                <span>{orderedShots.length}</span>
              </div>
              <button type="button" onClick={() => setPicker("shot")}>
                <Plus className="size-4" />
                New Shot
              </button>
            </header>
            <div className="studio-shots-folder__list">
              {orderedShots.map((shot, index) => {
                const asset = versionFor(shot.id)?.asset
                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveShotId(shot.id)}
                    className={activeShot?.id === shot.id ? "is-active" : ""}
                  >
                    <div>
                      {asset?.kind === "video" && asset.display_url ? (
                        <video src={asset.display_url} muted playsInline preload="metadata" />
                      ) : asset?.thumbnail_url ? (
                        <img src={asset.thumbnail_url} alt="" />
                      ) : (
                        <Film className="size-6" />
                      )}
                    </div>
                    <span>{shot.name || `Shot ${index + 1}`}</span>
                    <small>{shot.duration_ms ? `${shot.duration_ms / 1000}s` : shot.status}</small>
                  </button>
                )
              })}
              <button type="button" onClick={() => setPicker("shot")} className="is-new">
                <Plus className="size-5" />
                <span>New Shot</span>
              </button>
            </div>
          </section>
        </section>
      </div>

      {picker && (
        <div className="studio-picker-backdrop" onMouseDown={() => setPicker(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-picker-title"
            className="studio-picker"
            onMouseDown={event => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Library picker</span>
                <h2 id="studio-picker-title">
                  Choose{" "}
                  {picker === "shot"
                    ? "a video"
                    : picker === "entity"
                      ? "a character reference"
                      : "a frame"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPicker(null)}
                aria-label="Close Library picker"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="studio-picker-grid">
              {library
                .filter(asset =>
                  picker === "shot" ? asset.kind === "video" : asset.kind === "image"
                )
                .map(asset => (
                  <button key={asset.id} type="button" onClick={() => void addAsset(asset)}>
                    <div>
                      {asset.kind === "video" && asset.display_url ? (
                        <video src={asset.display_url} muted playsInline preload="metadata" />
                      ) : asset.thumbnail_url ? (
                        <img src={asset.thumbnail_url} alt="" />
                      ) : (
                        <ImageIcon className="size-8" />
                      )}
                    </div>
                    <span>{asset.name}</span>
                  </button>
                ))}
              {!library.some(asset =>
                picker === "shot" ? asset.kind === "video" : asset.kind === "image"
              ) && (
                <div className="studio-picker-empty">
                  <FolderOpen className="size-7" />
                  <p>No compatible assets in your Library yet.</p>
                  <Link to="/ai-toolkit">Create assets in AI Toolkit</Link>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
