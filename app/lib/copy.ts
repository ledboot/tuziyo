export interface EnglishCopy {
  common: {
    tools: string
    uploadImage: string
    saveResult: string
    processing: string
    ready: string
    freeForever: string
    safetyPrivate: string
    status: string
    actions: string
    source: string
    size: string
    completed: string
    failed: string
    free: string
    total: string
  }
  nav: {
    aiToolkit: string
    pricing: string
    login: string
    register: string
    profile: string
    logout: string
    home: string
    mainNavigation: string
    openUserMenu: string
    openMenu: string
  }
  pricing: {
    activeSubscriptionTip: string
  }
  home: {
    heroLead: string
    heroBody: string
    start: string
    freeCreditNote: string
    proofAriaLabel: string
    generationTitle: string
    generationDesc: string
    imageTitle: string
    imageDesc: string
    imageAction: string
    videoTitle: string
    videoDesc: string
    videoAction: string
    toolkitTitle: string
    toolkitDesc: string
    toolkitAction: string
    galleryTitle: string
    galleryDesc: string
    galleryImageAlt: string
    browse: string
    voicesTitle: string
    voicesDesc: string
    ctaTitle: string
    ctaDesc: string
    register: string
    testimonials: [string, string, string][]
    privacyTitle: string
    privacyDesc: string
    speedTitle: string
    speedDesc: string
    aiDesc: string
  }
  aiToolkit: {
    promptPlaceholder: string
    generating: string
    newSession: string
  }
  inpainting: {
    title: string
    description: string
    dropzone: string
    history: string
    brushSize: string
    aiPowered: string
    newImage: string
    showMask: string
    hideMask: string
    clearMask: string
    inpaint: string
    processing: string
    showOriginal: string
    hideOriginal: string
    download: string
    editor: string
    downloadingModel: string
    loadingModel: string
    downloadedFromCDN: string
    initializingModel: string
    processingImage: string
    complete: string
  }
  resize: {
    title: string
    pixels: string
    percentage: string
    width: string
    height: string
    aspectRatio: string
    zoom: string
  }
  crop: {
    title: string
    aspectRatio: string
    format: string
    downloadAll: string
  }
  convert: {
    title: string
    description: string
    targetFormat: string
    quality: string
    convertAll: string
    supportedFormats: string
    inputFormats: string
    outputFormats: string
  }
  seo: {
    title: string
    description: string
    keywords: string
    resizeTitle: string
    resizeDesc: string
    resizeKeywords: string
    cropTitle: string
    cropDesc: string
    cropKeywords: string
    convertTitle: string
    convertDesc: string
    convertKeywords: string
    inpaintingTitle: string
    inpaintingDesc: string
    inpaintingKeywords: string
  }
}

type HomeMarketingCopy = Pick<
  EnglishCopy["home"],
  | "heroLead"
  | "heroBody"
  | "start"
  | "freeCreditNote"
  | "proofAriaLabel"
  | "generationTitle"
  | "generationDesc"
  | "imageTitle"
  | "imageDesc"
  | "imageAction"
  | "videoTitle"
  | "videoDesc"
  | "videoAction"
  | "toolkitTitle"
  | "toolkitDesc"
  | "toolkitAction"
  | "galleryTitle"
  | "galleryDesc"
  | "galleryImageAlt"
  | "browse"
  | "voicesTitle"
  | "voicesDesc"
  | "ctaTitle"
  | "ctaDesc"
  | "register"
  | "testimonials"
>

