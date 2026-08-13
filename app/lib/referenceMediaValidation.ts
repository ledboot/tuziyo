import type { ReferenceImageConstraints, ReferenceMediaConstraints } from "./api"

export type ReferenceMediaKind = "image" | "video" | "audio"

export interface ReferenceMediaMetadata {
  width?: number
  height?: number
  durationSeconds?: number
  fps?: number
}

interface Mp4Box {
  type: string
  start: number
  end: number
  payloadStart: number
}

function readMp4Boxes(view: DataView, start: number, end: number): Mp4Box[] {
  const boxes: Mp4Box[] = []
  let offset = start

  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    )
    let headerSize = 8
    if (size === 1) {
      if (offset + 16 > end) break
      const largeSize = view.getBigUint64(offset + 8)
      if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) break
      size = Number(largeSize)
      headerSize = 16
    } else if (size === 0) {
      size = end - offset
    }
    if (size < headerSize || offset + size > end) break
    boxes.push({ type, start: offset, end: offset + size, payloadStart: offset + headerSize })
    offset += size
  }

  return boxes
}

function childBox(view: DataView, parent: Mp4Box, type: string) {
  return readMp4Boxes(view, parent.payloadStart, parent.end).find(box => box.type === type)
}

function readMp4FrameRate(buffer: ArrayBuffer): number | undefined {
  const view = new DataView(buffer)
  const moov = readMp4Boxes(view, 0, view.byteLength).find(box => box.type === "moov")
  if (!moov) return undefined

  for (const trak of readMp4Boxes(view, moov.payloadStart, moov.end).filter(
    box => box.type === "trak"
  )) {
    const mdia = childBox(view, trak, "mdia")
    if (!mdia) continue
    const hdlr = childBox(view, mdia, "hdlr")
    if (!hdlr || hdlr.payloadStart + 12 > hdlr.end) continue
    const handlerType = String.fromCharCode(
      view.getUint8(hdlr.payloadStart + 8),
      view.getUint8(hdlr.payloadStart + 9),
      view.getUint8(hdlr.payloadStart + 10),
      view.getUint8(hdlr.payloadStart + 11)
    )
    if (handlerType !== "vide") continue

    const mdhd = childBox(view, mdia, "mdhd")
    const minf = childBox(view, mdia, "minf")
    const stbl = minf ? childBox(view, minf, "stbl") : undefined
    const stts = stbl ? childBox(view, stbl, "stts") : undefined
    if (!mdhd || !stts) continue

    const version = view.getUint8(mdhd.payloadStart)
    const timescaleOffset = mdhd.payloadStart + (version === 1 ? 20 : 12)
    if (timescaleOffset + 4 > mdhd.end || stts.payloadStart + 8 > stts.end) continue
    const timescale = view.getUint32(timescaleOffset)
    const entryCount = view.getUint32(stts.payloadStart + 4)
    let entryOffset = stts.payloadStart + 8
    let sampleCount = 0
    let durationTicks = 0
    for (let index = 0; index < entryCount && entryOffset + 8 <= stts.end; index += 1) {
      const count = view.getUint32(entryOffset)
      const delta = view.getUint32(entryOffset + 4)
      sampleCount += count
      durationTicks += count * delta
      entryOffset += 8
    }
    if (timescale > 0 && durationTicks > 0) {
      return sampleCount / (durationTicks / timescale)
    }
  }

  return undefined
}

function loadMediaMetadata(file: File, kind: "video" | "audio") {
  return new Promise<ReferenceMediaMetadata>((resolve, reject) => {
    const element = document.createElement(kind)
    const url = URL.createObjectURL(file)
    const cleanup = () => {
      element.removeAttribute("src")
      element.load()
      URL.revokeObjectURL(url)
    }
    element.preload = "metadata"
    element.onloadedmetadata = () => {
      const metadata: ReferenceMediaMetadata = {
        durationSeconds: element.duration,
      }
      if (kind === "video") {
        const video = element as HTMLVideoElement
        metadata.width = video.videoWidth
        metadata.height = video.videoHeight
      }
      cleanup()
      resolve(metadata)
    }
    element.onerror = () => {
      cleanup()
      reject(new Error(`Unable to read reference ${kind} metadata.`))
    }
    element.src = url
  })
}

export async function inspectReferenceMedia(
  file: File,
  kind: ReferenceMediaKind
): Promise<ReferenceMediaMetadata> {
  if (kind === "image") {
    const bitmap = await createImageBitmap(file)
    const metadata = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return metadata
  }

  const metadata = await loadMediaMetadata(file, kind)
  if (kind === "video") {
    metadata.fps = readMp4FrameRate(await file.arrayBuffer())
  }
  return metadata
}

function formatMegabytes(bytes: number) {
  return `${Math.floor(bytes / 1_000_000)}MB`
}

