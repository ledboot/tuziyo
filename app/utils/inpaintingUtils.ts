/**
 * Inpainting utility functions library
 * Provides image processing and Tensor conversion utilities
 */

import * as ort from 'onnxruntime-web'

/**
 * Image quality assessment
 * Calculate image sharpness score (based on Laplacian variance)
 */

export const calculateImageSharpness = (canvas: HTMLCanvasElement): number => {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let sum = 0
  let count = 0

  // Simplified Laplacian operator
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4
      const center = data[idx]
      const top = data[((y - 1) * canvas.width + x) * 4]
      const bottom = data[((y + 1) * canvas.width + x) * 4]
      const left = data[(y * canvas.width + (x - 1)) * 4]
      const right = data[(y * canvas.width + (x + 1)) * 4]

      const laplacian = Math.abs(4 * center - top - bottom - left - right)
      sum += laplacian
      count++
    }
  }

  return sum / count
}

/**
 * Blend two canvases with weights
 * Used for smoothing tile boundaries
 */
export const blendCanvases = (
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  weight1: number = 0.5
): HTMLCanvasElement => {
  const result = document.createElement('canvas')
  result.width = canvas1.width
  result.height = canvas1.height

  const ctx = result.getContext('2d')!
  const ctx1 = canvas1.getContext('2d')!
  const ctx2 = canvas2.getContext('2d')!

  const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)
  const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)
  const resultData = ctx.createImageData(canvas1.width, canvas1.height)

  const weight2 = 1 - weight1

  for (let i = 0; i < imageData1.data.length; i += 4) {
    resultData.data[i] =
      imageData1.data[i] * weight1 + imageData2.data[i] * weight2
    resultData.data[i + 1] =
      imageData1.data[i + 1] * weight1 + imageData2.data[i + 1] * weight2
    resultData.data[i + 2] =
      imageData1.data[i + 2] * weight1 + imageData2.data[i + 2] * weight2
    resultData.data[i + 3] = 255
  }

  ctx.putImageData(resultData, 0, 0)
  return result
}

/**
 * Create feathered mask
 * Creates gradient effect on mask edges
 */
export const featherMask = (
  maskCanvas: HTMLCanvasElement,
  featherRadius: number = 10
): HTMLCanvasElement => {
  const result = document.createElement('canvas')
  result.width = maskCanvas.width
  result.height = maskCanvas.height

  const ctx = result.getContext('2d')!
  const srcCtx = maskCanvas.getContext('2d')!

  const imageData = srcCtx.getImageData(
    0,
    0,
    maskCanvas.width,
    maskCanvas.height
  )
  const resultData = ctx.createImageData(maskCanvas.width, maskCanvas.height)

  // Simple Gaussian blur approximation
  for (let y = 0; y < maskCanvas.height; y++) {
    for (let x = 0; x < maskCanvas.width; x++) {
      let sum = 0
      let count = 0

      for (let dy = -featherRadius; dy <= featherRadius; dy++) {
        for (let dx = -featherRadius; dx <= featherRadius; dx++) {
          const nx = x + dx
          const ny = y + dy

          if (
            nx >= 0 &&
            nx < maskCanvas.width &&
            ny >= 0 &&
            ny < maskCanvas.height
          ) {
            const idx = (ny * maskCanvas.width + nx) * 4
            sum += imageData.data[idx]
            count++
          }
        }
      }

      const avg = sum / count
      const idx = (y * maskCanvas.width + x) * 4
      resultData.data[idx] = avg
      resultData.data[idx + 1] = avg
      resultData.data[idx + 2] = avg
      resultData.data[idx + 3] = 255
    }
  }

  ctx.putImageData(resultData, 0, 0)
  return result
}

/**
 * Calculate bounding box of mask region
 */
export const getMaskBoundingBox = (
  maskCanvas: HTMLCanvasElement
): { x: number; y: number; width: number; height: number } | null => {
  const ctx = maskCanvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
  const data = imageData.data

  let minX = maskCanvas.width
  let minY = maskCanvas.height
  let maxX = 0
  let maxY = 0
  let hasMask = false

  for (let y = 0; y < maskCanvas.height; y++) {
    for (let x = 0; x < maskCanvas.width; x++) {
      const idx = (y * maskCanvas.width + x) * 4
      const intensity = data[idx] + data[idx + 1] + data[idx + 2]

      if (intensity > 0) {
        hasMask = true
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (!hasMask) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * Resize image to specified maximum dimensions (maintaining aspect ratio)
 */
export const resizeImage = (
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement => {
  const { width, height } = canvas

  if (width <= maxWidth && height <= maxHeight) {
    return canvas
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height)
  const newWidth = Math.floor(width * ratio)
  const newHeight = Math.floor(height * ratio)

  const result = document.createElement('canvas')
  result.width = newWidth
  result.height = newHeight

  const ctx = result.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight)

  return result
}

/**
 * Convert Canvas to Blob (for download)
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.95
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * Load image from URL to Canvas
 */
export const loadImageToCanvas = (url: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      resolve(canvas)
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image from ${url}`))
    }

    img.src = url
  })
}

/**
 * Calculate difference between two canvases (for quality assessment)
 */
export const calculateCanvasDifference = (
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement
): number => {
  if (canvas1.width !== canvas2.width || canvas1.height !== canvas2.height) {
    throw new Error('Canvas dimensions must match')
  }

  const ctx1 = canvas1.getContext('2d')!
  const ctx2 = canvas2.getContext('2d')!

  const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data
  const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data

  let totalDiff = 0

  for (let i = 0; i < data1.length; i += 4) {
    const diff =
      Math.abs(data1[i] - data2[i]) +
      Math.abs(data1[i + 1] - data2[i + 1]) +
      Math.abs(data1[i + 2] - data2[i + 2])
    totalDiff += diff
  }

  // Normalize to 0-1
  return totalDiff / (data1.length * 3 * 255)
}

/**
 * Create gradient weight map (for tile boundary blending)
 */
export const createGradientWeightMap = (
  width: number,
  height: number,
  overlapSize: number
): Float32Array => {
  const weights = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      // Calculate minimum distance to boundary
      const distToLeft = x
      const distToRight = width - 1 - x
      const distToTop = y
      const distToBottom = height - 1 - y

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

      // Create gradient within overlap region
      if (minDist < overlapSize) {
        weights[idx] = minDist / overlapSize
      } else {
        weights[idx] = 1.0
      }
    }
  }

  return weights
}

/**
 * Performance monitoring tool
 */
export class PerformanceMonitor {
  private startTime: number = 0
  private checkpoints: Map<string, number> = new Map()

  start() {
    this.startTime = performance.now()
    this.checkpoints.clear()
  }

  checkpoint(name: string) {
    this.checkpoints.set(name, performance.now() - this.startTime)
  }

  getReport(): Record<string, number> {
    const report: Record<string, number> = {}
    let lastTime = 0

    for (const [name, time] of this.checkpoints) {
      report[name] = time - lastTime
      lastTime = time
    }

    report['total'] = performance.now() - this.startTime
    return report
  }

  logReport() {
    const report = this.getReport()
    console.table(report)
  }
}

/**
 * Memory usage estimation
 */
export const estimateMemoryUsage = (
  width: number,
  height: number,
  channels: number = 3
): { bytes: number; mb: number } => {
  // Float32Array: 4 bytes per element
  const bytes = width * height * channels * 4
  const mb = bytes / (1024 * 1024)

  return { bytes, mb }
}
