import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as ort from 'onnxruntime-web'
import { ImagePlus, Upload, Zap, ShieldCheck } from 'lucide-react'
import { ModelLoader, ModelType } from '~/utils/modelLoader'
import { useI18n } from '~/lib/i18n'

// Safely get Canvas 2D context
const getCanvasContext = (
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get Canvas 2D context')
  }
  return ctx
}

// Image preprocessing: Canvas → Uint8Array (CHW format)
const canvasToUint8Tensor = (canvas: HTMLCanvasElement): Uint8Array => {
  const ctx = getCanvasContext(canvas)
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height).data

  // Convert to CHW format (Channels, Height, Width)
  const chwArray = new Uint8Array(3 * height * width)

  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const rgbaIdx = (h * width + w) * 4
        const chwIdx = c * height * width + h * width + w
        chwArray[chwIdx] = imageData[rgbaIdx + c]
      }
    }
  }

  return chwArray
}

// Mask preprocessing: Canvas → Uint8Array (single channel)
const maskToUint8Tensor = (canvas: HTMLCanvasElement): Uint8Array => {
  const ctx = getCanvasContext(canvas)
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height).data

  // Single channel mask
  const maskArray = new Uint8Array(height * width)

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      const rgbaIdx = (h * width + w) * 4
      const maskIdx = h * width + w

      // Use R channel, invert: drawn areas (red) become white (255), others become black (0)
      // Model expects: white = areas to inpaint
      maskArray[maskIdx] = imageData[rgbaIdx] !== 255 ? 255 : 0
    }
  }

  return maskArray
}

// Post-processing: Uint8Array (CHW) → ImageData (HWC + Alpha)
const tensorToImageData = (
  tensor: Uint8Array,
  width: number,
  height: number
): ImageData => {
  const rgbaData = new Uint8ClampedArray(width * height * 4)

  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const chwIdx = c * height * width + h * width + w
        const rgbaIdx = (h * width + w) * 4
        rgbaData[rgbaIdx + c] = tensor[chwIdx]
      }
    }
  }

  // Set Alpha channel
  for (let i = 0; i < width * height; i++) {
    rgbaData[i * 4 + 3] = 255
  }

  return new ImageData(rgbaData, width, height)
}