export function validateReferenceFile(
  file: File,
  kind: ReferenceMediaKind,
  metadata: ReferenceMediaMetadata,
  constraints: ReferenceMediaConstraints
): string | null {
  const rule = constraints[kind]
  if (!rule.mimeTypes.includes(file.type)) {
    return `Unsupported reference ${kind} format.`
  }
  if (file.size > rule.maxBytes) {
    return `Reference ${kind} must not exceed ${formatMegabytes(rule.maxBytes)}.`
  }

  if (kind === "audio") {
    const audioRule = constraints.audio
    const duration = metadata.durationSeconds
    if (!Number.isFinite(duration)) return "Unable to read reference audio duration."
    if (duration! < audioRule.minDurationSeconds || duration! > audioRule.maxDurationSeconds) {
      return `Reference audio duration must be ${audioRule.minDurationSeconds}–${audioRule.maxDurationSeconds} seconds.`
    }
    return null
  }

  const visualRule = kind === "video" ? constraints.video : constraints.image
  const visualError = validateReferenceImage(file, metadata, visualRule, kind)
  if (visualError) return visualError

  const { width, height } = metadata as Required<Pick<ReferenceMediaMetadata, "width" | "height">>

  if (kind === "video") {
    const videoRule = constraints.video
    const duration = metadata.durationSeconds
    const pixels = width * height
    if (!Number.isFinite(duration)) return "Unable to read reference video duration."
    if (duration! < videoRule.minDurationSeconds || duration! > videoRule.maxDurationSeconds) {
      return `Reference video duration must be ${videoRule.minDurationSeconds}–${videoRule.maxDurationSeconds} seconds.`
    }
    if (pixels < videoRule.minFramePixels || pixels > videoRule.maxFramePixels) {
      return `Reference video frame pixels must be ${videoRule.minFramePixels.toLocaleString("en-US")}–${videoRule.maxFramePixels.toLocaleString("en-US")}.`
    }
    if (!Number.isFinite(metadata.fps)) return "Unable to read reference video frame rate."
    if (metadata.fps! < videoRule.minFps || metadata.fps! > videoRule.maxFps) {
      return `Reference video frame rate must be ${videoRule.minFps}–${videoRule.maxFps} FPS.`
    }
  }

  return null
}

export function validateReferenceImage(
  file: Pick<File, "type" | "size">,
  metadata: ReferenceMediaMetadata,
  visualRule: ReferenceImageConstraints,
  kind: "image" | "video" = "image"
): string | null {
  if (!visualRule.mimeTypes.includes(file.type)) {
    return `Unsupported reference ${kind} format.`
  }
  if (file.size > visualRule.maxBytes) {
    return `Reference ${kind} must not exceed ${formatMegabytes(visualRule.maxBytes)}.`
  }
  const { width, height } = metadata
  if (!width || !height) return `Unable to read reference ${kind} dimensions.`
  const ratio = width / height
  if (
    width < visualRule.minWidth ||
    (visualRule.maxWidth !== undefined && width > visualRule.maxWidth) ||
    height < visualRule.minHeight ||
    (visualRule.maxHeight !== undefined && height > visualRule.maxHeight)
  ) {
    if (visualRule.maxWidth === undefined && visualRule.maxHeight === undefined) {
      return `Reference ${kind} width and height must each be at least ${visualRule.minWidth}px.`
    }
    return `Reference ${kind} width and height must each be ${visualRule.minWidth}–${visualRule.maxWidth}px.`
  }
  if (ratio < visualRule.minAspectRatio || ratio > visualRule.maxAspectRatio) {
    return `Reference ${kind} aspect ratio must be ${visualRule.minAspectRatio}–${visualRule.maxAspectRatio}.`
  }

  return null
}

export function validateReferenceSelection(
  items: Array<{
    kind?: ReferenceMediaKind
    size?: number
    durationSeconds?: number
    status: string
  }>,
  constraints?: ReferenceMediaConstraints
): string | null {
  if (!constraints) return null
  if (constraints.maxItems && items.length > constraints.maxItems) {
    return `Reference materials must not exceed ${constraints.maxItems} files in total.`
  }
  const uploaded = items.filter(item => item.status === "uploaded")
  const totalBytes = uploaded.reduce((sum, item) => sum + (item.size ?? 0), 0)
  if (totalBytes > constraints.totalMaxBytes) {
    return `Reference materials must not exceed ${formatMegabytes(constraints.totalMaxBytes)} in total.`
  }

  for (const kind of ["video", "audio"] as const) {
    const totalDuration = uploaded
      .filter(item => item.kind === kind)
      .reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0)
    if (totalDuration > constraints[kind].maxTotalDurationSeconds) {
      return `Total reference ${kind} duration must not exceed ${constraints[kind].maxTotalDurationSeconds} seconds.`
    }
  }
  return null
}
