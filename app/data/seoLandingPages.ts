export const SEO_PAGE_UPDATED_AT = "2026-07-30"

export interface ComparisonCandidate {
  name: string
  provider: string
  modelId: string
  href?: string
  image: string
  imageAlt: string
  summary: string
}

export interface ComparisonPageData {
  slug: string
  title: string
  metaTitle: string
  description: string
  eyebrow: string
  intro: string
  verdict: string
  candidates: ComparisonCandidate[]
  comparisonRows: { label: string; values: string[] }[]
  decisions: { title: string; description: string; candidateIndex: number }[]
  criteria: { title: string; description: string }[]
  scenarios: { title: string; recommendation: string; reason: string }[]
  faqs: { question: string; answer: string }[]
  relatedLinks: { label: string; href: string; description: string }[]
}

export const COMPARISON_PAGES = {
  "nano-banana-pro-vs-nano-banana-2": {
    slug: "nano-banana-pro-vs-nano-banana-2",
    metaTitle: "Nano Banana Pro vs Nano Banana 2: Which Is Better? | tuziyo",
    title: "Nano Banana Pro vs Nano Banana 2",
    description:
      "Compare Nano Banana Pro and Nano Banana 2 by credits, resolution, references, formats, search controls, and the work each model fits best.",
    eyebrow: "Google AI image model comparison",
    intro:
      "Both models can take a visual idea to 4K, but they solve different production problems. Nano Banana 2 is the flexible all-rounder for fast iteration and unusual formats. Nano Banana Pro is the higher-cost option for deliberate, brand-sensitive final work.",
    verdict:
      "Start with Nano Banana 2 for most briefs. Move to Nano Banana Pro when the chosen direction needs premium art direction, brand consistency, or a final-production pass.",
    candidates: [
      {
        name: "Nano Banana Pro",
        provider: "Google",
        modelId: "google/nano-banana-pro",
        href: "/ai/models/nano-banana-pro",
        image: "/showcase/case22.jpg",
        imageAlt: "Surreal fashion campaign image representing Nano Banana Pro",
        summary: "Best for considered campaign assets and complex professional briefs.",
      },
      {
        name: "Nano Banana 2",
        provider: "Google",
        modelId: "google/nano-banana-2",
        href: "/ai/models/nano-banana-2",
        image: "/showcase/case206.jpg",
        imageAlt: "Wide cinematic landscape representing Nano Banana 2",
        summary: "Best default for broad formats, fast iteration, and draft-to-4K production.",
      },
    ],
    comparisonRows: [
      { label: "Starting credits", values: ["8", "4"] },
      { label: "Resolution in tuziyo", values: ["1K, 2K, 4K", "0.5K, 1K, 2K, 4K"] },
      { label: "Reference images", values: ["Up to 14", "Up to 14"] },
      {
        label: "Format range",
        values: ["Standard through ultrawide", "15 ratios, including 1:8 and 8:1"],
      },
      { label: "Search controls", values: ["Web search", "Google Search and Image Search"] },
      { label: "Thinking control", values: ["Automatic model behavior", "Auto, min, or high"] },
      {
        label: "Best starting point",
        values: ["Premium final asset", "General-purpose production"],
      },
    ],
    decisions: [
      {
        title: "Choose Nano Banana Pro",
        description:
          "Use it when brand consistency, a complex reference set, controlled campaign art, or a high-resolution final asset justifies the higher starting cost.",
        candidateIndex: 0,
      },
      {
        title: "Choose Nano Banana 2",
        description:
          "Use it for everyday production, unusual aspect ratios, text-aware concepts, storyboards, and a cost-efficient path from a compact draft to 4K.",
        candidateIndex: 1,
      },
    ],
    criteria: [
      {
        title: "Use the same brief",
        description:
          "Keep subject, references, format, and required text identical so the model is the variable—not the art direction.",
      },
      {
        title: "Compare at equal resolution",
        description:
          "Judge both at 1K or 2K first. A 4K result should not win simply because it contains more pixels.",
      },
      {
        title: "Check constraints",
        description:
          "Inspect identity, product geometry, typography, composition, and prohibited changes before judging surface polish.",
      },
      {
        title: "Count usable results",
        description:
          "The best model is the one that reaches an acceptable result with fewer reruns, not the one with the strongest lucky image.",
      },
    ],
    scenarios: [
      {
        title: "Fast social variations",
        recommendation: "Nano Banana 2",
        reason:
          "Lower starting credits and more extreme output ratios make it easier to explore several placements.",
      },
      {
        title: "Brand campaign key visual",
        recommendation: "Nano Banana Pro",
        reason: "Its positioning and controls fit a deliberate, reference-heavy final pass.",
      },
      {
        title: "Storyboard or panoramic concept",
        recommendation: "Nano Banana 2",
        reason: "The 1:8, 8:1, and 4:1 options support sequences and wide environments.",
      },
      {
        title: "Premium editorial artwork",
        recommendation: "Nano Banana Pro",
        reason: "Use the higher-cost model after the direction is clear and detail matters.",
      },
    ],
    faqs: [
      {
        question: "Is Nano Banana 2 better than Nano Banana Pro?",
        answer:
          "Not universally. Nano Banana 2 is the stronger default for range and cost, while Nano Banana Pro is the deliberate choice for demanding final assets and brand-sensitive work.",
      },
      {
        question: "Do both models support 4K output?",
        answer:
          "Yes. In tuziyo both can output up to 4K, although the available controls and credit cost differ.",
      },
      {
        question: "Which model should I try first?",
        answer:
          "Start with Nano Banana 2 at 1K or 2K. If the direction is right but the result needs a more considered production pass, rerun the same brief with Nano Banana Pro.",
      },
    ],
    relatedLinks: [
      {
        label: "Nano Banana Pro guide",
        href: "/ai/models/nano-banana-pro",
        description: "Review its controls, use cases, and prompt blueprints.",
      },
      {
        label: "Nano Banana 2 guide",
        href: "/ai/models/nano-banana-2",
        description: "Explore ratios, resolution, search, and thinking controls.",
      },
      {
        label: "AI image prompt examples",
        href: "/prompts/ai-image-prompts-examples",
        description: "Start from practical prompts for products, portraits, and scenes.",
      },
    ],
  },
  "best-ai-model-for-product-photography": {
    slug: "best-ai-model-for-product-photography",
    metaTitle: "Best AI Model for Product Photography: A Practical Comparison | tuziyo",
    title: "Best AI Model for Product Photography",
    description:
      "Compare Nano Banana Pro, Nano Banana 2, Seedream 5 Pro, and GPT Image 2 for product photography, packshots, campaign scenes, and reference fidelity.",
    eyebrow: "Product image model comparison",
    intro:
      "There is no single best model for every product image. The right choice depends on whether the job is a quick background variation, a reference-faithful packshot, a polished campaign scene, or a detailed layout brief.",
    verdict:
      "Use Nano Banana 2 as the balanced starting point, Seedream 5 Pro for cost-aware polished stills, Nano Banana Pro for premium campaign work, and GPT Image 2 when the brief or reference set is unusually detailed.",
    candidates: [
      {
        name: "Nano Banana 2",
        provider: "Google",
        modelId: "google/nano-banana-2",
        href: "/ai/models/nano-banana-2",
        image: "/showcase/case206.jpg",
        imageAlt: "Wide campaign scene representing Nano Banana 2",
        summary: "Balanced default for variations, flexible formats, and draft-to-final work.",
      },
      {
        name: "Seedream 5 Pro",
        provider: "ByteDance",
        modelId: "bytedance/seedream-5-pro",
        href: "/ai/models/seedream-5-pro",
        image: "/showcase/case6.jpg",
        imageAlt: "Polished commercial portrait representing Seedream 5 Pro",
        summary: "Cost-aware choice for polished 1K–2K commercial stills.",
      },
      {
        name: "Nano Banana Pro",
        provider: "Google",
        modelId: "google/nano-banana-pro",
        href: "/ai/models/nano-banana-pro",
        image: "/showcase/case22.jpg",
        imageAlt: "Premium campaign composition representing Nano Banana Pro",
        summary: "Premium option for campaign art and brand-sensitive final assets.",
      },
      {
        name: "GPT Image 2",
        provider: "OpenAI",
        modelId: "openai/gpt-image-2",
        href: "/ai/models/gpt-image-2",
        image: "/showcase/case324.jpg",
        imageAlt: "Detailed concept image representing GPT Image 2",
        summary: "Strong fit for long briefs, many references, and batch exploration.",
      },
    ],
    comparisonRows: [
      { label: "Starting credits", values: ["4", "3", "8", "5"] },
      { label: "Maximum resolution", values: ["4K", "2K", "4K", "4K"] },
      { label: "Reference images", values: ["14", "10", "14", "16"] },
      {
        label: "Best product task",
        values: [
          "Variations and formats",
          "Polished commercial still",
          "Campaign key visual",
          "Detailed layout brief",
        ],
      },
      {
        label: "Useful distinction",
        values: [
          "Search and reasoning controls",
          "Lower-cost 1K–2K path",
          "Premium production focus",
          "Up to five results per run",
        ],
      },
    ],
    decisions: [
      {
        title: "Best balanced starting point",
        description:
          "Nano Banana 2 covers many ratios, accepts fourteen references, and lets a team explore cheaply before increasing resolution.",
        candidateIndex: 0,
      },
      {
        title: "Best cost-aware still",
        description:
          "Seedream 5 Pro starts lower and is well suited to composed product scenes that only need 1K or 2K delivery.",
        candidateIndex: 1,
      },
      {
        title: "Best premium campaign pass",
        description:
          "Nano Banana Pro makes sense once product geometry and art direction are settled and the final asset deserves more budget.",
        candidateIndex: 2,
      },
      {
        title: "Best for a complex brief",
        description:
          "GPT Image 2 supports the largest reference set in this comparison and several results from one structured setup.",
        candidateIndex: 3,
      },
    ],
    criteria: [
      {
        title: "Protect product identity",
        description:
          "Use a clean product reference and explicitly preserve geometry, material, color, label spelling, cap, controls, and logos.",
      },
      {
        title: "Separate scene from product",
        description:
          "Describe what may change—background, surface, lighting, props—and what must remain fixed.",
      },
      {
        title: "Test label accuracy",
        description:
          "Zoom into packaging text and logos. A beautiful image is unusable when a product name or regulatory line changes.",
      },
      {
        title: "Judge production efficiency",
        description:
          "Track reruns, cleanup time, resolution, and credit cost alongside visual quality.",
      },
    ],
    scenarios: [
      {
        title: "Marketplace background variations",
        recommendation: "Nano Banana 2",
        reason: "A practical balance of references, formats, and starting cost.",
      },
      {
        title: "Social product stills",
        recommendation: "Seedream 5 Pro",
        reason: "A focused 1K–2K workflow can cover common portrait and square placements.",
      },
      {
        title: "Luxury launch campaign",
        recommendation: "Nano Banana Pro",
        reason: "Use it for the selected direction when premium finish and consistency matter.",
      },
      {
        title: "Detailed packaging layout",
        recommendation: "GPT Image 2",
        reason: "Long prompts and extensive visual context suit a constraint-heavy brief.",
      },
    ],
    faqs: [
      {
        question: "Which AI model is best for product photography?",
        answer:
          "Nano Banana 2 is the best general starting point in tuziyo. Seedream 5 Pro, Nano Banana Pro, and GPT Image 2 become better choices when cost, premium finish, or brief complexity dominates.",
      },
      {
        question: "Can AI preserve my real product exactly?",
        answer:
          "A reference image and explicit invariants improve consistency, but every result still needs inspection. Treat generated images as candidates, especially when packaging, logos, or regulated text must be exact.",
      },
      {
        question: "Should I generate product images at 4K immediately?",
        answer:
          "Usually no. Establish the composition at 1K or 2K, then spend on 4K only after the product and scene are correct.",
      },
    ],
    relatedLinks: [
      {
        label: "AI image prompts",
        href: "/prompts/ai-image-prompts",
        description: "Learn a reusable structure for product and campaign prompts.",
      },
      {
        label: "Prompt examples",
        href: "/prompts/ai-image-prompts-examples",
        description: "Copy a product-scene prompt and adapt its invariants.",
      },
      {
        label: "Compare all models",
        href: "/ai/models",
        description: "Review every public model guide and current control.",
      },
    ],
  },
  "gpt-image-2-vs-nano-banana-2": {
    slug: "gpt-image-2-vs-nano-banana-2",
    metaTitle: "GPT Image 2 vs Nano Banana 2: Features, Cost & Use Cases | tuziyo",
    title: "GPT Image 2 vs Nano Banana 2",
    description:
      "Compare GPT Image 2 and Nano Banana 2 by starting credits, references, resolutions, batch output, search controls, and creative workflow.",
    eyebrow: "OpenAI vs Google image model comparison",
    intro:
      "GPT Image 2 gives detailed briefs and large reference sets more room. Nano Banana 2 is the faster all-rounder with unusual aspect ratios, search controls, adjustable thinking, and a lower starting cost.",
    verdict:
      "Choose Nano Banana 2 for general visual production and format flexibility. Choose GPT Image 2 when the work depends on a long structured brief, many reference images, or several candidates from one run.",
    candidates: [
      {
        name: "GPT Image 2",
        provider: "OpenAI",
        modelId: "openai/gpt-image-2",
        href: "/ai/models/gpt-image-2",
        image: "/showcase/case324.jpg",
        imageAlt: "Detailed science-fiction artwork representing GPT Image 2",
        summary: "Best for detailed briefs, extensive visual context, and batch exploration.",
      },
      {
        name: "Nano Banana 2",
        provider: "Google",
        modelId: "google/nano-banana-2",
        href: "/ai/models/nano-banana-2",
        image: "/showcase/case206.jpg",
        imageAlt: "Wide cinematic landscape representing Nano Banana 2",
        summary: "Best for everyday production, search-aware concepts, and unusual formats.",
      },
    ],
    comparisonRows: [
      { label: "Starting credits", values: ["5", "4"] },
      { label: "Maximum resolution", values: ["4K", "4K"] },
      { label: "Reference images", values: ["Up to 16", "Up to 14"] },
      { label: "Images per run", values: ["Up to 5", "1"] },
      {
        label: "Aspect-ratio emphasis",
        values: ["Core production sizes", "15 ratios from 1:8 to 8:1"],
      },
      {
        label: "Search controls",
        values: ["Not exposed in tuziyo", "Google Search and Image Search"],
      },
      {
        label: "Best starting point",
        values: ["Complex structured brief", "Flexible all-rounder"],
      },
    ],
    decisions: [
      {
        title: "Choose GPT Image 2",
        description:
          "Use it when a layout, world, or product brief needs many explicit constraints, up to sixteen references, or multiple candidates from one setup.",
        candidateIndex: 0,
      },
      {
        title: "Choose Nano Banana 2",
        description:
          "Use it when iteration speed, lower starting credits, web or image search, and unusual output proportions matter most.",
        candidateIndex: 1,
      },
    ],
    criteria: [
      {
        title: "Brief adherence",
        description:
          "List five non-negotiable details and count how many survive without correction.",
      },
      {
        title: "Reference roles",
        description:
          "Label each uploaded image as identity, palette, material, composition, or environment.",
      },
      {
        title: "Typography",
        description:
          "Use the same exact headline and inspect spelling, hierarchy, spacing, and unwanted text.",
      },
      {
        title: "Candidate yield",
        description:
          "Compare usable images per run and total credits, not just each model's best output.",
      },
    ],
    scenarios: [
      {
        title: "Long advertising layout",
        recommendation: "GPT Image 2",
        reason: "Its long-form brief and batch workflow suit a structured composition.",
      },
      {
        title: "Extreme panoramic asset",
        recommendation: "Nano Banana 2",
        reason: "Its 8:1 and 1:8 formats are designed for unusually wide or tall layouts.",
      },
      {
        title: "Many creative candidates",
        recommendation: "GPT Image 2",
        reason: "Request up to five outputs without rebuilding the setup.",
      },
      {
        title: "Search-aware visual concept",
        recommendation: "Nano Banana 2",
        reason:
          "Google Search and Image Search controls can add current visual context when needed.",
      },
    ],
    faqs: [
      {
        question: "Is GPT Image 2 better than Nano Banana 2?",
        answer:
          "GPT Image 2 is better suited to long, reference-heavy briefs and batch exploration. Nano Banana 2 is the better general default for cost, formats, and search-aware production.",
      },
      {
        question: "Which one is cheaper in tuziyo?",
        answer:
          "Nano Banana 2 starts at four credits, while GPT Image 2 starts at five. Higher resolution, quality, or multiple outputs can change the final cost.",
      },
      {
        question: "Can both models create 4K images?",
        answer:
          "Yes. Both offer a path to 4K in tuziyo, so compare the models at an equal resolution before judging detail.",
      },
    ],
    relatedLinks: [
      {
        label: "GPT Image 2 guide",
        href: "/ai/models/gpt-image-2",
        description: "Review long prompts, references, quality, and batch controls.",
      },
      {
        label: "Nano Banana 2 guide",
        href: "/ai/models/nano-banana-2",
        description: "Review ratios, search, thinking, and resolution controls.",
      },
      {
        label: "Prompt examples",
        href: "/prompts/ai-image-prompts-examples",
        description: "Use the same practical brief to compare both models.",
      },
    ],
  },
  "seedream-5-pro-vs-seedream-5-lite": {
    slug: "seedream-5-pro-vs-seedream-5-lite",
    metaTitle: "Seedream 5 Pro vs Seedream 5 Lite: Complete Comparison | tuziyo",
    title: "Seedream 5 Pro vs Seedream 5 Lite",
    description:
      "Compare Seedream 5 Pro and Seedream 5 Lite in tuziyo by credits, resolution, references, aspect ratios, batch output, and practical use cases.",
    eyebrow: "ByteDance image model comparison",
    intro:
      "The names suggest a simple quality ladder, but the current controls reveal a more useful distinction. Pro is a focused 1K–2K model for polished commercial direction. Lite starts cheaper, supports up to 3K, accepts more references, and can return several images per run.",
    verdict:
      "Choose Seedream 5 Pro for a deliberate single commercial still. Choose Seedream 5 Lite when you want cheaper exploration, more references, up to five candidates, or a 3K output option.",
    candidates: [
      {
        name: "Seedream 5 Pro",
        provider: "ByteDance",
        modelId: "bytedance/seedream-5-pro",
        href: "/ai/models/seedream-5-pro",
        image: "/showcase/case6.jpg",
        imageAlt: "Polished neon editorial portrait representing Seedream 5 Pro",
        summary: "Focused choice for polished commercial stills and common publishing formats.",
      },
      {
        name: "Seedream 5 Lite",
        provider: "ByteDance",
        modelId: "bytedance/seedream-5-lite",
        image: "/showcase/case250.jpg",
        imageAlt: "Colorful fashion image representing Seedream 5 Lite exploration",
        summary: "Lower-cost option with more references, batch output, and up to 3K delivery.",
      },
    ],
    comparisonRows: [
      { label: "Starting credits", values: ["3", "2"] },
      { label: "Resolution in tuziyo", values: ["1K or 2K", "2K or 3K"] },
      { label: "Reference images", values: ["Up to 10", "Up to 14"] },
      { label: "Images per run", values: ["1", "1–5"] },
      { label: "Aspect ratios", values: ["11 plus auto", "7 core ratios"] },
      { label: "Output format", values: ["PNG or JPEG", "PNG or JPEG"] },
      {
        label: "Best starting point",
        values: ["Selected commercial still", "Cost-aware exploration"],
      },
    ],
    decisions: [
      {
        title: "Choose Seedream 5 Pro",
        description:
          "Use Pro when you have a clear art direction and want a focused, polished 1K–2K commercial or editorial still.",
        candidateIndex: 0,
      },
      {
        title: "Choose Seedream 5 Lite",
        description:
          "Use Lite when exploration cost, fourteen references, several candidates, or a 3K result matters more than the broader Pro ratio list.",
        candidateIndex: 1,
      },
    ],
    criteria: [
      {
        title: "Start at the base setting",
        description:
          "Compare one Pro 1K result with one Lite 2K result before increasing resolution or output count.",
      },
      {
        title: "Keep references identical",
        description:
          "Use no more than ten references in the first comparison so both models receive the same context.",
      },
      {
        title: "Separate polish from fidelity",
        description:
          "Judge visual finish and subject consistency independently; the prettier output may not preserve the product or person better.",
      },
      {
        title: "Include batch economics",
        description:
          "When exploring, compare the cost of several usable directions rather than one generated image.",
      },
    ],
    scenarios: [
      {
        title: "Single campaign still",
        recommendation: "Seedream 5 Pro",
        reason: "The focused Pro workflow is designed around polished commercial direction.",
      },
      {
        title: "Five composition ideas",
        recommendation: "Seedream 5 Lite",
        reason: "Lite can return up to five images from the same setup.",
      },
      {
        title: "Reference-heavy concept",
        recommendation: "Seedream 5 Lite",
        reason: "It accepts up to fourteen references compared with ten for Pro.",
      },
      {
        title: "Ultrawide visual",
        recommendation: "Seedream 5 Pro",
        reason: "Pro includes 21:9, while Lite stays with seven common ratios.",
      },
    ],
    faqs: [
      {
        question: "Is Seedream 5 Pro always better than Seedream 5 Lite?",
        answer:
          "No. Pro is the focused polished-still option, while Lite starts cheaper and currently offers more references, batch output, and a 3K setting in tuziyo.",
      },
      {
        question: "Which Seedream 5 model is cheaper?",
        answer:
          "Seedream 5 Lite starts at two credits and Seedream 5 Pro starts at three. Resolution and the number of requested Lite outputs affect total cost.",
      },
      {
        question: "Which model supports more references?",
        answer:
          "Seedream 5 Lite accepts up to fourteen reference images; Seedream 5 Pro accepts up to ten.",
      },
    ],
    relatedLinks: [
      {
        label: "Seedream 5 Pro guide",
        href: "/ai/models/seedream-5-pro",
        description: "Explore its 1K–2K workflow, formats, and prompt blueprints.",
      },
      {
        label: "Product photography comparison",
        href: "/ai/compare/best-ai-model-for-product-photography",
        description: "See where Seedream fits beside Google and OpenAI models.",
      },
      {
        label: "AI image prompt examples",
        href: "/prompts/ai-image-prompts-examples",
        description: "Use a consistent prompt to test Pro and Lite.",
      },
    ],
  },
} satisfies Record<string, ComparisonPageData>

