import { useState, useRef, useCallback, useEffect } from 'react'
import JSZip from 'jszip'
import {
  ZoomOut,
  ZoomIn,
  Maximize,
  Upload,
  Scaling,
  FileText,
  Plus,
  Ruler,
  Link as LinkIcon,
  Link2Off,
  ChevronsUpDown,
  RefreshCw,
  Download,
} from 'lucide-react'
import type { Route } from './+types/resize'
import { useI18n } from '../lib/i18n'
import { SEOMeta } from '../components/SeoMeta'

type ResizeMode = 'px' | 'percentage'

interface ImageItem {
  file: File
  preview: string
  originalWidth: number
  originalHeight: number
  size: number
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Batch Image Resizer | Resize Images by Percentage or Pixels' },
    {
      name: 'description',
      content:
        'Resize multiple images at once with precision. Support for aspect ratio locking and percentage scaling. 100% private and fast.',
    },
    {
      name: 'keywords',
      content:
        'batch resize images online, image resizer percentage, social media image resizer free, fast photo scaler browser',
    },
    {
      property: 'og:title',
      content: 'Batch Image Resizer | Free Online Photo Scaler',
    },
    {
      property: 'og:description',
      content:
        'Resize multiple images at once with precision. 100% private and fast.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://tuziyo.com/resize' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'index, follow' },
  ]
}

