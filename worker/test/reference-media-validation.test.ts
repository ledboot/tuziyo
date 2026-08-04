import { describe, expect, test } from "bun:test"
import {
  inspectReferenceAudio,
  validateReferenceAudioMetadata,
  validateReferenceVideoMetadata,
} from "../src/referenceMediaValidation"

function createWav(durationSeconds: number, sampleRate = 8000) {
  const channels = 1
  const bytesPerSample = 2
  const dataBytes = durationSeconds * sampleRate * channels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }
  writeAscii(0, "RIFF")
  view.setUint32(4, 36 + dataBytes, true)
  writeAscii(8, "WAVE")
  writeAscii(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * bytesPerSample, true)
  view.setUint16(32, channels * bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeAscii(36, "data")
  view.setUint32(40, dataBytes, true)
  return buffer
}

describe("reference media server validation", () => {
  test("reads WAV duration from uploaded bytes", () => {
    expect(inspectReferenceAudio(createWav(2))).toEqual({ durationSeconds: 2 })
  })

  test("enforces video and audio metadata boundaries", () => {
    expect(
      validateReferenceVideoMetadata(
        { width: 640, height: 640, durationSeconds: 15, fps: 60 },
        {
          mimeTypes: ["video/mp4"],
          maxBytes: 50_000_000,
          minWidth: 300,
          maxWidth: 6000,
          minHeight: 300,
          maxHeight: 6000,
          minAspectRatio: 0.4,
          maxAspectRatio: 2.5,
          minDurationSeconds: 2,
          maxDurationSeconds: 15,
          maxTotalDurationSeconds: 15,
          minFramePixels: 409_600,
          maxFramePixels: 2_086_876,
          minFps: 24,
          maxFps: 60,
        }
      )
    ).toBeNull()
    expect(
      validateReferenceAudioMetadata(
        { durationSeconds: 15.01 },
        {
          mimeTypes: ["audio/wav"],
          maxBytes: 15_000_000,
          minDurationSeconds: 2,
          maxDurationSeconds: 15,
          maxTotalDurationSeconds: 15,
        }
      )
    ).toContain("2-15 seconds")
  })
})
