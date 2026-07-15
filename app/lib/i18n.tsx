import { createContext, useContext, useState, useEffect, useCallback } from "react"

export type Language = "en" | "zh" | "fr" | "ja" | "ko" | "ru" | "it"

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "简体中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  it: "Italiano",
}

export interface Translations {
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
    changeLanguage: string
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

type HomeMarketingTranslations = Pick<
  Translations["home"],
  | "heroLead"
  | "heroBody"
  | "start"
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

const enHomeMarketing: HomeMarketingTranslations = {
  heroLead: "Create any visual you can imagine",
  heroBody:
    "A cinematic creative workspace for generating images and videos, editing pictures, and preparing polished assets for every project.",
  start: "Start Free Now",
  proofAriaLabel: "Creative model and tool strip",
  generationTitle: "Everything you need to shape the shot",
  generationDesc:
    "Move from idea to finished asset with image creation, video direction, and practical editing tools in one elegant flow.",
  imageTitle: "Image creation",
  imageDesc: "Create product shots, campaign visuals, covers, and concept frames with a polished production look.",
  imageAction: "Create image",
  videoTitle: "Video concepts",
  videoDesc: "Explore cinematic motion ideas for ads, stories, launch films, and visual experiments.",
  videoAction: "Create video",
  toolkitTitle: "Picture finishing",
  toolkitDesc: "Retouch, crop, resize, and convert images so every output is ready to publish.",
  galleryTitle: "High-impact visuals for every format",
  galleryDesc: "From posters and product scenes to social cuts and cinematic frames, keep the visual direction consistent.",
  galleryImageAlt: "Creative visual sample",
  browse: "Open studio",
  voicesTitle: "From idea to final asset",
  voicesDesc: "Generate the direction, refine the frame, then export images and video-ready assets without breaking momentum.",
  ctaTitle: "Make your next visual with tuziyo",
  ctaDesc: "Start with an idea, shape the look, and finish it with the tools your content needs.",
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
    [
      "Edit",
      "Image finishing",
      "Repair, crop, resize, and convert outputs without breaking the creative flow.",
    ],
    [
      "Export",
      "Ready to use",
      "Prepare final assets for campaigns, social posts, product pages, and internal drafts.",
    ],
  ],
}

const zhHomeMarketing: HomeMarketingTranslations = {
  heroLead: "创作你想象中的任何视觉",
  heroBody: "一个有电影质感的创作工作区，用来生成图片和视频、编辑图片，并整理出适合项目使用的成品资产。",
  start: "免费开始",
  proofAriaLabel: "创作模型与工具条",
  generationTitle: "从想法到画面，一套工具完成",
  generationDesc: "把图片创作、视频方向和实用图片处理放在一个优雅流程里，从概念到成品更顺。",
  imageTitle: "图片创作",
  imageDesc: "生成产品图、营销视觉、封面和概念帧，保持更成熟的视觉质感。",
  imageAction: "创建图片",
  videoTitle: "视频概念",
  videoDesc: "探索适合广告、故事、发布短片和创意测试的电影感动态画面。",
  videoAction: "创建视频",
  toolkitTitle: "图片精修处理",
  toolkitDesc: "修补、裁剪、调整尺寸、转换格式，让每张图都能直接进入发布流程。",
  galleryTitle: "适配各种格式的高质感视觉",
  galleryDesc: "从海报、产品场景到社媒切图和电影感画面，保持一致的视觉方向。",
  galleryImageAlt: "创意视觉示例",
  browse: "打开创作台",
  voicesTitle: "从想法到成品资产",
  voicesDesc: "确定方向、完善画面，再导出图片和视频可用素材，不打断创作节奏。",
  ctaTitle: "用 tuziyo 创作下一张视觉",
  ctaDesc: "从一个想法开始，塑造画面质感，再用合适工具完成它。",
  register: "免费开始",
  testimonials: [
    ["提示词", "创意简报", "从一句想法、一个产品方向或一张参考图开始。"],
    ["生成", "图片与视频", "在同一个工作区生成静态视觉和短视频概念。"],
    ["编辑", "图片收尾", "修复、裁剪、调整尺寸和转换格式，不打断创作流程。"],
    ["导出", "可直接使用", "准备适合营销、社媒、商品页和内部提案的最终资产。"],
  ],
}

const homeMarketingByLanguage: Record<Language, HomeMarketingTranslations> = {
  en: enHomeMarketing,
  zh: zhHomeMarketing,
  fr: enHomeMarketing,
  ja: enHomeMarketing,
  ko: enHomeMarketing,
  ru: enHomeMarketing,
  it: enHomeMarketing,
}