export default function ResizePage() {
  const { t } = useI18n()
  const [images, setImages] = useState<ImageItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [resizeMode, setResizeMode] = useState<ResizeMode>('px')
  const [percentage, setPercentage] = useState(100)
  const [targetWidth, setTargetWidth] = useState(0)
  const [targetHeight, setTargetHeight] = useState(0)
  const [lockRatio, setLockRatio] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [zoom, setZoom] = useState(85)
  const [outputFormat, setOutputFormat] = useState('PNG')

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const currentImage = images[selectedIndex]

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
  }

  const handleFileChange = useCallback(
    (file: File) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const newItem = {
          file,
          preview: url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          size: file.size,
        }
        setImages(prev => [...prev, newItem])
        if (images.length === 0) {
          setTargetWidth(img.naturalWidth)
          setTargetHeight(img.naturalHeight)
        }
      }
      img.src = url
    },
    [images.length]
  )

  const handleMultipleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleFileChange(file)
        }
      })
    },
    [handleFileChange]
  )

  // Calculate new dimensions
  const getNewDimensions = useCallback(() => {
    if (!currentImage) return { width: 0, height: 0 }
    if (resizeMode === 'percentage') {
      return {
        width: Math.round(currentImage.originalWidth * (percentage / 100)),
        height: Math.round(currentImage.originalHeight * (percentage / 100)),
      }
    }
    return { width: targetWidth, height: targetHeight }
  }, [currentImage, resizeMode, percentage, targetWidth, targetHeight])

  // Update preview
  useEffect(() => {
    if (!currentImage || !previewCanvasRef.current) return

    const img = new Image()
    img.onload = () => {
      const canvas = previewCanvasRef.current!
      const ctx = canvas.getContext('2d')!
      const { width, height } = getNewDimensions()

      // Limit canvas size for preview performance
      const maxDisplaySize = 1200
      const scale = Math.min(maxDisplaySize / width, maxDisplaySize / height, 1)
      canvas.width = width * scale
      canvas.height = height * scale

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = currentImage.preview
  }, [currentImage, getNewDimensions])

  const processImage = useCallback(
    async (item: ImageItem): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          const { width, height } = getNewDimensions()
          canvas.width = width
          canvas.height = height
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            blob => (blob ? resolve(blob) : reject()),
            `image/${outputFormat.toLowerCase()}`,
            0.92
          )
        }
        img.src = item.preview
      })
    },
    [getNewDimensions, outputFormat]
  )

  const handleDownload = useCallback(async () => {
    if (!currentImage) return
    setIsProcessing(true)

    if (images.length === 1) {
      const blob = await processImage(currentImage)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const { width, height } = getNewDimensions()
      a.href = url
      a.download = `tuziyo_${width}x${height}_${currentImage.file.name}`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const zip = new JSZip()
      for (let i = 0; i < images.length; i += 1) {
        const blob = await processImage(images[i])
        const { width, height } = getNewDimensions()
        zip.file(`tuziyo_${width}x${height}_${images[i].file.name}`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tuziyo-resized-images.zip'
      a.click()
      URL.revokeObjectURL(url)
    }
    setIsProcessing(false)
  }, [images, currentImage, processImage, getNewDimensions])

  const applyPreset = (w: number, h: number) => {
    setResizeMode('px')
    setTargetWidth(w)
    setTargetHeight(h)
    if (currentImage) {
      setPercentage(Math.round((w / currentImage.originalWidth) * 100))
    }
  }

  const { width: displayWidth, height: displayHeight } = getNewDimensions()

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-64px)] flex flex-col">
      <SEOMeta page="resize" />
      <main className="flex-1 flex overflow-hidden">
        {/* Workspace Area */}
        <section className="flex-1 relative flex flex-col bg-[#f1f5f9] dark:bg-slate-950 canvas-pattern overflow-hidden">
          {images.length > 0 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 z-10 shadow-sm">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(Math.max(10, zoom - 10))}
              >
                <ZoomOut className="size-5" />
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-14 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="size-5" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setZoom(100)}
                title={t.resize.zoom}
              >
                <Maximize className="size-5" />
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-12 relative overflow-auto custom-scrollbar">
            {images.length === 0 ? (
              <div className="max-w-md w-full text-center">
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-xl">
                  <div className="size-20 bg-primary-brand/10 rounded-3xl flex items-center justify-center mb-6 mx-auto text-primary-brand">
                    <Upload className="size-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{t.resize.title}</h3>
                  <p className="text-slate-500 mb-8">{t.inpainting.dropzone}</p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary-brand text-white rounded-xl font-bold cursor-pointer hover:opacity-90 transition-all font-display uppercase tracking-widest text-xs"
                  >
                    {t.common.newProject}
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={e =>
                        e.target.files && handleMultipleFiles(e.target.files)
                      }
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div
                className="relative transition-all duration-300"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <div className="relative shadow-[0_48px_80px_-16px_rgba(0,0,0,0.2)] bg-white dark:bg-slate-800 p-2 rounded-xl border border-white/20">
                  <canvas
                    ref={previewCanvasRef}
                    className="block select-none rounded-lg"
                  />
                  <div className="absolute -bottom-16 left-0 flex gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/50 dark:border-slate-800 shadow-sm">
                    <span className="flex items-center gap-2">
                      <Scaling className="size-4 text-primary-brand" />{' '}
                      {displayWidth} × {displayHeight} PX
                    </span>
                    <span className="flex items-center gap-2">
                      <FileText className="size-4 text-primary-brand" />{' '}
                      {formatSize(currentImage.size)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image List (Thumbnail strip) */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 shadow-2xl flex items-center px-4 gap-3 z-20">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={img.preview}
                  onClick={() => {
                    setSelectedIndex(idx)
                    setTargetWidth(img.originalWidth)
                    setTargetHeight(img.originalHeight)
                  }}
                  aria-label={`Select image ${idx + 1}`}
                  className={`size-12 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === idx
                      ? 'border-primary-brand scale-110 shadow-lg'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              <label
                htmlFor="file-append"
                className="size-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Plus className="size-6 text-slate-400" />
                <input
                  id="file-append"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e =>
                    e.target.files && handleMultipleFiles(e.target.files)
                  }
                />
              </label>
            </div>
          )}
        </section>

        {/* Sidebar Settings */}
        <aside className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-20 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-8 flex flex-col gap-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    {t.resize.title}
                  </h3>
                  <Ruler className="text-slate-300 size-5" />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
                  <button
                    type="button"
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      resizeMode === 'px'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-brand'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    onClick={() => setResizeMode('px')}
                  >
                    {t.resize.pixels}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      resizeMode === 'percentage'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-brand'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    onClick={() => setResizeMode('percentage')}
                  >
                    {t.resize.percentage}
                  </button>
                </div>

                {resizeMode === 'px' ? (
                  <div className="space-y-8 relative">
                    <label
                      htmlFor="target-width"
                      className="flex flex-col gap-2.5"
                    >
                      <div className="text-2xs font-bold text-slate-500 uppercase flex items-center justify-between">
                        {t.resize.width}
                        <span className="text-2xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 font-medium">
                          PX
                        </span>
                      </div>
                      <input
                        id="target-width"
                        className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl text-base font-bold focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand px-5 transition-all text-slate-900 dark:text-white"
                        type="number"
                        value={targetWidth}
                        onChange={e => {
                          const w = Number(e.target.value)
                          setTargetWidth(w)
                          if (lockRatio && currentImage) {
                            setTargetHeight(
                              Math.round(
                                w *
                                  (currentImage.originalHeight /
                                    currentImage.originalWidth)
                              )
                            )
                          }
                        }}
                      />
                    </label>
                    <div className="flex justify-center relative -my-4 z-10">
                      <button
                        type="button"
                        className={`size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all ${
                          lockRatio ? 'text-primary-brand' : 'text-slate-300'
                        }`}
                        onClick={() => setLockRatio(!lockRatio)}
                        title={t.resize.aspectRatio}
                      >
                        {lockRatio ? (
                          <LinkIcon className="size-5" />
                        ) : (
                          <Link2Off className="size-5" />
                        )}
                      </button>
                    </div>
                    <label
                      htmlFor="target-height"
                      className="flex flex-col gap-2.5"
                    >
                      <div className="text-2xs font-bold text-slate-500 uppercase flex items-center justify-between">
                        {t.resize.height}
                        <span className="text-2xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 font-medium">
                          PX
                        </span>
                      </div>
                      <input
                        id="target-height"
                        className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl text-base font-bold focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand px-5 transition-all text-slate-900 dark:text-white"
                        type="number"
                        value={targetHeight}
                        onChange={e => {
                          const h = Number(e.target.value)
                          setTargetHeight(h)
                          if (lockRatio && currentImage) {
                            setTargetWidth(
                              Math.round(
                                h *
                                  (currentImage.originalWidth /
                                    currentImage.originalHeight)
                              )
                            )
                          }
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label
                      htmlFor="percentage-range"
                      className="text-2xs font-bold text-slate-500 uppercase flex items-center justify-between"
                    >
                      {t.resize.percentage}
                      <span className="text-primary-brand">{percentage}%</span>
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <input
                          id="percentage-range"
                          type="range"
                          min="1"
                          max="200"
                          value={percentage}
                          onChange={e => {
                            const p = Number(e.target.value)
                            setPercentage(p)
                            if (currentImage) {
                              setTargetWidth(
                                Math.round(
                                  currentImage.originalWidth * (p / 100)
                                )
                              )
                              setTargetHeight(
                                Math.round(
                                  currentImage.originalHeight * (p / 100)
                                )
                              )
                            }
                          }}
                          className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-brand"
                        />
                        <div className="relative shrink-0">
                          <input
                            type="number"
                            value={percentage}
                            onChange={e => {
                              const p = Number(e.target.value)
                              setPercentage(p)
                              if (currentImage) {
                                setTargetWidth(
                                  Math.round(
                                    currentImage.originalWidth * (p / 100)
                                  )
                                )
                                setTargetHeight(
                                  Math.round(
                                    currentImage.originalHeight * (p / 100)
                                  )
                                )
                              }
                            }}
                            className="w-20 h-10 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-xl text-center text-sm font-bold focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-400">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100, 150, 200].map(p => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => {
                              setPercentage(p)
                              if (currentImage) {
                                setTargetWidth(
                                  Math.round(
                                    currentImage.originalWidth * (p / 100)
                                  )
                                )
                                setTargetHeight(
                                  Math.round(
                                    currentImage.originalHeight * (p / 100)
                                  )
                                )
                              }
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              percentage === p
                                ? 'bg-primary-brand text-white shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">
                  Common Presets
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'HD', w: 1280, h: 720 },
                    { label: 'Full HD', w: 1920, h: 1080 },
                    { label: 'Instagram', w: 1080, h: 1080 },
                    { label: '4K', w: 3840, h: 2160 },
                  ].map(preset => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => applyPreset(preset.w, preset.h)}
                      className="p-4 text-left border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary-brand/40 hover:bg-primary-brand/5 transition-all group"
                    >
                      <p className="text-2xs font-bold text-slate-400 uppercase mb-1.5 group-hover:text-primary-brand transition-colors">
                        {preset.label}
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {preset.w} × {preset.h}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xs font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">
                  {t.crop.format}
                </h3>
                <label htmlFor="output-format" className="relative block">
                  <span className="sr-only">Output Format</span>
                  <select
                    id="output-format"
                    value={outputFormat}
                    onChange={e => setOutputFormat(e.target.value)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand px-5 appearance-none text-slate-900 dark:text-white"
                  >
                    <option>PNG</option>
                    <option>JPG</option>
                    <option>WEBP</option>
                  </select>
                  <ChevronsUpDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 size-4" />
                </label>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isProcessing || images.length === 0}
              className="w-full py-5 bg-slate-900 dark:bg-primary-brand text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 dark:hover:bg-primary-brand/90 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <span className={isProcessing ? 'animate-spin' : ''}>
                {isProcessing ? (
                  <RefreshCw className="size-5" />
                ) : (
                  <Download className="size-5" />
                )}
              </span>
              {isProcessing && t.common.processing}
              {!isProcessing &&
                images.length > 1 &&
                `${t.crop.downloadAll} (${images.length})`}
              {!isProcessing && images.length <= 1 && t.common.saveResult}
            </button>
            <p className="mt-4 text-2xs text-center text-slate-400 uppercase tracking-widest font-bold">
              {t.common.safetyPrivate}
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
