import * as ort from 'onnxruntime-web'

const DB_NAME = 'TUZIYO_CACHE'
const STORE_NAME = 'models'

/**
 * Supported Model Types
 */
export enum ModelType {
  INPAINTING = 'inpainting',
  UPSCALING = 'upscaling',
}

/**
 * Model Configuration Interface
 */
interface ModelConfig {
  url: string
  cacheKey: string
  name: string
}

/**
 * Global Model Configuration Table
 */
export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  [ModelType.INPAINTING]: {
    url: 'https://s3.tuziyo.com/migan_pipeline_v2.onnx',
    cacheKey: 'migan_pipeline_v2.onnx',
    name: 'MIGAN Inpainting V2',
  },
  [ModelType.UPSCALING]: {
    url: 'https://s3.tuziyo.com/real_esrgan_v3.onnx', // Example URL
    cacheKey: 'real_esrgan_v3.onnx',
    name: 'Real-ESRGAN V3',
  },
}

/**
 * Model Loader
 * Handles downloading ONNX models from CDN with progress tracking, browser caching, and IndexedDB persistence
 */
export class ModelLoader {
  private modelType: ModelType
  private config: ModelConfig
  private onProgress?: (progress: number) => void

  constructor(modelType: ModelType, onProgress?: (progress: number) => void) {
    this.modelType = modelType
    this.config = MODEL_CONFIGS[modelType]
    this.onProgress = onProgress
  }

  /**
   * Open IndexedDB and return a promise
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get model from IndexedDB
   */
  private async getModelFromDB(): Promise<ArrayBuffer | null> {
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(this.config.cacheKey)

        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Failed to get model from IndexedDB:', e)
      return null
    }
  }

  /**
   * Save model to IndexedDB
   */
  private async saveModelToDB(data: ArrayBuffer): Promise<void> {
    try {
      const db = await this.openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(data, this.config.cacheKey)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Failed to save model to IndexedDB:', e)
    }
  }

  /**
   * Download model with progress tracking
   * Returns ArrayBuffer for ONNX session creation
   */
  async downloadModel(): Promise<ArrayBuffer> {
    console.log(`Downloading ${this.config.name} from CDN:`, this.config.url)

    const response = await fetch(this.config.url)

    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.statusText}`)
    }

    const contentLength = +(response.headers.get('Content-Length') ?? 0)
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    let receivedLength = 0
    const chunks: Uint8Array[] = []

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Update progress
      if (contentLength > 0 && this.onProgress) {
        const percent = Math.round((receivedLength / contentLength) * 100)
        this.onProgress(percent)
        console.log(`Download progress: ${percent}%`)
      }
    }

    console.log('Model downloaded, preparing data...')

    // Merge all chunks into single Uint8Array
    const modelData = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      modelData.set(chunk, position)
      position += chunk.length
    }

    // Save to IndexedDB for future use
    await this.saveModelToDB(modelData.buffer)

    return modelData.buffer
  }

  /**
   * Load ONNX model with automatic provider selection
   * Tries WebGPU first, falls back to WASM
   */
  async loadModel(): Promise<{
    session: ort.InferenceSession
    provider: 'webgpu' | 'wasm'
  }> {
    // Configure WASM paths
    ort.env.wasm.wasmPaths =
      'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/'
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4

    // Try to get from IndexedDB first
    let modelData = await this.getModelFromDB()

    if (modelData) {
      console.log(`${this.config.name} loaded from IndexedDB cache`)
      // Update progress to 100% if loaded from cache
      if (this.onProgress) this.onProgress(100)
    } else {
      // Not in cache, download it
      modelData = await this.downloadModel()
    }

    // Try providers in order
    const providers: string[] = []

    if ('gpu' in navigator) {
      providers.push('webgpu')
      console.log('WebGPU is available, attempting to use it...')
    }
    providers.push('wasm')

    let loadedSession: ort.InferenceSession | null = null
    let usedProvider: 'webgpu' | 'wasm' = 'wasm'

    for (const provider of providers) {
      try {
        console.log(`Attempting to load model with ${provider}...`)
        loadedSession = await ort.InferenceSession.create(modelData, {
          executionProviders: [provider],
          graphOptimizationLevel: 'all',
        })
        usedProvider = provider as 'webgpu' | 'wasm'
        console.log(`Successfully loaded model with ${provider}`)
        break
      } catch (e) {
        console.warn(`Failed to load with ${provider}:`, e)
      }
    }

    if (!loadedSession) {
      throw new Error(
        `Failed to load ${this.config.name}, please check browser compatibility`
      )
    }

    console.log(`${this.config.name} loaded successfully using ${usedProvider}`)

    return {
      session: loadedSession,
      provider: usedProvider,
    }
  }
}