export const translations: Record<Language, Translations> = {
  en: {
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
      aiToolkit: "AI Studio",
      pricing: "Pricing",
      login: "Log in",
      register: "Register free",
      profile: "Profile",
      logout: "Logout",
      home: "Home",
      mainNavigation: "Main navigation",
      changeLanguage: "Change language",
      openUserMenu: "Open user menu",
      openMenu: "Open menu",
    },
    pricing: {
      activeSubscriptionTip: "You seem to already have an active subscription.",
    },
    home: {
      ...homeMarketingByLanguage.en,
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
      description:
        "Convert between PNG, JPG, and WEBP formats instantly while maintaining quality.",
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
  },
  zh: {
    common: {
      tools: "常用工具",
      uploadImage: "上传图片",
      saveResult: "保存结果",
      processing: "AI 处理中...",
      ready: "引擎就绪",
      freeForever: "提示词生成图片与视频",
      safetyPrivate: "安全隐私 • 本地处理",
      status: "状态",
      actions: "操作",
      source: "源文件",
      size: "大小",
      completed: "已完成",
      failed: "失败",
      free: "比例自由",
      total: "合计",
    },
    nav: {
      aiToolkit: "AI 创作台",
      pricing: "订阅价格",
      login: "登录",
      register: "注册免费使用",
      profile: "个人中心",
      logout: "退出登录",
      home: "首页",
      mainNavigation: "主导航",
      changeLanguage: "切换语言",
      openUserMenu: "打开用户菜单",
      openMenu: "打开菜单",
    },
    pricing: {
      activeSubscriptionTip: "你似乎已有有效的订阅。",
    },
    home: {
      ...homeMarketingByLanguage.zh,
      privacyTitle: "提示词工作区",
      privacyDesc: "在同一个会话中管理提示词、参考图、反向提示词和输出参数。",
      speedTitle: "模型路由",
      speedDesc: "在图片与视频模型之间切换，同时保留完整创意简报。",
      aiDesc: "生成、对比并沿着最好的结果继续迭代，不丢失上下文。",
    },
    aiToolkit: {
      promptPlaceholder: "描述你的图片...",
      generating: "生成中...",
      newSession: "新建会话",
    },
    inpainting: {
      title: "AI 图像修复",
      description: "使用 AI 技术移除图像中的不需要的物体",
      dropzone: "将图片拖到此处",
      history: "编辑历史",
      brushSize: "画笔大小",
      aiPowered: "AI 驱动",
      newImage: "新图片",
      showMask: "显示遮罩",
      hideMask: "隐藏遮罩",
      clearMask: "清除遮罩",
      inpaint: "开始修复",
      processing: "处理中...",
      showOriginal: "显示原图",
      hideOriginal: "隐藏原图",
      download: "下载",
      editor: "编辑器",
      downloadingModel: "正在下载 AI 模型",
      loadingModel: "正在加载 AI 模型",
      downloadedFromCDN: "已从 CDN 下载",
      initializingModel: "正在初始化模型...",
      processingImage: "正在处理图像",
      complete: "完成",
    },
    resize: {
      title: "专家级尺寸调节",
      pixels: "像素 (px)",
      percentage: "百分比 (%)",
      width: "宽度",
      height: "高度",
      aspectRatio: "锁定纵横比",
      zoom: "预览缩放",
    },
    crop: {
      title: "高精度裁剪",
      aspectRatio: "宽高比",
      format: "输出格式",
      downloadAll: "保存全部图片",
    },
    convert: {
      title: "批量格式转换",
      description: "在 PNG、JPG、WEBP 格式间快速转换，在保证画质的同时优化体积。",
      targetFormat: "目标格式",
      quality: "转换质量",
      convertAll: "开始所有任务",
      supportedFormats: "支持的格式",
      inputFormats: "输入：HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "输出：WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - AI 图片与视频生成创作台",
      description: "通过提示词和多种 AI 模型生成图片与视频，支持会话、参考图和可控输出参数。",
      keywords: "AI图片生成, AI视频生成, 提示词工作台, 多模型生成, tuziyo, AI创作工具",
      resizeTitle: "批量图片缩放 | 按百分比或像素调整图片尺寸",
      resizeDesc: "精准批量缩放多张图片。支持纵横比锁定和百分比缩放，100%隐私安全且速度极快。",
      resizeKeywords: "在线批量缩放图片, 图片百分比缩放, 社交媒体图片尺寸调整, 浏览器快速缩放图片",
      cropTitle: "高精度图片裁剪 | 支持固定比例的在线裁剪工具",
      cropDesc: "像素级精准裁剪图片。预设 16:9、4:3 和 1:1 比例。浏览器内无损高清渲染。",
      cropKeywords: "在线免费裁剪图片, 4:3 图片裁剪, 像素级裁剪工具, 浏览器图片缩放裁剪",
      convertTitle: "隐私批量图像转换 | HEIC 转 PNG, JPG, WebP",
      convertDesc:
        "即时转换图片格式。安全处理 HEIC、PNG 和 JPEG 批量任务。所有图片保留在您的设备中。",
      convertKeywords: "免费 HEIC 转 PNG, 无上传批量图像转换, 安全照片格式转换, 在线 WebP 转换器",
      inpaintingTitle: "AI 图像修复 | 在线高清照片修复工具",
      inpaintingDesc:
        "专业 AI 图像修复工具。移除不需要的物体、修复照片、填补缺失区域，高质量结果。WebGPU 加速，100% 隐私保护。",
      inpaintingKeywords:
        "AI 图像修复在线, 照片修复工具, 免费图片修复, 移除照片物体, 填补缺失区域, WebGPU 修复, MI-GAN",
    },
  },
  fr: {
    common: {
      tools: "Outils",
      uploadImage: "Télécharger l'image",
      saveResult: "Enregistrer",
      processing: "Traitement IA...",
      ready: "Moteur prêt",
      freeForever: "Sans compte",
      safetyPrivate: "Sûr & Privé • Traitement local",
      status: "Statut",
      actions: "Actions",
      source: "Fichier Source",
      size: "Taille",
      completed: "Terminé",
      failed: "Échoué",
      free: "Libre",
      total: "Total",
    },
    nav: {
      aiToolkit: "IA Toolkit",
      pricing: "Tarifs",
      login: "Se connecter",
      register: "Inscription gratuite",
      profile: "Profil",
      logout: "Déconnexion",
      home: "Accueil",
      mainNavigation: "Navigation principale",
      changeLanguage: "Changer de langue",
      openUserMenu: "Ouvrir le menu utilisateur",
      openMenu: "Ouvrir le menu",
    },
    pricing: {
      activeSubscriptionTip: "Il semble que vous ayez déjà un abonnement actif.",
    },
    home: {
      ...homeMarketingByLanguage.fr,
      privacyTitle: "Confidentialité Totale",
      privacyDesc:
        "Tout le traitement se fait localement. Vos images ne quittent jamais votre appareil.",
      speedTitle: "Vitesse de l'Éclair",
      speedDesc: "WASM optimisé et accélération GPU pour des résultats instantanés.",
      aiDesc: "Des réseaux neuronaux avancés pour une retouche d'image professionnelle.",
    },
    aiToolkit: {
      promptPlaceholder: "Décrivez votre image...",
      generating: "Génération...",
      newSession: "Nouvelle session",
    },
    inpainting: {
      title: "Inpainting IA",
      description: "Supprimez les objets indésirables de vos images avec l'IA",
      dropzone: "Déposez votre image ici",
      history: "Historique",
      brushSize: "Taille du pinceau",
      aiPowered: "Propulsé par l'IA",
      newImage: "Nouvelle image",
      showMask: "Afficher le masque",
      hideMask: "Masquer le masque",
      clearMask: "Effacer le masque",
      inpaint: "Restaurer",
      processing: "Traitement...",
      showOriginal: "Afficher l'original",
      hideOriginal: "Masquer l'original",
      download: "Télécharger",
      editor: "Éditeur",
      downloadingModel: "Téléchargement du modèle IA",
      loadingModel: "Chargement du modèle IA",
      downloadedFromCDN: "téléchargé depuis le CDN",
      initializingModel: "Initialisation du modèle...",
      processingImage: "Traitement de l'image",
      complete: "Terminé",
    },
    resize: {
      title: "Expert Redimensionnement",
      pixels: "Pixels (px)",
      percentage: "Pourcentage (%)",
      width: "Largeur",
      height: "Hauteur",
      aspectRatio: "Verrouiller ratio",
      zoom: "Zoom aperçu",
    },
    crop: {
      title: "Outil de Recadrage Précis",
      aspectRatio: "Ratio d'aspect",
      format: "Format de sortie",
      downloadAll: "Tout enregistrer",
    },
    convert: {
      title: "Convertisseur Groupé",
      description: "Convertissez instantanément entre PNG, JPG et WEBP sans perte de qualité.",
      targetFormat: "Format cible",
      quality: "Paramètres qualité",
      convertAll: "Démarrer les tâches",
      supportedFormats: "Formats Supportés",
      inputFormats: "Entrée : HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "Sortie : WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - Outils Image IA Professionnels | 100% Privé",
      description:
        "Outils IA gratuits dans le navigateur pour supprimer les filigranes, redimensionner en lot, recadrer avec précision et convertir.",
      keywords:
        "outils image ia gratuits, enlever filigrane en ligne, redimensionner images navigateur, recadrage photo pro, convertisseur image privé heic",
      resizeTitle: "Redimensionner Images IA | Ajuster par Pourcentage ou Pixels",
      resizeDesc:
        "Redimensionnez plusieurs images à la fois avec précision. Support du ratio d'aspect et échelle en pourcentage. Rapide et privé.",
      resizeKeywords:
        "redimensionner images lot ligne, redimensionneur pourcentage, taille image réseaux sociaux, mise à l'échelle photo rapide",
      cropTitle: "Recadrage Photo Précis | Ratios Fixes 16:9, 4:3, 1:1",
      cropDesc:
        "Recadrez avec une précision au pixel près. Rendu de haute qualité sans perte directement dans votre navigateur.",
      cropKeywords:
        "recadrer image ligne gratuit, recadrage photo 4:3, outil recadrage pixel, redimensionner et recadrer navigateur",
      convertTitle: "Convertisseur Image Privé | HEIC vers PNG, JPG, WebP",
      convertDesc:
        "Convertissez vos formats d'image instantanément. Traitement sécurisé pour HEIC, PNG et JPEG sans aucun upload.",
      convertKeywords:
        "convertisseur heic vers png gratuit, convertisseur image lot sans upload, changeur format photo sécurisé",
      inpaintingTitle: "Inpainting IA | Restauration Photo Haute Définition en Ligne",
      inpaintingDesc:
        "Outil professionnel d'inpainting IA. Supprimez objets indésirables, restaurez photos et remplissez zones manquantes avec résultats haute qualité. Accéléré WebGPU, 100% privé.",
      inpaintingKeywords:
        "inpainting ia en ligne, outil restauration image, réparation photo gratuit, supprimer objets photos, remplir zones manquantes, webgpu inpainting, mi-gan",
    },
  },
  ja: {
    common: {
      tools: "ツール",
      uploadImage: "画像をアップロード",
      saveResult: "結果を保存",
      processing: "AI処理中...",
      ready: "準備完了",
      freeForever: "登録不要",
      safetyPrivate: "安全・プライバシー • ローカル処理",
      status: "ステータス",
      actions: "操作",
      source: "ソースファイル",
      size: "サイズ",
      completed: "完了",
      failed: "失敗",
      free: "自由",
      total: "合計",
    },
    nav: {
      aiToolkit: "AI ツールキット",
      pricing: "料金",
      login: "ログイン",
      register: "無料登録",
      profile: "プロフィール",
      logout: "ログアウト",
      home: "tuziyo ホーム",
      mainNavigation: "メインナビゲーション",
      changeLanguage: "言語を変更",
      openUserMenu: "ユーザーメニューを開く",
      openMenu: "メニューを開く",
    },
    pricing: {
      activeSubscriptionTip: "有効なサブスクリプションをすでにお持ちのようです。",
    },
    home: {
      ...homeMarketingByLanguage.ja,
      privacyTitle: "究極のプライバシー",
      privacyDesc: "全ての処理はブラウザ内で完結。画像が外部へ送信されることはありません。",
      speedTitle: "圧倒的なスピード",
      speedDesc: "最適化されたWASMとGPU加速により、一瞬で処理を完了します。",
      aiDesc: "高度なニューラルネットワークが、プロ品質の画像修復を実現。",
    },
    aiToolkit: {
      promptPlaceholder: "画像を描述してください...",
      generating: "生成中...",
      newSession: "新規セッション",
    },
    inpainting: {
      title: "AI 画像修復",
      description: "AIを使って画像から不要なオブジェクトを削除します",
      dropzone: "ここに画像をドロップしてください",
      history: "編集履歴",
      brushSize: "ブラシサイズ",
      aiPowered: "AI搭載",
      newImage: "新しい画像",
      showMask: "マスクを表示",
      hideMask: "マスクを隠す",
      clearMask: "マスクをクリア",
      inpaint: "修復",
      processing: "処理中...",
      showOriginal: "オリジナルを表示",
      hideOriginal: "オリジナルを隠す",
      download: "ダウンロード",
      editor: "エディター",
      downloadingModel: "AIモデルをダウンロード中",
      loadingModel: "AIモデルを読み込み中",
      downloadedFromCDN: "CDNからダウンロード済み",
      initializingModel: "モデルを初期化中...",
      processingImage: "画像を処理中",
      complete: "完了",
    },
    resize: {
      title: "高度なリサイズ",
      pixels: "ピクセル (px)",
      percentage: "パーセント (%)",
      width: "幅",
      height: "高さ",
      aspectRatio: "比率を固定",
      zoom: "プレビュー拡大",
    },
    crop: {
      title: "精密切り抜き",
      aspectRatio: "アスペクト比",
      format: "出力形式",
      downloadAll: "すべて保存",
    },
    convert: {
      title: "一括形式変換",
      description: "PNG、JPG、WEBP形式の間で、画質を保ったまま一瞬で変換。",
      targetFormat: "ターゲット形式",
      quality: "品質設定",
      convertAll: "すべてのタスクを開始",
      supportedFormats: "対応フォーマット",
      inputFormats: "入力：HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "出力：WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - プロ仕様AI画像ツール | 完全無料・プライバシー保護",
      description:
        "ブラウザで完結するAI画像ツール。透かし消去、リサイズ、切り抜き、変換。アップロード不要で100%安全。",
      keywords:
        "無料AI画像ツール, 透かし消去 オンライン, 画像リサイズ 一括, 画像切り抜き プロ, 画像変換 安全 HEIC",
      resizeTitle: "画像リサイズ一括 | 比率やピクセルを指定して高速変換",
      resizeDesc:
        "複数画像を一度に精密リサイズ。アスペクト比維持やパーセント指定に対応。100%プライベートで高速。",
      resizeKeywords:
        "画像一括リサイズ オンライン, リサイズ パーセント指定, SNS画像サイズ変更 無料, 高速画像縮小ツール",
      cropTitle: "精密画像切り抜き | アスペクト比固定・ピクセル単位の調整",
      cropDesc:
        "ピクセル単位の精度で切り抜き。16:9、4:3、1:1などのプリセット。無劣化でブラウザ出力。",
      cropKeywords:
        "画像切り抜き オンライン 無料, 写真クロップ 4:3, ピクセル単位切り抜き, ブラウザ画像リサイズ",
      convertTitle: "安全な一括画像変換 | HEICからPNG、JPG、WebPへ",
      convertDesc:
        "画像形式を一瞬で変換。HEIC、PNG、JPEGの安全な一括処理。画像が外部へ送信されることはありません。",
      convertKeywords:
        "HEIC PNG 変換 無料, 画像一括変換 登録不要, 安全な画像フォーマット変更, WEBP変換 オンライン",
      inpaintingTitle: "AI画像修復 | オンライン高解像度写真復元",
      inpaintingDesc:
        "プロ仕様のAI画像修復ツール。不要なオブジェクトを削除、写真を復元、欠損部分を高品質で補完。WebGPU加速、100%プライベート。",
      inpaintingKeywords:
        "AI画像修復 オンライン, 画像復元ツール, 写真修復 無料, 写真からオブジェクト削除, 欠損部分補完, WebGPU修復, MI-GAN",
    },
  },
  ko: {
    common: {
      tools: "도구",
      uploadImage: "이미지 업로드",
      saveResult: "결과 저장",
      processing: "AI 처리 중...",
      ready: "엔진 준비됨",
      freeForever: "영구 무료 • 계정 불필요",
      safetyPrivate: "안전 보완 • 로컬 처리",
      status: "상태",
      actions: "작업",
      source: "소스 파일",
      size: "크기",
      completed: "완료됨",
      failed: "실패함",
      free: "자유 비율",
      total: "합계",
    },
    nav: {
      aiToolkit: "AI 툴킷",
      pricing: "가격",
      login: "로그인",
      register: "무료 가입",
      profile: "프로필",
      logout: "로그아웃",
      home: "tuziyo 홈",
      mainNavigation: "기본 탐색",
      changeLanguage: "언어 변경",
      openUserMenu: "사용자 메뉴 열기",
      openMenu: "메뉴 열기",
    },
    pricing: {
      activeSubscriptionTip: "이미 유효한 구독을 보유하고 계신 것 같습니다.",
    },
    home: {
      ...homeMarketingByLanguage.ko,
      privacyTitle: "철저한 개인정보 보호",
      privacyDesc:
        "모든 처리는 브라우저 내에서 로컬로 진행됩니다. 이미지가 외부로 전송되지 않습니다.",
      speedTitle: "초고속 성능",
      speedDesc: "최적화된 WASM 및 GPU 가속으로 지연 없는 결과를 제공합니다.",
      aiDesc: "고급 신경망 기술로 전문가 수준의 이미지 복원 및 보정을 실현합니다.",
    },
    aiToolkit: {
      promptPlaceholder: "이미지를 설명하세요...",
      generating: "생성 중...",
      newSession: "새 세션",
    },
    inpainting: {
      title: "AI 이미지 복원",
      description: "AI를 사용하여 이미지에서 원하지 않는 개체를 제거합니다",
      dropzone: "여기에 이미지를 드롭하세요",
      history: "편집 기록",
      brushSize: "브러시 크기",
      aiPowered: "AI 구동",
      newImage: "새 이미지",
      showMask: "마스크 표시",
      hideMask: "마스크 숨기기",
      clearMask: "마스크 지우기",
      inpaint: "복원",
      processing: "처리 중...",
      showOriginal: "원본 표시",
      hideOriginal: "원본 숨기기",
      download: "다운로드",
      editor: "편집기",
      downloadingModel: "AI 모델 다운로드 중",
      loadingModel: "AI 모델 로드 중",
      downloadedFromCDN: "CDN에서 다운로드됨",
      initializingModel: "모델 초기화 중...",
      processingImage: "이미지 처리 중",
      complete: "완료",
    },
    resize: {
      title: "전문가용 크기 조정",
      pixels: "픽셀 (px)",
      percentage: "백분율 (%)",
      width: "너비",
      height: "높이",
      aspectRatio: "종횡비 고정",
      zoom: "미리보기 확대",
    },
    crop: {
      title: "정밀 자르기 도구",
      aspectRatio: "종횡비",
      format: "출력 형식",
      downloadAll: "모두 저장",
    },
    convert: {
      title: "대량 형식 변환",
      description: "PNG, JPG, WEBP 간의 형식을 화질 저하 없이 즉시 변환하세요.",
      targetFormat: "대상 형식",
      quality: "품질 설정",
      convertAll: "모든 작업 시작",
      supportedFormats: "지원되는 형식",
      inputFormats: "입력: HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "출력: WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - 전문가용 AI 이미지 도구 | 100% 무료 및 개인정보 보호",
      description:
        "워터마크 제거, 일괄 크기 조정, 정밀 자르기 및 형식 변환을 위한 무료 브라우저 기반 AI 도구입니다. 업로드 없이 완벽한 프라이버시를 보장합니다.",
      keywords:
        "무료 AI 이미지 도구, 온라인 워터마크 제거 무료, 브라우저 이미지 일괄 크기 조정, 전문 사진 자르기, 개인용 이미지 변환기 HEIC",
      resizeTitle: "일괄 이미지 크기 조정기 | 백분율 또는 픽셀로 크기 조정",
      resizeDesc:
        "여러 이미지의 크기를 한 번에 정밀하게 조정하세요. 종횡비 고정 및 백분율 스케일링 지원. 100% 비공개 및 고속.",
      resizeKeywords:
        "온라인 이미지 일괄 크기 조정, 이미지 크기 조정 백분율, 소셜 미디어용 이미지 크기 조정, 고속 사진 스케일러",
      cropTitle: "정밀 이미지 자르기 | 고정 종횡비로 사진 자르기",
      cropDesc:
        "픽셀 단위의 정확도로 이미지를 자르세요. 16:9, 4:3, 1:1 프리셋 제공. 브라우저에서 고품질 무손실 렌더링.",
      cropKeywords:
        "온라인 무료 이미지 자르기, 4:3 사진 자르기 도구, 정밀 자르기 도구, 브라우저 이미지 크기 조정 및 자르기",
      convertTitle: "개인용 일괄 이미지 변환기 | HEIC를 PNG, JPG, WebP로",
      convertDesc:
        "이미지 형식을 즉시 변환하세요. HEIC, PNG, JPEG를 위한 안전한 일괄 처리. 이미지는 장치에만 유지됩니다.",
      convertKeywords:
        "무료 HEIC PNG 변환기, 업로드 없는 일괄 이미지 변환기, 안전한 사진 형식 변경, 온라인 WebP 변환기",
      inpaintingTitle: "AI 이미지 인페인팅 | 온라인 고해상도 사진 복원",
      inpaintingDesc:
        "전문가용 AI 이미지 인페인팅 도구. 원치 않는 개체 제거, 사진 복원, 누락된 영역을 고품질로 채웁니다. WebGPU 가속, 100% 비공개.",
      inpaintingKeywords:
        "AI 인페인팅 온라인, 이미지 복원 도구, 사진 수리 무료, 사진에서 개체 제거, 누락 영역 채우기, WebGPU 인페인팅, MI-GAN",
    },
  },
  ru: {
    common: {
      tools: "Инструменты",
      uploadImage: "Загрузить изображение",
      saveResult: "Сохранить результат",
      processing: "AI Обработка...",
      ready: "Движок готов",
      freeForever: "Без регистрации",
      safetyPrivate: "Безопасно и приватно • Локально",
      status: "Статус",
      actions: "Действия",
      source: "Исходный файл",
      size: "Размер",
      completed: "Завершено",
      failed: "Ошибка",
      free: "Свободно",
      total: "Всего",
    },
    nav: {
      aiToolkit: "AI Инструменты",
      pricing: "Цены",
      login: "Войти",
      register: "Бесплатная регистрация",
      profile: "Профиль",
      logout: "Выйти",
      home: "Главная tuziyo",
      mainNavigation: "Основная навигация",
      changeLanguage: "Сменить язык",
      openUserMenu: "Открыть меню пользователя",
      openMenu: "Открыть меню",
    },
    pricing: {
      activeSubscriptionTip: "Похоже, у вас уже есть активная подписка.",
    },
    home: {
      ...homeMarketingByLanguage.ru,
      privacyTitle: "Безупречная приватность",
      privacyDesc:
        "Вся обработка происходит локально в браузере. Ваши фото не покидают устройство.",
      speedTitle: "Молниеносная скорость",
      speedDesc: "Оптимизированный WASM и GPU ускорение для мгновенных результатов.",
      aiDesc: "Продвинутые нейросети обеспечивают профессиональное восстановление изображений.",
    },
    aiToolkit: {
      promptPlaceholder: "Опишите ваше изображение...",
      generating: "Генерация...",
      newSession: "Новая сессия",
    },
    inpainting: {
      title: "AI Восстановление",
      description: "Удаляйте нежелательные объекты с изображений с помощью ИИ",
      dropzone: "Перетащите изображение сюда",
      history: "История изменений",
      brushSize: "Размер кисти",
      aiPowered: "На базе ИИ",
      newImage: "Новое изображение",
      showMask: "Показать маску",
      hideMask: "Скрыть маску",
      clearMask: "Очистить маску",
      inpaint: "Удалить",
      processing: "Обработка...",
      showOriginal: "Показать оригинал",
      hideOriginal: "Скрыть оригинал",
      download: "Скачать",
      editor: "Редактор",
      downloadingModel: "Загрузка модели ИИ",
      loadingModel: "Загрузка модели ИИ",
      downloadedFromCDN: "загружено из CDN",
      initializingModel: "Инициализация модели...",
      processingImage: "Обработка изображения",
      complete: "Готово",
    },
    resize: {
      title: "Масштабирование фото",
      pixels: "Пиксели (px)",
      percentage: "Проценты (%)",
      width: "Ширина",
      height: "Высота",
      aspectRatio: "Сохранять пропорции",
      zoom: "Масштаб превью",
    },
    crop: {
      title: "Инструмент обрезки",
      aspectRatio: "Соотношение сторон",
      format: "Формат вывода",
      downloadAll: "Сохранить все",
    },
    convert: {
      title: "Пакетная конвертация",
      description: "Мгновенно конвертируйте между PNG, JPG и WEBP без потери качества.",
      targetFormat: "Формат назначения",
      quality: "Настройки качества",
      convertAll: "Запустить задачи",
      supportedFormats: "Поддерживаемые форматы",
      inputFormats: "Вход: HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "Выход: WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - Профессиональные AI инструменты для фото | Бесплатно и приватно",
      description:
        "Бесплатные браузерные AI инструменты для удаления водяных знаков, пакетного масштабирования и конвертации. Без загрузки на сервер.",
      keywords:
        "бесплатные ai фото инструменты, удалить водяной знак онлайн бесплатно, пакетное изменение размера браузер, конвертер фото приватный heic",
      resizeTitle: "Пакетное изменение размера | Масштабирование в процентах или пикселях",
      resizeDesc:
        "Точно меняйте размер множества фото сразу. Сохранение пропорций и масштабирование. 100% приватно и быстро.",
      resizeKeywords:
        "масштабирование фото онлайн пакет, изменение размера в процентах, ресайзер фото для соцсетей бесплатно",
      cropTitle: "Точная обрезка фото | Обрезка под заданное соотношение сторон",
      cropDesc:
        "Обрезайте фото с точностью до пикселя. Пресеты 16:9, 4:3, 1:1. Качественный рендеринг без потерь в браузере.",
      cropKeywords:
        "обрезка фото онлайн бесплатно, кроппер фото 4:3, инструмент точной обрезки, обрезать картинку в браузере",
      convertTitle: "Приватный пакетный конвертер | HEIC в PNG, JPG, WebP",
      convertDesc:
        "Мгновенно меняйте формат фото. Безопасная пакетная обработка HEIC, PNG и JPEG. Фото остаются на вашем устройстве.",
      convertKeywords:
        "конвертер HEIC в PNG бесплатно, пакетный конвертер без загрузки, безопасный конвертер форматов, WebP конвертер онлайн",
      inpaintingTitle: "AI инпейнтинг | Восстановление фото в HD качестве онлайн",
      inpaintingDesc:
        "Профессиональный инструмент AI инпейнтинга. Удаляйте нежелательные объекты, восстанавливайте фото и заполняйте пропущенные области с высоким качеством. WebGPU ускорение, 100% приватно.",
      inpaintingKeywords:
        "ai инпейнтинг онлайн, инструмент восстановления фото, ремонт фото бесплатно, удалить объекты с фото, заполнить пропущенные области, webgpu инпейнтинг, mi-gan",
    },
  },
  it: {
    common: {
      tools: "Strumenti",
      uploadImage: "Carica Immagine",
      saveResult: "Salva Risultato",
      processing: "Elaborazione IA...",
      ready: "Motore Pronto",
      freeForever: "Senza account",
      safetyPrivate: "Sicuro & Privato • Locale",
      status: "Stato",
      actions: "Azioni",
      source: "File Sorgente",
      size: "Dimensione",
      completed: "Completato",
      failed: "Fallito",
      free: "Libero",
      total: "Totale",
    },
    nav: {
      aiToolkit: "Toolkit IA",
      pricing: "Prezzi",
      login: "Accedi",
      register: "Registrati gratis",
      profile: "Profilo",
      logout: "Esci",
      home: "Home tuziyo",
      mainNavigation: "Navigazione principale",
      changeLanguage: "Cambia lingua",
      openUserMenu: "Apri menu utente",
      openMenu: "Apri menu",
    },
    pricing: {
      activeSubscriptionTip: "Sembra che tu abbia già un abbonamento attivo.",
    },
    home: {
      ...homeMarketingByLanguage.it,
      privacyTitle: "Privacy Totale",
      privacyDesc:
        "Tutta l'elaborazione avviene localmente. Le tue immagini non lasciano mai il dispositivo.",
      speedTitle: "Velocità Lampo",
      speedDesc: "WASM ottimizzato e accelerazione GPU per risultati immediati.",
      aiDesc: "Reti neurali avanzate per un fotoritocco di livello professionale.",
    },
    aiToolkit: {
      promptPlaceholder: "Descrivi la tua immagine...",
      generating: "Generazione...",
      newSession: "Nuova sessione",
    },
    inpainting: {
      title: "Restauro Immagini IA",
      description: "Rimuovi oggetti indesiderati dalle tue immagini con l'IA",
      dropzone: "Trascina la tua immagine qui",
      history: "Cronologia Modifiche",
      brushSize: "Dimensione Pennello",
      aiPowered: "Alimentato da IA",
      newImage: "Nuova Immagine",
      showMask: "Mostra Maschera",
      hideMask: "Nascondi Maschera",
      clearMask: "Cancella Maschera",
      inpaint: "Rimuovi",
      processing: "Elaborazione...",
      showOriginal: "Mostra Originale",
      hideOriginal: "Nascondi Originale",
      download: "Scarica",
      editor: "Editor",
      downloadingModel: "Download Modello IA",
      loadingModel: "Caricamento Modello IA",
      downloadedFromCDN: "scaricato dal CDN",
      initializingModel: "Inizializzazione modello...",
      processingImage: "Elaborazione Immagine",
      complete: "Completato",
    },
    resize: {
      title: "Ridimensionamento Esperto",
      pixels: "Pixel (px)",
      percentage: "Percentuale (%)",
      width: "Larghezza",
      height: "Altezza",
      aspectRatio: "Blocca Proporzioni",
      zoom: "Zoom Anteprima",
    },
    crop: {
      title: "Ritaglio di Precisione",
      aspectRatio: "Rapporto Aspetto",
      format: "Formato Uscita",
      downloadAll: "Salva Tutte",
    },
    convert: {
      title: "Convertitore Bulk",
      description: "Converti istantaneamente tra PNG, JPG e WEBP mantenendo la qualità.",
      targetFormat: "Formato destinazione",
      quality: "Impostazioni qualità",
      convertAll: "Avvia attività",
      supportedFormats: "Formati Supportati",
      inputFormats: "Ingresso: HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "Uscita: WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - Strumenti Immagine IA Professionali | 100% Gratis & Privato",
      description:
        "Strumenti IA gratuiti nel browser per rimozione filigrana, ridimensionamento batch e conversione. Nessun upload, privacy totale.",
      keywords:
        "strumenti immagine ai gratuiti, rimuovere filigrana online gratis, ridimensionare immagini batch browser, convertitore immagine privato heic",
      resizeTitle: "Ridimensionatore Immagini Batch | Ridimensiona per Percentuale o Pixel",
      resizeDesc:
        "Ridimensiona più immagini contemporaneamente con precisione. Supporto blocco proporzioni e scaling percentuale.",
      resizeKeywords:
        "ridimensionare immagini online batch, ridimensionatore immagini percentuale, ridimensionatore foto social gratis",
      cropTitle: "Ritaglio Immagine Preciso | Rapporti Aspetto Fissi 16:9, 4:3, 1:1",
      cropDesc:
        "Ritaglia immagini con precisione al pixel. Rendering di alta qualità senza perdite nel tuo browser.",
      cropKeywords:
        "ritagliare immagine online gratis, ritaglio foto 4:3, strumento ritaglio pixel, ridimensiona e ritaglia browser",
      convertTitle: "Convertitore Immagini Batch Privato | HEIC in PNG, JPG, WebP",
      convertDesc:
        "Converti formati immagine istantaneamente. Elaborazione batch sicura per HEIC, PNG e JPEG senza alcun caricamento.",
      convertKeywords:
        "convertitore heic png gratis, convertitore immagini batch senza upload, convertitore formato foto sicuro, convertitore webp online",
      inpaintingTitle: "Inpainting AI | Restauro Foto Alta Definizione Online",
      inpaintingDesc:
        "Strumento professionale di inpainting AI. Rimuovi oggetti indesiderati, restaura foto e riempi aree mancanti con risultati di alta qualità. Accelerato WebGPU, 100% privato.",
      inpaintingKeywords:
        "inpainting ai online, strumento restauro immagini, riparazione foto gratis, rimuovere oggetti dalle foto, riempire aree mancanti, webgpu inpainting, mi-gan",
    },
  },
}

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("tuziyo-lang") as Language
    if (saved && translations[saved]) {
      setLangState(saved)
    } else {
      const browserLang = navigator.language.split("-")[0] as Language
      if (translations[browserLang]) {
        setLangState(browserLang)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem("tuziyo-lang", newLang)
  }, [])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}
