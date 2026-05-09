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

const AI_TOOLKIT_SHOWCASE_ITEMS: AiToolkitShowcaseItem[] = [
  {
    id: "glass-atrium",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=720&q=82",
    alt: "Sunlit glass atrium interior",
    prompt: "Sunlit glass atrium with soft reflections and editorial architecture lighting",
    model: "Nano Banana 2",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "mountain-lake",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=720&q=82",
    alt: "Still lake beneath mountain ridges",
    prompt: "Quiet alpine lake at blue hour, cinematic but natural color grading",
    model: "Seedream 5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "fashion-studio",
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=82",
    alt: "Editorial fashion portrait in a studio",
    prompt: "High fashion studio portrait with glossy fabric and restrained flash",
    model: "GPT Image 1.5",
    aspectRatio: "2 / 3",
    width: 720,
    height: 1080,
  },
  {
    id: "desert-road",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=82",
    alt: "Warm desert road at sunset",
    prompt: "Wide open desert road, warm sunset, premium travel campaign look",
    model: "WAN 2.6",
    aspectRatio: "5 / 4",
    width: 720,
    height: 576,
  },
  {
    id: "city-neon",
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=720&q=82",
    alt: "City lights and concert atmosphere",
    prompt: "Rainy city night with reflective neon and soft cinematic haze",
    model: "Nano Banana 2",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "space-panel",
    src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=720&q=82",
    alt: "Earth seen from orbit",
    prompt: "Orbital view of Earth, crisp atmosphere glow, documentary realism",
    model: "GPT Image 1.5",
    aspectRatio: "1 / 1",
    width: 720,
    height: 720,
  },
  {
    id: "concrete-tower",
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=720&q=82",
    alt: "Modern office tower facade",
    prompt: "Modern office facade with strong geometry and pearlescent morning light",
    model: "Seedream 5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "robot-lab",
    src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=720&q=82",
    alt: "Robot in a technology lab",
    prompt: "Friendly humanoid robot in a clean lab, product launch visual language",
    model: "WAN 2.6",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "moon-surface",
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=720&q=82",
    alt: "Deep space and moonlit horizon",
    prompt: "Deep space horizon with fine grain and quiet science-fiction mood",
    model: "Nano Banana 2",
    aspectRatio: "16 / 10",
    width: 720,
    height: 450,
  },
  {
    id: "forest-path",
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=720&q=82",
    alt: "Mist in a green forest",
    prompt: "Misty forest path with soft moss, natural documentary palette",
    model: "Seedream 5",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "waterfall",
    src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=720&q=82",
    alt: "Waterfall between mossy rocks",
    prompt: "Icelandic waterfall, long exposure water, textured black rock",
    model: "GPT Image 1.5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "green-hills",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=720&q=82",
    alt: "Green hills below a dramatic sky",
    prompt: "Rolling green hills with dramatic clouds and restrained film color",
    model: "WAN 2.6",
    aspectRatio: "5 / 4",
    width: 720,
    height: 576,
  },
  {
    id: "golden-peaks",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=720&q=82",
    alt: "Golden mountain peaks",
    prompt: "Golden mountain peaks with crisp air and premium outdoor campaign style",
    model: "Nano Banana 2",
    aspectRatio: "1 / 1",
    width: 720,
    height: 720,
  },
  {
    id: "storm-valley",
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=720&q=82",
    alt: "Valley under a stormy sky",
    prompt: "Stormy mountain valley with painterly light and grounded realism",
    model: "Seedream 5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "snow-cabin",
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=720&q=82",
    alt: "Snowy landscape under stars",
    prompt: "Snow field under stars with luminous blue shadows and calm composition",
    model: "GPT Image 1.5",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "coastal-cliff",
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=82",
    alt: "Coastal waves and cliffs",
    prompt: "Coastal cliff with white surf, clean commercial travel photography",
    model: "WAN 2.6",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "product-watch",
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&q=82",
    alt: "Minimal watch product photo",
    prompt: "Minimal product photo on warm stone, soft edge highlight, luxury catalog",
    model: "Nano Banana 2",
    aspectRatio: "1 / 1",
    width: 720,
    height: 720,
  },
  {
    id: "coffee-counter",
    src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=720&q=82",
    alt: "Coffee being prepared at a counter",
    prompt: "Coffee ritual close-up with steam, dark counter, warm morning light",
    model: "Seedream 5",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "botanical-detail",
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=720&q=82",
    alt: "Colorful botanical detail",
    prompt: "Botanical macro with jewel tones, editorial fragrance campaign mood",
    model: "GPT Image 1.5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "architecture-stairs",
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=720&q=82",
    alt: "Architectural stairs and warm light",
    prompt: "Architectural stairwell with precise shadows and understated luxury",
    model: "WAN 2.6",
    aspectRatio: "5 / 4",
    width: 720,
    height: 576,
  },
]

const SHOWCASE_ASPECT_RATIOS = ["3 / 4", "4 / 5", "2 / 3", "3 / 5", "1 / 1", "4 / 5"]

function expandShowcaseItems(items: AiToolkitShowcaseItem[], repeatCount: number) {
  return Array.from({ length: repeatCount }).flatMap((_, repeatIndex) =>
    items.map((item, itemIndex) => ({
      ...item,
      id: repeatIndex === 0 ? item.id : `${item.id}-${repeatIndex + 1}`,
      aspectRatio:
        SHOWCASE_ASPECT_RATIOS[(itemIndex + repeatIndex) % SHOWCASE_ASPECT_RATIOS.length],
    }))
  )
}

export function getAiToolkitShowcase() {
  return expandShowcaseItems(AI_TOOLKIT_SHOWCASE_ITEMS, 8)
}
