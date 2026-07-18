import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Download,
  Film,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { useParams } from "react-router"
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

  const refresh = async () => setData(await api.studio.getProject(id))
  useEffect(() => {
    void Promise.all([
      refresh(),
      api.assets.list({ limit: 100 }).then(result => setLibrary(result.assets)),
    ]).catch(error => toast.error(error.message))
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
    if (picker === "shot")
      await api.studio.createShot(id, {
        name: `Shot ${orderedShots.length + 1}`,
        prompt: asset.prompt || undefined,
        asset_id: asset.id,
      })
    if (picker === "frame")
      await api.studio.createFrame(id, {
        asset_id: asset.id,
        label: asset.name,
        frame_type: "storyboard",
      })
    if (picker === "entity")
      await api.studio.createEntity(id, {
        name: asset.name,
        description: asset.prompt || undefined,
        type: "character",
        asset_ids: [asset.id],
      })
    setPicker(null)
    await refresh()
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

  if (!data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090d] text-white">
        <Loader2 className="size-8 animate-spin text-violet-300" />
      </main>
    )

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#08090d] pt-20 text-white">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/10 px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">
            Studio Lite
          </p>
          <h1 className="truncate text-lg font-semibold">{data.project.name}</h1>
        </div>
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-white/45">
          {data.project.aspect_ratio}
        </span>
        <button
          disabled={exportProgress !== null || !orderedShots.length}
          onClick={() => void exportMp4()}
          className="btn btn-primary rounded-full px-5"
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
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr_300px]">
        <aside className="overflow-y-auto border-r border-white/10 bg-[#0d0f14] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Project bible
            </h2>
          </div>
          <button
            onClick={() => setPicker("entity")}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/12 px-3 py-3 text-sm text-white/45 hover:border-white/25 hover:text-white"
          >
            <Users className="size-4" />
            Add entity
          </button>
          <div className="mt-3 space-y-2">
            {data.entities.map(entity => (
              <div key={entity.id} className="rounded-xl bg-white/[0.05] p-3">
                <p className="text-sm font-medium">{entity.name}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                  {entity.type}
                </p>
              </div>
            ))}
          </div>
          <h2 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Frames
          </h2>
          <button
            onClick={() => setPicker("frame")}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/12 px-3 py-3 text-sm text-white/45 hover:text-white"
          >
            <ImageIcon className="size-4" />
            Add frame
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {data.frames.map(frame => (
              <div key={frame.id} className="aspect-square overflow-hidden rounded-lg bg-black">
                {frame.asset.thumbnail_url && (
                  <img src={frame.asset.thumbnail_url} alt="" className="size-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </aside>
        <section className="flex min-w-0 flex-col bg-black/40">
          <div className="grid min-h-0 flex-1 place-items-center p-8">
            {activeAsset?.display_url ? (
              <video
                key={activeAsset.id}
                src={activeAsset.display_url}
                controls
                autoPlay
                playsInline
                className="max-h-full max-w-full rounded-xl shadow-2xl"
              />
            ) : (
              <div className="text-center text-white/30">
                <Film className="mx-auto size-14" />
                <p className="mt-4">Add a video from Library to create the first shot.</p>
                <button
                  onClick={() => setPicker("shot")}
                  className="btn btn-primary mt-5 rounded-full"
                >
                  <Plus className="size-4" />
                  Add shot
                </button>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#0b0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Sequence · {orderedShots.length} shots
              </h2>
              <button onClick={() => setPicker("shot")} className="btn btn-xs rounded-full">
                <Plus className="size-3" />
                Add
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {orderedShots.map((shot, index) => {
                const asset = versionFor(shot.id)?.asset
                return (
                  <button
                    key={shot.id}
                    onClick={() => setActiveShotId(shot.id)}
                    className={`group relative w-36 shrink-0 overflow-hidden rounded-xl border text-left ${activeShot?.id === shot.id ? "border-violet-400" : "border-white/10"}`}
                  >
                    <div className="aspect-video bg-black">
                      {asset?.display_url && (
                        <video
                          src={asset.display_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium">
                        {index + 1}. {shot.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/30">
                        {shot.duration_ms ? `${shot.duration_ms / 1000}s` : shot.status}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
        <aside className="overflow-y-auto border-l border-white/10 bg-[#0d0f14] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            <Sparkles className="size-3.5" />
            Shot inspector
          </div>
          {activeShot ? (
            <div className="mt-6">
              <h2 className="text-xl font-semibold">{activeShot.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/45">
                {activeShot.prompt || "No prompt metadata for this shot."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  onClick={() => void moveShot(activeShot.id, -1)}
                  className="btn btn-ghost rounded-full"
                >
                  <ArrowUp className="size-4" />
                  Earlier
                </button>
                <button
                  onClick={() => void moveShot(activeShot.id, 1)}
                  className="btn btn-ghost rounded-full"
                >
                  <ArrowDown className="size-4" />
                  Later
                </button>
              </div>
              <button onClick={() => setPicker("shot")} className="btn mt-3 w-full rounded-full">
                <Plus className="size-4" />
                Add another shot
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/35">Select a shot to inspect it.</p>
          )}
        </aside>
      </div>
      {picker && (
        <div
          className="fixed inset-0 z-[220] bg-black/75 p-8 backdrop-blur-xl"
          onClick={() => setPicker(null)}
        >
          <div
            className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11131a]"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Library picker
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Choose {picker === "shot" ? "a video" : "an asset"}
                </h2>
              </div>
              <button
                onClick={() => setPicker(null)}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="grid flex-1 grid-cols-3 gap-4 overflow-y-auto p-5 md:grid-cols-5">
              {library
                .filter(asset =>
                  picker === "shot" ? asset.kind === "video" : asset.kind === "image"
                )
                .map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => void addAsset(asset)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-black text-left hover:border-violet-400"
                  >
                    <div className="aspect-[4/5]">
                      {asset.kind === "video" && asset.display_url ? (
                        <video
                          src={asset.display_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="size-full object-cover"
                        />
                      ) : asset.thumbnail_url ? (
                        <img src={asset.thumbnail_url} alt="" className="size-full object-cover" />
                      ) : null}
                    </div>
                    <p className="truncate p-3 text-xs">{asset.name}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