export default function Inpainting() {
  const { t } = useI18n()

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [session, setSession] = useState<ort.InferenceSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState('')
  const [brushSize, setBrushSize] = useState(40)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showMask, setShowMask] = useState(true)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)
  const [canvasScale, setCanvasScale] = useState(1)
  const [history, setHistory] = useState<string[]>([]) // History (base64 images)
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [showOriginal, setShowOriginal] = useState(false)
  const [separatorX, setSeparatorX] = useState(50)

  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const historyContainerRef = useRef<HTMLDivElement>(null)

  // Load model using ModelLoader utility
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true)
      setError('')
      setDownloadProgress(0)

      try {
        const modelLoader = new ModelLoader(ModelType.INPAINTING, progress => {
          setDownloadProgress(progress)
        })

        const { session: loadedSession } = await modelLoader.loadModel()
        setSession(loadedSession)
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Model loading failed'
        setError(errorMsg)
        console.error('Model loading error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadModel()
  }, [])

  // Image upload handler
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const img = new Image()
      img.onload = () => {
        setImage(img)
        setError('')

        // Add original image to history
        setHistory([img.src])
        setCurrentHistoryIndex(0)
      }

      img.onerror = () => {
        setError('图片加载失败，请选择有效的图片文件')
      }

      img.src = URL.createObjectURL(file)
    },
    []
  )

  // Initialize canvas when image loads
  useEffect(() => {
    if (!image) return

    const imageCanvas = imageCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    const resultCanvas = resultCanvasRef.current

    if (!imageCanvas || !maskCanvas || !resultCanvas) {
      // Canvas not ready yet, wait for next render
      return
    }

    // Use original dimensions
    imageCanvas.width = image.width
    imageCanvas.height = image.height
    maskCanvas.width = image.width
    maskCanvas.height = image.height
    resultCanvas.width = image.width
    resultCanvas.height = image.height

    // Draw original image
    const ctx = imageCanvas.getContext('2d')
    if (!ctx) {
      setError('Failed to get Canvas context')
      return
    }
    ctx.drawImage(image, 0, 0)

    // Clear mask
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) {
      setError('Failed to get Mask Canvas context')
      return
    }
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
  }, [image])

  // Mask drawing logic
  useEffect(() => {
    const canvas = maskCanvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastX: number | null = null
    let lastY: number | null = null
    let currentIsDrawing = false

    const drawCircle = (x: number, y: number) => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()

      // Calculate scale ratio (display size / actual size)
      const scale = rect.width / canvas.width
      setCanvasScale(scale)

      // Update cursor position (relative to canvas container)
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })

      // Only draw when mouse is pressed
      if (!currentIsDrawing) return

      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      if (lastX !== null && lastY !== null) {
        // Calculate distance between two points
        const dx = x - lastX
        const dy = y - lastY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Interpolate drawing to avoid gaps
        const steps = Math.max(1, Math.floor(distance / (brushSize / 4)))
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const ix = lastX + dx * t
          const iy = lastY + dy * t
          drawCircle(ix, iy)
        }
      }

      lastX = x
      lastY = y
    }

    const startDrawing = (e: MouseEvent) => {
      currentIsDrawing = true
      setIsDrawing(true)

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      lastX = x
      lastY = y

      // Draw starting point
      drawCircle(x, y)
    }

    const stopDrawing = () => {
      currentIsDrawing = false
      setIsDrawing(false)
      lastX = null
      lastY = null
    }

    const handleMouseEnter = () => {
      setShowCursor(true)
    }

    const handleMouseLeave = () => {
      setShowCursor(false)
      stopDrawing()
    }

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseenter', handleMouseEnter)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [image, brushSize])

  // Clear mask
  const clearMask = useCallback(() => {
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Run inpainting
  const runInpainting = async () => {
    if (!session || !imageCanvasRef.current || !maskCanvasRef.current) return

    setProcessing(true)
    setProgress(0)
    setError('')

    try {
      const imageCanvas = imageCanvasRef.current
      const maskCanvas = maskCanvasRef.current
      const resultCanvas = resultCanvasRef.current

      if (!resultCanvas) {
        setError('Result Canvas 未初始化')
        return
      }

      const { width, height } = imageCanvas

      console.time('preProcess')
      // Preprocessing
      const imageData = canvasToUint8Tensor(imageCanvas)
      const maskData = maskToUint8Tensor(maskCanvas)

      const imageTensor = new ort.Tensor('uint8', imageData, [
        1,
        3,
        height,
        width,
      ])
      const maskTensor = new ort.Tensor('uint8', maskData, [
        1,
        1,
        height,
        width,
      ])

      console.timeEnd('preProcess')
      setProgress(30)

      console.time('inference')
      // Inference
      const feeds = {
        [session.inputNames[0]]: imageTensor,
        [session.inputNames[1]]: maskTensor,
      }
      const results = await session.run(feeds)
      console.timeEnd('inference')
      setProgress(70)

      console.time('postProcess')
      // Post-processing
      const outputTensor = results[session.outputNames[0]]
      const outputData = outputTensor.data as Uint8Array

      const resultImageData = tensorToImageData(outputData, width, height)

      // Draw result
      const resultCtx = resultCanvas.getContext('2d')
      if (!resultCtx) {
        setError('Failed to get Result Canvas context')
        return
      }
      resultCtx.putImageData(resultImageData, 0, 0)
      console.timeEnd('postProcess')

      // Save result to history
      const resultDataUrl = resultCanvas.toDataURL()
      const newHistory = [...history, resultDataUrl]
      setHistory(newHistory)
      setCurrentHistoryIndex(newHistory.length - 1)

      // Update current displayed image to result
      const resultImg = new Image()
      resultImg.onload = () => {
        setImage(resultImg)
        // Update imageCanvas to show latest result
        const imageCtx = imageCanvas.getContext('2d')
        if (imageCtx) {
          imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height)
          imageCtx.drawImage(resultImg, 0, 0)
        }
        // Clear mask
        const maskCtx = maskCanvas.getContext('2d')
        if (maskCtx) {
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
        }
      }
      resultImg.src = resultDataUrl

      setProgress(100)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Inpainting failed'
      setError(errorMsg)
      console.error('Inpainting error:', e)
    } finally {
      setProcessing(false)
    }
  }

  // Load image from history
  const loadHistoryImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= history.length) return

      const img = new Image()
      img.onload = () => {
        setImage(img)
        setCurrentHistoryIndex(index)

        // Update canvas
        const imageCanvas = imageCanvasRef.current
        if (imageCanvas) {
          const ctx = imageCanvas.getContext('2d')
          if (ctx) {
            imageCanvas.width = img.width
            imageCanvas.height = img.height
            ctx.drawImage(img, 0, 0)
          }
        }

        // Clear mask
        const maskCanvas = maskCanvasRef.current
        if (maskCanvas) {
          const ctx = maskCanvas.getContext('2d')
          if (ctx) {
            maskCanvas.width = img.width
            maskCanvas.height = img.height
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
          }
        }
      }
      img.src = history[index]
    },
    [history]
  )

  // Download result
  const downloadResult = useCallback(() => {
    const canvas = imageCanvasRef.current
    if (!canvas || !image) return

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inpainted_${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [image])

  return (
    <>
      <style>{`
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00d4aa;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"].slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00d4aa;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest">
                <Zap className="size-3" /> {t.inpainting.aiPowered}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-brand/10 border border-primary-brand/20 text-primary-brand text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="size-3" /> {t.common.freeForever}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
              {t.inpainting.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              {t.inpainting.description}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          {!image && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 min-h-87-5 md:min-h-112-5 custom-dashed flex flex-col items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-900 group cursor-pointer hover:bg-primary-brand/5 transition-all relative overflow-hidden">
                {!loading && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                )}
                <div className="flex flex-col items-center gap-6 text-center z-10">
                  <div className="size-24 bg-primary-brand/10 rounded-full flex items-center justify-center text-primary-brand group-hover:scale-110 transition-transform duration-300">
                    <ImagePlus className="size-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold tracking-tight">
                      {t.inpainting.dropzone}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      JPG, PNG, WEBP
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-4 px-8 py-4 bg-primary-brand text-white font-bold rounded-xl shadow-lg shadow-primary-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                  >
                    <Upload className="size-5" />
                    {t.inpainting.uploadImage}
                  </button>
                </div>

                {/* Model Loading Overlay */}
                {loading && (
                  <div className="absolute inset-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                    <div className="relative size-24 md:size-32">
                      <svg className="size-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          className="stroke-primary-brand fill-none transition-all duration-300 ease-out"
                          strokeWidth="8"
                          strokeDasharray="283%"
                          strokeDashoffset={`${283 - (283 * downloadProgress) / 100}%`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="size-8 text-primary-brand animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xl font-bold">
                        {downloadProgress < 100
                          ? t.inpainting.downloadingModel
                          : t.inpainting.loadingModel}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {downloadProgress < 100
                          ? `${downloadProgress}% ${t.inpainting.downloadedFromCDN}`
                          : t.inpainting.initializingModel}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor Section */}
          {image && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      {t.inpainting.brushSize}:
                    </label>
                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={brushSize}
                        onChange={e => setBrushSize(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #00d4aa 0%, #00d4aa ${
                            ((brushSize - 10) / 90) * 100
                          }%, #e2e8f0 ${((brushSize - 10) / 90) * 100}%, #e2e8f0 100%)`,
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">
                        {brushSize}px
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setImage(null)
                        setError('')
                        setProgress(0)
                        setHistory([])
                        setCurrentHistoryIndex(-1)
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      {t.inpainting.newImage}
                    </button>
                    <button
                      onClick={() => setShowMask(!showMask)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      {showMask ? t.inpainting.hideMask : t.inpainting.showMask}
                    </button>
                    <button
                      onClick={clearMask}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      {t.inpainting.clearMask}
                    </button>
                    <button
                      onClick={runInpainting}
                      disabled={processing || !session}
                      className="px-6 py-2 bg-primary-brand text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing
                        ? t.inpainting.processing
                        : t.inpainting.inpaint}
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex gap-6">
                {/* History Sidebar */}
                {history.length > 0 && (
                  <div className="w-48 bg-white rounded-xl shadow-lg p-4 shrink-0">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">
                      {t.inpainting.history}
                    </h3>
                    <div
                      ref={historyContainerRef}
                      className="space-y-2 max-h-150 overflow-y-auto"
                    >
                      {history.map((imgSrc, index) => (
                        <button
                          key={index}
                          onClick={() => loadHistoryImage(index)}
                          className={`w-full border-2 rounded-lg overflow-hidden transition-all ${
                            currentHistoryIndex === index
                              ? 'border-primary-brand ring-2 ring-primary-brand/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={imgSrc}
                            alt={`History ${index + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="text-xs text-slate-600 py-1 bg-slate-50">
                            {index === 0 ? 'Original' : `Edit ${index}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Canvas Area */}
                <div className="flex-1 max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-slate-700">
                        {t.inpainting.editor}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowOriginal(!showOriginal)}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            showOriginal
                              ? 'bg-primary-brand text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          disabled={currentHistoryIndex === 0}
                        >
                          {showOriginal
                            ? t.inpainting.hideOriginal
                            : t.inpainting.showOriginal}
                        </button>
                        <button
                          onClick={downloadResult}
                          className="px-4 py-2 bg-primary-brand text-white rounded-md hover:bg-primary-dark transition-colors"
                        >
                          {t.inpainting.download}
                        </button>
                      </div>
                    </div>

                    <div className="relative" ref={canvasContainerRef}>
                      {/* Base Image Canvas */}
                      <canvas
                        ref={imageCanvasRef}
                        className="w-full h-auto border border-slate-200 rounded"
                      />

                      {/* Mask Canvas */}
                      <canvas
                        ref={maskCanvasRef}
                        className="absolute top-0 left-0 w-full h-auto"
                        style={{
                          opacity: showMask ? 1 : 0,
                          pointerEvents:
                            showOriginal || processing ? 'none' : 'auto',
                          cursor: 'none',
                        }}
                      />

                      {/* Original Comparison Overlay */}
                      {showOriginal && currentHistoryIndex > 0 && (
                        <div
                          className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
                          style={{
                            clipPath: `inset(0 ${100 - separatorX}% 0 0)`,
                          }}
                        >
                          <img
                            src={history[0]}
                            alt="Original"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {/* Separator Line */}
                      {showOriginal && currentHistoryIndex > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
                          style={{ left: `${separatorX}%` }}
                          onMouseDown={e => {
                            e.preventDefault()
                            const container = canvasContainerRef.current
                            if (!container) return

                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const rect = container.getBoundingClientRect()
                              const x = moveEvent.clientX - rect.left
                              const percentage = (x / rect.width) * 100
                              setSeparatorX(
                                Math.max(0, Math.min(100, percentage))
                              )
                            }

                            const handleMouseUp = () => {
                              document.removeEventListener(
                                'mousemove',
                                handleMouseMove
                              )
                              document.removeEventListener(
                                'mouseup',
                                handleMouseUp
                              )
                            }

                            document.addEventListener(
                              'mousemove',
                              handleMouseMove
                            )
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-slate-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Processing Overlay */}
                      {processing && (
                        <div className="absolute inset-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 rounded">
                          <div className="relative size-24 md:size-32">
                            <svg className="size-full -rotate-90">
                              <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                                strokeWidth="8"
                              />
                              <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                className="stroke-primary-brand fill-none transition-all duration-300 ease-out"
                                strokeWidth="8"
                                strokeDasharray="283%"
                                strokeDashoffset={`${283 - (283 * progress) / 100}%`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Zap className="size-8 text-primary-brand animate-pulse" />
                            </div>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-xl font-bold">
                              {t.inpainting.processingImage}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {progress}% {t.inpainting.complete}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Custom cursor circle */}
                      {showCursor && !showOriginal && !processing && (
                        <div
                          className="absolute pointer-events-none border-2 border-red-500 rounded-full"
                          style={{
                            left: `${cursorPos.x}px`,
                            top: `${cursorPos.y}px`,
                            width: `${brushSize * canvasScale}px`,
                            height: `${brushSize * canvasScale}px`,
                            transform: 'translate(-50%, -50%)',
                            transition: 'width 0.1s, height 0.1s',
                          }}
                        />
                      )}
                    </div>

                    {/* Result Canvas (hidden, used for processing) */}
                    <canvas ref={resultCanvasRef} className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
