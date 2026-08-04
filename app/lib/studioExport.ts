import type { LibraryAsset } from "~/lib/api"

const FFMPEG_CORE_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm"

export async function exportSequenceToMp4(
  assets: LibraryAsset[],
  onProgress?: (progress: number) => void
) {
  if (!assets.length) throw new Error("Add at least one ready video shot before exporting")
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ])
  const ffmpeg = new FFmpeg()
  ffmpeg.on("progress", ({ progress }) => onProgress?.(Math.max(0, Math.min(1, progress))))
  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  })

  const fileNames: string[] = []
  for (const [index, asset] of assets.entries()) {
    if (!asset.display_url) continue
    const fileName = `shot-${String(index).padStart(3, "0")}.mp4`
    await ffmpeg.writeFile(fileName, await fetchFile(asset.display_url))
    fileNames.push(fileName)
  }
  if (!fileNames.length) throw new Error("The sequence has no downloadable video shots")
  await ffmpeg.writeFile("sequence.txt", fileNames.map(name => `file '${name}'`).join("\n"))
  const exitCode = await ffmpeg.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "sequence.txt",
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    "studio-export.mp4",
  ])
  if (exitCode !== 0) throw new Error("The selected shots use incompatible video codecs")
  const output = await ffmpeg.readFile("studio-export.mp4")
  ffmpeg.terminate()
  if (typeof output === "string") throw new Error("Unexpected renderer output")
  return new Blob([new Uint8Array(output).buffer], { type: "video/mp4" })
}
