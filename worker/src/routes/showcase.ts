export interface AiToolkitShowcaseItem {
  id: string
  src: string
  alt: string
  prompt: string
  model: string
  aspectRatio: string
  width: number
  height: number
}

const SHOWCASE_IMAGE_BASE_URL = "https://s3.tuziyo.com/showcase"

const AI_TOOLKIT_SHOWCASE_MODELS = [
  "Nano Banana 2",
  "Seedream 5",
  "GPT Image 1.5",
  "WAN 2.6",
] as const

const SHOWCASE_IMAGES = [
  { filename: "case6.jpg", width: 1080, height: 1920 },
  { filename: "case16.jpg", width: 1024, height: 1536 },
  { filename: "case22.jpg", width: 1200, height: 960 },
  { filename: "case50.jpg", width: 1199, height: 675 },
  { filename: "case172.jpg", width: 636, height: 900 },
  { filename: "case174.jpg", width: 675, height: 900 },
  { filename: "case179.jpg", width: 600, height: 900 },
  { filename: "case181.jpg", width: 848, height: 1200 },
  { filename: "case187.jpg", width: 675, height: 1199 },
  { filename: "case191.jpg", width: 800, height: 1200 },
  { filename: "case193.jpg", width: 675, height: 900 },
  { filename: "case195.jpg", width: 675, height: 900 },
  { filename: "case198.jpg", width: 720, height: 900 },
  { filename: "case202.jpg", width: 680, height: 383 },
  { filename: "case206.jpg", width: 1836, height: 857 },
  { filename: "case207.jpg", width: 1200, height: 800 },
  { filename: "case208.jpg", width: 1199, height: 675 },
  { filename: "case217.jpg", width: 675, height: 1199 },
  { filename: "case218.jpg", width: 900, height: 1200 },
  { filename: "case221.jpg", width: 675, height: 1199 },
  { filename: "case224.jpg", width: 1199, height: 675 },
  { filename: "case229.jpg", width: 675, height: 1199 },
  { filename: "case240.jpg", width: 675, height: 1199 },
  { filename: "case250.jpg", width: 1199, height: 889 },
  { filename: "case277.jpg", width: 800, height: 1200 },
  { filename: "case315.jpg", width: 800, height: 1200 },
  { filename: "case319.jpg", width: 800, height: 1200 },
  { filename: "case324.jpg", width: 1024, height: 1536 },
  { filename: "case326.jpg", width: 600, height: 900 },
  { filename: "case328.jpg", width: 768, height: 1376 },
  { filename: "case329.jpg", width: 1024, height: 1536 },
  { filename: "case346.jpg", width: 1086, height: 1448 },
  { filename: "case351.jpg", width: 1254, height: 1254 },
  { filename: "case352.jpg", width: 1024, height: 1536 },
  { filename: "case380.jpg", width: 1055, height: 1491 },
  { filename: "case390.jpg", width: 1024, height: 1536 },
]

const AI_TOOLKIT_SHOWCASE_ITEMS: AiToolkitShowcaseItem[] = SHOWCASE_IMAGES.map(
  ({ filename, width, height }, index) => {
    const id = filename.replace(/\.[^.]+$/, "")

    return {
      id,
      src: `${SHOWCASE_IMAGE_BASE_URL}/${filename}`,
      alt: `Tuziyo AI toolkit showcase ${id}`,
      prompt: `Tuziyo AI toolkit showcase ${id}`,
      model: AI_TOOLKIT_SHOWCASE_MODELS[index % AI_TOOLKIT_SHOWCASE_MODELS.length],
      aspectRatio: `${width} / ${height}`,
      width,
      height,
    }
  }
)

function expandShowcaseItems(items: AiToolkitShowcaseItem[], repeatCount: number) {
  return Array.from({ length: repeatCount }).flatMap((_, repeatIndex) =>
    items.map(item => ({
      ...item,
      id: repeatIndex === 0 ? item.id : `${item.id}-${repeatIndex + 1}`,
    }))
  )
}

export function getAiToolkitShowcase() {
  return expandShowcaseItems(AI_TOOLKIT_SHOWCASE_ITEMS, 8)
}