export type ComparisonPageSlug = keyof typeof COMPARISON_PAGES

export function isComparisonPageSlug(value: string | undefined): value is ComparisonPageSlug {
  return Boolean(value && value in COMPARISON_PAGES)
}

export interface SeoPromptExample {
  title: string
  category: string
  ratio: string
  model: string
  modelId: string
  prompt: string
  whyItWorks: string
}

export const SEO_PROMPT_EXAMPLES: SeoPromptExample[] = [
  {
    title: "Reference-faithful skincare campaign",
    category: "Product photography",
    ratio: "4:5",
    model: "Nano Banana Pro",
    modelId: "google/nano-banana-pro",
    prompt:
      "Use the uploaded skincare bottle as the identity reference. Preserve its proportions, pump, glass color, label spelling, and logo exactly. Place it on pale limestone beside one translucent amber resin shape, with warm side light, a controlled reflection, and generous negative space above. Premium editorial product photography, realistic materials, no additional text or objects.",
    whyItWorks:
      "It separates fixed product details from the scene elements the model may redesign.",
  },
  {
    title: "Readable editorial cover",
    category: "Text and layout",
    ratio: "3:4",
    model: "GPT Image 2",
    modelId: "openai/gpt-image-2",
    prompt:
      "Create a restrained architecture magazine cover. A white concrete house occupies the lower two-thirds under a cobalt evening sky. Set the exact masthead 'FORM / LIGHT' across the top in a clean white serif. In the lower-left add only 'ISSUE 12 — SUMMER 2026'. Keep every character readable, preserve wide margins, and add no other words, symbols, or logos.",
    whyItWorks: "Exact copy, placement, hierarchy, and prohibited additions are stated explicitly.",
  },
  {
    title: "Four-frame courier storyboard",
    category: "Storyboards",
    ratio: "4:1",
    model: "Nano Banana 2",
    modelId: "google/nano-banana-2",
    prompt:
      "Create four equal cinematic frames featuring the same bicycle courier in a yellow rain jacket: checking a map under an awning, riding through blue evening rain, stopping outside a bookshop, and handing over a parcel. Preserve face, jacket, bicycle, weather, and screen direction across every frame. Natural urban lighting, realistic anatomy, no captions and no panel borders.",
    whyItWorks:
      "The sequence changes action while explicitly locking character and environment continuity.",
  },
  {
    title: "Clean marketplace packshot",
    category: "E-commerce",
    ratio: "1:1",
    model: "Seedream 5 Pro",
    modelId: "bytedance/seedream-5-pro",
    prompt:
      "Create a clean marketplace packshot from the uploaded ceramic speaker reference. Preserve the exact silhouette, grille pattern, controls, color, and logo. Center it on a warm off-white seamless background with a soft contact shadow and subtle three-quarter camera angle. Neutral studio lighting, sharp edges, realistic ceramic texture, no props, no added text.",
    whyItWorks:
      "The background is simple and every product invariant is named before the visual style.",
  },
  {
    title: "Consistent character portrait",
    category: "Characters",
    ratio: "2:3",
    model: "GPT Image 2",
    modelId: "openai/gpt-image-2",
    prompt:
      "Use the reference portrait for identity. Keep the same age, face shape, eye color, freckles, short copper hair, and silver ear cuff. Reimagine the person as a deep-sea cartographer in a weathered navy pressure suit, photographed waist-up inside a dim research vessel. Soft green instrument light, realistic skin, 50 mm lens, no helmet, no text.",
    whyItWorks:
      "Identity traits are listed separately from costume, setting, camera, and lighting changes.",
  },
  {
    title: "Interior redesign without structural changes",
    category: "Interior design",
    ratio: "16:9",
    model: "Nano Banana 2",
    modelId: "google/nano-banana-2",
    prompt:
      "Use the uploaded room as the geometry and camera reference. Keep the walls, windows, floor, ceiling, doorway, perspective, and daylight unchanged. Replace only the furnishings with a calm reading room: one rust wool chair, a low oak shelf, a paper floor lamp, a cream rug, and two abstract prints. Physically plausible scale and shadows, no people, no structural alterations.",
    whyItWorks: "It defines an edit boundary before describing the new content.",
  },
  {
    title: "Ultra-wide outdoor launch image",
    category: "Campaign art",
    ratio: "8:1",
    model: "Nano Banana 2",
    modelId: "google/nano-banana-2",
    prompt:
      "An ultra-wide launch landscape for the uploaded trail shoe, moving from misty pine forest at left through a granite ridge to sunrise grassland at right. Keep the shoe geometrically accurate and large near the center-left with a believable contact shadow. Premium outdoor art direction, restrained motion in the laces, clear visual flow across the panorama, no text, no duplicated product.",
    whyItWorks:
      "The composition is designed for an extreme ratio rather than cropped from a standard scene.",
  },
  {
    title: "Graphic food social image",
    category: "Social content",
    ratio: "1:1",
    model: "Seedream 5 Lite",
    modelId: "bytedance/seedream-5-lite",
    prompt:
      "A graphic overhead photograph of one blood orange cut cleanly in half on matte ultramarine paper. A single stainless dessert spoon crosses the lower edge. Hard late-afternoon shadow at 30 degrees, saturated complementary color, tactile paper fibers, and clean negative space in the upper-right for later copy. No text, no extra fruit, no border.",
    whyItWorks:
      "A small prop count, precise geometry, and planned negative space keep the result controllable.",
  },
]
