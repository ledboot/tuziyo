import type { ReferenceAudioConstraints, ReferenceVideoConstraints } from "./types"

interface Mp4Box {
  type: string
  start: number
  end: number
  payloadStart: number
}

export interface VideoMetadata {
  width: number
  height: number
  durationSeconds: number
  fps: number
}

export interface AudioMetadata {
  durationSeconds: number
}

function readAscii(view: DataView, offset: number, length: number) {
  let value = ""
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index))
  }
  return value
}

function readMp4Boxes(view: DataView, start: number, end: number): Mp4Box[] {
  const boxes: Mp4Box[] = []
  let offset = start
  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    const type = readAscii(view, offset + 4, 4)
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

export function inspectReferenceVideo(buffer: ArrayBuffer): VideoMetadata | null {
  const view = new DataView(buffer)
  const moov = readMp4Boxes(view, 0, view.byteLength).find(box => box.type === "moov")
  if (!moov) return null

  for (const trak of readMp4Boxes(view, moov.payloadStart, moov.end).filter(
    box => box.type === "trak"
  )) {
    const mdia = childBox(view, trak, "mdia")
    const tkhd = childBox(view, trak, "tkhd")
    if (!mdia || !tkhd || tkhd.end - tkhd.payloadStart < 12) continue
    const hdlr = childBox(view, mdia, "hdlr")
    if (!hdlr || hdlr.payloadStart + 12 > hdlr.end) continue
    if (readAscii(view, hdlr.payloadStart + 8, 4) !== "vide") continue

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

    const width = view.getUint32(tkhd.end - 8) / 65536
    const height = view.getUint32(tkhd.end - 4) / 65536
    const durationSeconds = timescale > 0 ? durationTicks / timescale : 0
    const fps = durationSeconds > 0 ? sampleCount / durationSeconds : 0
    if ([width, height, durationSeconds, fps].every(Number.isFinite)) {
      return { width, height, durationSeconds, fps }
    }
  }

  return null
}

function inspectWav(view: DataView): AudioMetadata | null {
  if (
    view.byteLength < 12 ||
    readAscii(view, 0, 4) !== "RIFF" ||
    readAscii(view, 8, 4) !== "WAVE"
  ) {
    return null
  }
  let offset = 12
  let byteRate = 0
  let dataBytes = 0
  while (offset + 8 <= view.byteLength) {
    const type = readAscii(view, offset, 4)
    const size = view.getUint32(offset + 4, true)
    const payloadStart = offset + 8
    if (payloadStart + size > view.byteLength) break
    if (type === "fmt " && size >= 16) byteRate = view.getUint32(payloadStart + 8, true)
    if (type === "data") dataBytes = size
    offset = payloadStart + size + (size % 2)
  }
  return byteRate > 0 && dataBytes > 0 ? { durationSeconds: dataBytes / byteRate } : null
}

function inspectMp3(view: DataView): AudioMetadata | null {
  let offset = 0
  if (view.byteLength >= 10 && readAscii(view, 0, 3) === "ID3") {
    const tagSize =
      (view.getUint8(6) << 21) |
      (view.getUint8(7) << 14) |
      (view.getUint8(8) << 7) |
      view.getUint8(9)
    offset = 10 + tagSize
  }

  const mpeg1Layer3Bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
  const mpeg2Layer3Bitrates = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
  const baseSampleRates = [44100, 48000, 32000]
  const searchEnd = Math.min(view.byteLength - 4, offset + 128 * 1024)

  for (; offset <= searchEnd; offset += 1) {
    const header = view.getUint32(offset)
    if ((header & 0xffe00000) !== 0xffe00000) continue
    const versionBits = (header >>> 19) & 0b11
    const layerBits = (header >>> 17) & 0b11
    const bitrateIndex = (header >>> 12) & 0b1111
    const sampleRateIndex = (header >>> 10) & 0b11
    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15) continue
    if (sampleRateIndex === 3) continue

    const isMpeg1 = versionBits === 3
    const bitrateKbps = (isMpeg1 ? mpeg1Layer3Bitrates : mpeg2Layer3Bitrates)[bitrateIndex]
    const sampleRateDivisor = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 4
    const sampleRate = baseSampleRates[sampleRateIndex] / sampleRateDivisor
    const channelMode = (header >>> 6) & 0b11
    const hasCrc = ((header >>> 16) & 1) === 0
    const sideInfoBytes = isMpeg1 ? (channelMode === 3 ? 17 : 32) : channelMode === 3 ? 9 : 17
    const xingOffset = offset + 4 + (hasCrc ? 2 : 0) + sideInfoBytes
    if (xingOffset + 12 <= view.byteLength) {
      const marker = readAscii(view, xingOffset, 4)
      const flags = view.getUint32(xingOffset + 4)
      if ((marker === "Xing" || marker === "Info") && (flags & 1) === 1) {
        const frameCount = view.getUint32(xingOffset + 8)
        const samplesPerFrame = isMpeg1 ? 1152 : 576
        if (frameCount > 0 && sampleRate > 0) {
          return { durationSeconds: (frameCount * samplesPerFrame) / sampleRate }
        }
      }
    }
    return bitrateKbps > 0
      ? { durationSeconds: ((view.byteLength - offset) * 8) / (bitrateKbps * 1000) }
      : null
  }
  return null
}

export function inspectReferenceAudio(buffer: ArrayBuffer): AudioMetadata | null {
  const view = new DataView(buffer)
  return inspectWav(view) ?? inspectMp3(view)
}

export function validateReferenceVideoMetadata(
  metadata: VideoMetadata,
  constraints: ReferenceVideoConstraints
): string | null {
  const { width, height, durationSeconds, fps } = metadata
  const aspectRatio = width / height
  const framePixels = width * height
  if (
    width < constraints.minWidth ||
    (constraints.maxWidth !== undefined && width > constraints.maxWidth) ||
    height < constraints.minHeight ||
    (constraints.maxHeight !== undefined && height > constraints.maxHeight)
  ) {
    return `Reference video width and height must each be ${constraints.minWidth}-${constraints.maxWidth}px`
  }
  if (aspectRatio < constraints.minAspectRatio || aspectRatio > constraints.maxAspectRatio) {
    return `Reference video aspect ratio must be ${constraints.minAspectRatio}-${constraints.maxAspectRatio}`
  }
  if (framePixels < constraints.minFramePixels || framePixels > constraints.maxFramePixels) {
    return `Reference video frame pixels must be ${constraints.minFramePixels}-${constraints.maxFramePixels}`
  }
  if (
    durationSeconds < constraints.minDurationSeconds ||
    durationSeconds > constraints.maxDurationSeconds
  ) {
    return `Reference video duration must be ${constraints.minDurationSeconds}-${constraints.maxDurationSeconds} seconds`
  }
  if (fps < constraints.minFps || fps > constraints.maxFps) {
    return `Reference video frame rate must be ${constraints.minFps}-${constraints.maxFps} FPS`
  }
  return null
}

export function validateReferenceAudioMetadata(
  metadata: AudioMetadata,
  constraints: ReferenceAudioConstraints
): string | null {
  return metadata.durationSeconds < constraints.minDurationSeconds ||
    metadata.durationSeconds > constraints.maxDurationSeconds
    ? `Reference audio duration must be ${constraints.minDurationSeconds}-${constraints.maxDurationSeconds} seconds`
    : null
}
