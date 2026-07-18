import { useEffect, useMemo, useState } from "react"
import { Download, EyeOff, Film, Heart, Image as ImageIcon, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { api, type LibraryAsset } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { createNoIndexMeta } from "~/lib/seo"

export function meta() {
  return createNoIndexMeta("Library | tuziyo")
}

type KindFilter = "all" | "image" | "video" | "audio"

export default function LibraryPage() {
  const { user, isLoading: isUserLoading } = useUserStore()
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [kind, setKind] = useState<KindFilter>("all")
  const [search, setSearch] = useState("")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selected, setSelected] = useState<LibraryAsset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isUserLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    let ignore = false
    setLoading(true)
    const timeout = window.setTimeout(() => {
      api.assets
        .list({
          kind: kind === "all" ? undefined : kind,
          search: search.trim() || undefined,
          favorite: favoritesOnly || undefined,
        })
        .then(result => {
          if (!ignore) setAssets(result.assets)
        })
        .catch(
          error =>
            !ignore &&
            toast.error(error instanceof Error ? error.message : "Failed to load library")
        )
        .finally(() => !ignore && setLoading(false))
    }, 180)
    return () => {
      ignore = true
      window.clearTimeout(timeout)
    }
  }, [favoritesOnly, isUserLoading, kind, search, user])

  const counts = useMemo(
    () => ({
      image: assets.filter(asset => asset.kind === "image").length,
      video: assets.filter(asset => asset.kind === "video").length,
    }),
    [assets]
  )

  const updateAsset = async (
    asset: LibraryAsset,
    data: { is_favorite?: boolean; is_hidden?: boolean }
  ) => {
    const result = await api.assets.update(asset.id, data)
    setAssets(previous => previous.map(item => (item.id === asset.id ? result.asset : item)))
    setSelected(current => (current?.id === asset.id ? result.asset : current))
  }

  const deleteAsset = async (asset: LibraryAsset) => {
    await api.assets.delete(asset.id)
    setAssets(previous => previous.filter(item => item.id !== asset.id))
    setSelected(null)
    toast.success("Asset removed from Library")
  }

  const downloadAsset = async (asset: LibraryAsset) => {
    const { url } = await api.assets.getDownloadUrl(asset.id)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = asset.name
    anchor.target = "_blank"
    anchor.rel = "noreferrer"
    anchor.click()
  }

  if (!isUserLoading && !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Your creative library</h1>
          <p className="mt-3 text-white/50">Sign in to view generated images and videos.</p>
          <button
            className="btn btn-primary mt-6 rounded-full px-8"
            onClick={() => window.dispatchEvent(new CustomEvent("openLoginModal"))}
          >
            Sign in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#08090c] px-5 pb-16 pt-28 text-white md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300">
              Workspace
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Library</h1>
            <p className="mt-2 text-sm text-white/45">
              Every generated asset, ready for reuse in Studio.
            </p>
          </div>
          <label className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 focus-within:border-white/30">
            <Search className="size-4 text-white/35" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search prompt, model, or asset name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 py-6">
          {(["all", "image", "video", "audio"] as KindFilter[]).map(value => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`rounded-full px-4 py-2 text-sm capitalize transition ${kind === value ? "bg-white text-black" : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              {value}
              {value === "image" && counts.image
                ? ` ${counts.image}`
                : value === "video" && counts.video
                  ? ` ${counts.video}`
                  : ""}
            </button>
          ))}
          <button
            onClick={() => setFavoritesOnly(value => !value)}
            className={`ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${favoritesOnly ? "bg-rose-400 text-black" : "bg-white/[0.06] text-white/60 hover:text-white"}`}
          >
            <Heart className={`size-4 ${favoritesOnly ? "fill-current" : ""}`} /> Favorites
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="skeleton aspect-[4/5] rounded-2xl opacity-20" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="grid min-h-[45vh] place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-center">
            <div>
              <Film className="mx-auto size-10 text-white/20" />
              <p className="mt-4 text-lg font-medium">No matching assets</p>
              <p className="mt-1 text-sm text-white/40">
                Generate something in AI Toolkit and it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets.map(asset => (
              <article
                key={asset.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111319] transition hover:-translate-y-0.5 hover:border-white/25"
              >
                <button
                  onClick={() => setSelected(asset)}
                  className="relative block aspect-[4/5] w-full overflow-hidden bg-black text-left"
                >
                  {asset.kind === "video" && asset.display_url ? (
                    <video
                      src={asset.display_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="size-full object-cover"
                    />
                  ) : asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.name}
                      className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="grid size-full place-items-center">
                      <ImageIcon className="size-8 text-white/20" />
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                    {asset.kind}
                  </span>
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      void updateAsset(asset, { is_favorite: !asset.is_favorite })
                    }}
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/65 backdrop-blur hover:bg-black"
                  >
                    <Heart
                      className={`size-4 ${asset.is_favorite ? "fill-rose-400 text-rose-400" : "text-white"}`}
                    />
                  </button>
                </button>
                <div className="p-4">
                  <h2 className="truncate text-sm font-medium">{asset.name}</h2>
                  <p className="mt-1 truncate text-xs text-white/35">
                    {asset.model || asset.origin}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/85 p-4 backdrop-blur-xl"
          onClick={() => setSelected(null)}
        >
          <div
            className="grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#101218] shadow-2xl md:grid-cols-[1fr_360px]"
            onClick={event => event.stopPropagation()}
          >
            <div className="grid min-h-[50vh] place-items-center bg-black p-5">
              {selected.kind === "video" && selected.display_url ? (
                <video
                  src={selected.display_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[78vh] max-w-full"
                />
              ) : selected.display_url ? (
                <img
                  src={selected.display_url}
                  alt={selected.name}
                  className="max-h-[78vh] max-w-full object-contain"
                />
              ) : null}
            </div>
            <aside className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-300">
                    {selected.kind}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{selected.name}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="mt-6 max-h-48 overflow-y-auto text-sm leading-6 text-white/55">
                {selected.prompt || "No prompt metadata"}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-white/30">Model</dt>
                  <dd className="mt-1 truncate text-white/75">{selected.model || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/30">Created</dt>
                  <dd className="mt-1 text-white/75">
                    {new Date(selected.created_at * 1000).toLocaleDateString()}
                  </dd>
                </div>
                {selected.duration_ms ? (
                  <div>
                    <dt className="text-white/30">Duration</dt>
                    <dd className="mt-1 text-white/75">
                      {(selected.duration_ms / 1000).toFixed(0)} sec
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-white/30">Origin</dt>
                  <dd className="mt-1 capitalize text-white/75">{selected.origin}</dd>
                </div>
              </dl>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-8">
                <button onClick={() => void downloadAsset(selected)} className="btn rounded-full">
                  <Download className="size-4" />
                  Download
                </button>
                <button
                  onClick={() =>
                    void updateAsset(selected, { is_hidden: true }).then(() => {
                      setAssets(items => items.filter(item => item.id !== selected.id))
                      setSelected(null)
                    })
                  }
                  className="btn btn-ghost rounded-full"
                >
                  <EyeOff className="size-4" />
                  Hide
                </button>
                <button
                  onClick={() => void deleteAsset(selected)}
                  className="btn btn-ghost col-span-2 rounded-full text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" />
                  Remove from Library
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </main>
  )
}