const homeMarketing: HomeMarketingCopy = {
  heroLead: "Create any visual you can imagine",
  heroBody:
    "A cinematic creative workspace for generating images and videos, comparing model strengths, and keeping every creative direction in context.",
  start: "Start Free Now",
  freeCreditNote: "10 free credits for every new account. No credit card required.",
  proofAriaLabel: "Creative model and tool strip",
  generationTitle: "Everything you need to shape the shot",
  generationDesc:
    "Move from a creative brief to image and video variations while keeping model choices, references, and outputs in one focused workflow.",
  imageTitle: "Image creation",
  imageDesc:
    "Create product shots, campaign visuals, covers, and concept frames with a polished production look.",
  imageAction: "Create image",
  videoTitle: "Video concepts",
  videoDesc:
    "Explore cinematic motion ideas for ads, stories, launch films, and visual experiments.",
  videoAction: "Create video",
  toolkitTitle: "Model comparison",
  toolkitDesc:
    "Compare current controls, reference support, credit costs, and best-fit use cases before you generate.",
  toolkitAction: "Compare models",
  galleryTitle: "High-impact visuals for every format",
  galleryDesc:
    "From posters and product scenes to social cuts and cinematic frames, keep the visual direction consistent.",
  galleryImageAlt: "Creative visual sample",
  browse: "Open studio",
  voicesTitle: "From idea to final asset",
  voicesDesc:
    "Generate a direction, compare variations, and organize reusable images and video shots without losing the original brief.",
  ctaTitle: "Make your next visual with tuziyo",
  ctaDesc:
    "Start with an idea, compare creative directions, and carry the strongest result forward.",
  register: "Start Free Now",
  testimonials: [
    [
      "Prompt",
      "Creative brief",
      "Start from a short idea, a product direction, or a reference frame.",
    ],
    [
      "Generate",
      "Image and video",
      "Create still visuals and short motion concepts from the same workspace.",
    ],
    ["Compare", "Model choice", "Review variations and choose the model that best fits the brief."],
    [
      "Organize",
      "Ready to reuse",
      "Keep useful outputs available for campaigns, stories, and future iterations.",
    ],
  ],
}
export const copy: EnglishCopy = {
  common: {
    tools: "Tools",
    uploadImage: "Upload Image",
    saveResult: "Save Result",
    processing: "AI Processing...",
    ready: "Engine Ready",
    freeForever: "Prompt to image and video",
    safetyPrivate: "Safe & Private • Local Processing",
    status: "Status",
    actions: "Actions",
    source: "Source File",
    size: "Size",
    completed: "Completed",
    failed: "Failed",
    free: "Free",
    total: "Total",
  },
  nav: {
    aiToolkit: "AI Toolkit",
    pricing: "Pricing",
    login: "Log in",
    register: "Register free",
    profile: "Profile",
    logout: "Logout",
    home: "Home",
    mainNavigation: "Main navigation",
    openUserMenu: "Open user menu",
    openMenu: "Open menu",
  },
  pricing: {
    activeSubscriptionTip: "You seem to already have an active subscription.",
  },
  home: {
    ...homeMarketing,
    privacyTitle: "Prompt Workspace",
    privacyDesc:
      "Keep prompts, references, negative prompts, and output settings together in one session.",
    speedTitle: "Model Routing",
    speedDesc: "Move between image and video models while preserving your creative brief.",
    aiDesc: "Generate, compare, and continue from the strongest result without losing context.",
  },
  aiToolkit: {
    promptPlaceholder: "Describe your image...",
    generating: "Generating...",
    newSession: "New Session",
  },
  inpainting: {
    title: "AI Image Inpainting",
    description: "Remove unwanted objects from your images with AI",
    dropzone: "Drop your image here",
    history: "Edit History",
    brushSize: "Brush Size",
    aiPowered: "AI Powered",
    newImage: "New Image",
    showMask: "Show Mask",
    hideMask: "Hide Mask",
    clearMask: "Clear Mask",
    inpaint: "Inpaint",
    processing: "Processing...",
    showOriginal: "Show Original",
    hideOriginal: "Hide Original",
    download: "Download",
    editor: "Editor",
    downloadingModel: "Downloading AI Model",
    loadingModel: "Loading AI Model",
    downloadedFromCDN: "downloaded from CDN",
    initializingModel: "Initializing model...",
    processingImage: "Processing Image",
    complete: "Complete",
  },
  resize: {
    title: "Expert Image Resizer",
    pixels: "Pixels (px)",
    percentage: "Percentage (%)",
    width: "Width",
    height: "Height",
    aspectRatio: "Lock Aspect Ratio",
    zoom: "Preview Zoom",
  },
  crop: {
    title: "Precision Crop Tool",
    aspectRatio: "Aspect Ratio",
    format: "Output Format",
    downloadAll: "Save All Images",
  },
  convert: {
    title: "Bulk Image Converter",
    description: "Convert between PNG, JPG, and WEBP formats instantly while maintaining quality.",
    targetFormat: "Target Format",
    quality: "Quality Settings",
    convertAll: "Start All Tasks",
    supportedFormats: "Supported Formats",
    inputFormats: "Input: HEIC, PNG, JPEG, WebP, GIF, BMP",
    outputFormats: "Output: WebP, PNG, JPEG",
  },
  seo: {
    title: "tuziyo.com - AI Image & Video Generation Studio",
    description:
      "Create images and videos from prompts with multiple AI models, reusable sessions, reference images, and production-ready output controls.",
    keywords:
      "tuziyo, ai image generator, ai video generator, prompt studio, multi model image generation, ai creative tools",
    resizeTitle: "Batch Image Resizer | Resize Images by Percentage or Pixels",
    resizeDesc:
      "Resize multiple images at once with precision. Support for aspect ratio locking and percentage scaling. 100% private and fast.",
    resizeKeywords:
      "tuziyo, bulk image resizer, image resizer online, ai image editor, resize images, image resizer percentage",
    cropTitle: "Precise Image Cropper | Crop Photos to Fixed Aspect Ratios",
    cropDesc:
      "Crop images with pixel-perfect accuracy. Presets for 16:9, 4:3, and 1:1. High-quality lossless rendering in your browser.",
    cropKeywords:
      "tuziyo, image cropping tool, crop image online, photo crop online, crop image online, online image crop, image cropping tool",
    convertTitle: "Private Batch Image Converter | HEIC to PNG, JPG, WebP",
    convertDesc:
      "Convert images between formats instantly. Secure batch processing for HEIC, PNG, and JPEG. Images stay on your device.",
    convertKeywords:
      "tuziyo, heic to jpg converter, batch image converter, webp jpg converter, png converter, jpg converter",
    inpaintingTitle: "AI Image Inpainting | High-Definition Photo Restoration Online",
    inpaintingDesc:
      "Professional AI-powered image inpainting tool. Remove unwanted objects, restore photos, and fill missing areas with high-quality results. WebGPU accelerated, 100% private.",
    inpaintingKeywords:
      "tuziyo, ai inpainting, remove object from image, powered by ai, photo inpainting, ai image editor",
  },
}
