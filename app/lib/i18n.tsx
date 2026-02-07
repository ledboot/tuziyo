import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type Language = "en" | "zh" | "fr" | "ja" | "ko" | "ru" | "it";

export interface Translations {
  common: {
    tools: string;
    aboutUs: string;
    resources: string;
    languages: string;
    uploadImage: string;
    saveResult: string;
    undo: string;
    loading: string;
    processing: string;
    ready: string;
    freeForever: string;
    safetyPrivate: string;
    status: string;
    actions: string;
    source: string;
    size: string;
    completed: string;
    failed: string;
    free: string;
    total: string;
    back: string;
    explore: string;
    ctaDesc: string;
    privacyPolicy: string;
    termsOfService: string;
    contactSupport: string;
  };
  nav: {
    inpainting: string;
    resize: string;
    crop: string;
    convert: string;
    x: string;
    github: string;
    about: string;
    blog: string;
    contactAuthor: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    getStarted: string;
    featuresTitle: string;
    privacyTitle: string;
    privacyDesc: string;
    speedTitle: string;
    speedDesc: string;
    aiTitle: string;
    aiDesc: string;
  };
  inpainting: {
    title: string;
    description: string;
    dropzone: string;
    history: string;
    brushSize: string;
    engine: string;
    comparison: string;
    splitView: string;
    sideBySide: string;
    currentVersion: string;
    iteration: string;
    aiModel: string;
    aiPowered: string;
    newImage: string;
    showMask: string;
    hideMask: string;
    clearMask: string;
    inpaint: string;
    processing: string;
    showOriginal: string;
    hideOriginal: string;
    download: string;
    editor: string;
    downloadingModel: string;
    loadingModel: string;
    downloadedFromCDN: string;
    initializingModel: string;
    processingImage: string;
    complete: string;
  };
  resize: {
    title: string;
    description: string;
    pixels: string;
    percentage: string;
    width: string;
    height: string;
    aspectRatio: string;
    zoom: string;
  };
  crop: {
    title: string;
    description: string;
    aspectRatio: string;
    format: string;
    downloadAll: string;
  };
  convert: {
    title: string;
    description: string;
    targetFormat: string;
    quality: string;
    convertAll: string;
    supportedFormats: string;
    inputFormats: string;
    outputFormats: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    watermarkTitle: string;
    watermarkDesc: string;
    watermarkKeywords: string;
    resizeTitle: string;
    resizeDesc: string;
    resizeKeywords: string;
    cropTitle: string;
    cropDesc: string;
    cropKeywords: string;
    convertTitle: string;
    convertDesc: string;
    convertKeywords: string;
    inpaintingTitle: string;
    inpaintingDesc: string;
    inpaintingKeywords: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      tools: "Tools",
      aboutUs: "About Us",
      resources: "Resources",
      languages: "Languages",
      uploadImage: "Upload Image",
      saveResult: "Save Result",
      undo: "Undo Last Step",
      loading: "Loading...",
      processing: "AI Processing...",
      ready: "Engine Ready",
      freeForever: "No Account Required",
      safetyPrivate: "Safe & Private • Local Processing",
      status: "Status",
      actions: "Actions",
      source: "Source File",
      size: "Size",
      completed: "Completed",
      failed: "Failed",
      free: "Free",
      total: "Total",
      back: "Go Back",
      explore: "Explore Tools",
      ctaDesc:
        "Experience professional-grade image tools with complete privacy. All processing happens locally in your browser.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      contactSupport: "Contact Support",
    },
    nav: {
      inpainting: "Inpainting",
      resize: "Resize",
      crop: "Crop",
      convert: "Convert",
      x: "X (Twitter)",
      github: "GitHub",
      about: "About Us",
      blog: "Blog",
      contactAuthor: "Contact Author",
    },
    home: {
      heroTitle: "Professional Image Tools. Reimagined with AI.",
      heroSubtitle:
        "The ultimate suite for image watermark removal, resizing, cropping, and conversion. Powered by local AI, 100% private and secure.",
      getStarted: "Start Processing",
      featuresTitle: "Why Choose tuziyo?",
      privacyTitle: "Pixel-Perfect Privacy",
      privacyDesc:
        "All processing happens locally in your browser. Your images never leave your device.",
      speedTitle: "Lightning Fast",
      speedDesc:
        "Powered by highly optimized WASM and GPU acceleration for instant results.",
      aiTitle: "State-of-the-art AI",
      aiDesc:
        "Advanced neural networks deliver professional-grade image inpainting and upscaling.",
    },
    inpainting: {
      title: "AI Image Inpainting",
      description: "Remove unwanted objects from your images with AI",
      dropzone: "Drop your image here",
      history: "Edit History",
      brushSize: "Brush Size",
      engine: "Processing Engine",
      comparison: "View Settings",
      splitView: "Split View",
      sideBySide: "Side-by-Side",
      currentVersion: "Current Version",
      iteration: "Iteration",
      aiModel: "AI Powered v2.4",
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
      description:
        "Scale your images perfectly with multiple modes and aspect ratio preservation.",
      pixels: "Pixels (px)",
      percentage: "Percentage (%)",
      width: "Width",
      height: "Height",
      aspectRatio: "Lock Aspect Ratio",
      zoom: "Preview Zoom",
    },
    crop: {
      title: "Precision Crop Tool",
      description:
        "Crop images with pixel-perfect accuracy and fixed aspect ratios.",
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
      title: "tuziyo.com - Professional AI Image Tools | 100% Private",
      description:
        "Browser-based AI tools for watermark removal, batch resizing, precise cropping, and format conversion. No uploads, total privacy.",
      keywords:
        "tuziyo, ai image editor, remove watermark online, bulk image resizer, image cropper, photo converter",
      watermarkTitle:
        "AI Watermark Remover | Remove Objects from Photos Online",
      watermarkDesc:
        "Use AI to remove watermarks, text, and unwanted objects from photos instantly in your browser. No registration, no watermarks left behind.",
      watermarkKeywords:
        "tuziyo, ai inpainting, remove object from image, powered by ai, photo inpainting, ai image editor",
      resizeTitle:
        "Batch Image Resizer | Resize Images by Percentage or Pixels",
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
      inpaintingTitle:
        "AI Image Inpainting | High-Definition Photo Restoration Online",
      inpaintingDesc:
        "Professional AI-powered image inpainting tool. Remove unwanted objects, restore photos, and fill missing areas with high-quality results. WebGPU accelerated, 100% private.",
      inpaintingKeywords:
        "tuziyo, ai inpainting, remove object from image, powered by ai, photo inpainting, ai image editor",
    },
  },
  zh: {
    common: {
      tools: "常用工具",
      aboutUs: "关于我们",
      resources: "相关资源",
      languages: "语言选择",
      uploadImage: "上传图片",
      saveResult: "保存结果",
      undo: "撤销上一步",
      loading: "加载中...",
      processing: "AI 处理中...",
      ready: "引擎就绪",
      freeForever: "无需注册",
      safetyPrivate: "安全隐私 • 本地处理",
      status: "状态",
      actions: "操作",
      source: "源文件",
      size: "大小",
      completed: "已完成",
      failed: "失败",
      free: "比例自由",
      total: "合计",
      back: "返回",
      explore: "浏览工具",
      ctaDesc: "体验专业级图像工具，完全隐私保护。所有处理均在浏览器本地完成。",
      privacyPolicy: "隐私政策",
      termsOfService: "服务条款",
      contactSupport: "联系支持",
    },
    nav: {
      inpainting: "图像修复",
      resize: "调整尺寸",
      crop: "图片裁剪",
      convert: "格式转换",
      x: "X (Twitter)",
      github: "GitHub",
      about: "关于我们",
      blog: "技术博客",
      contactAuthor: "联系作者",
    },
    home: {
      heroTitle: "专业图像工具，AI重塑体验。",
      heroSubtitle:
        "集水印移除、尺寸调整、裁剪与转换于一体的终极套件。基于本地AI驱动，100%隐私安全。",
      getStarted: "立即开始",
      featuresTitle: "为什么选择 tuziyo？",
      privacyTitle: "极致隐私保护",
      privacyDesc: "所有处理均在浏览器本地完成，您的图片永远不会上传到服务器。",
      speedTitle: "闪电般的处理速度",
      speedDesc: "采用高度优化的 WASM 和 GPU 加速，秒级呈现处理结果。",
      aiTitle: "顶尖 AI 技术",
      aiDesc: "先进的神经网络算法，提供专业级的图像修复与增强。",
    },
    inpainting: {
      title: "AI 图像修复",
      description: "使用 AI 技术移除图像中的不需要的物体",
      dropzone: "将图片拖到此处",
      history: "编辑历史",
      brushSize: "画笔大小",
      engine: "处理引擎",
      comparison: "对比设置",
      splitView: "拆分视图",
      sideBySide: "并排对比",
      currentVersion: "当前版本",
      iteration: "修复记录",
      aiModel: "AI 驱动 v2.4",
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
      description: "多种模式可选，完美保持纵横比，精准缩放您的每一张图片。",
      pixels: "像素 (px)",
      percentage: "百分比 (%)",
      width: "宽度",
      height: "高度",
      aspectRatio: "锁定纵横比",
      zoom: "预览缩放",
    },
    crop: {
      title: "高精度裁剪",
      description: "像素级精准裁剪，支持多种固定比例，助您快速构图。",
      aspectRatio: "宽高比",
      format: "输出格式",
      downloadAll: "保存全部图片",
    },
    convert: {
      title: "批量格式转换",
      description:
        "在 PNG、JPG、WEBP 格式间快速转换，在保证画质的同时优化体积。",
      targetFormat: "目标格式",
      quality: "转换质量",
      convertAll: "开始所有任务",
      supportedFormats: "支持的格式",
      inputFormats: "输入：HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "输出：WebP, PNG, JPEG",
    },
    seo: {
      title: "tuziyo - 专业AI图像工具 | 100%免费隐私安全",
      description:
        "基于浏览器的免费 AI 工具，集水印移除、批量调整尺寸、精准裁剪与格式转换于一体集。无需上传，全本地处理。",
      keywords:
        "AI图像工具, 在线移除水印, 浏览器批量调整图片尺寸, 专业图片裁剪, 隐私保护格式转换HEIC",
      watermarkTitle: "AI 智能消水印 | 在线免费移除图片水印与杂物",
      watermarkDesc:
        "使用AI瞬间移除图片中的水印、文字和多余物体。无需注册，不在图片上留痕，浏览器直出。",
      watermarkKeywords:
        "在线移除图片水印, AI 杂物清除工具免费, 擦除图片文字, 浏览器图片清理工具",
      resizeTitle: "批量图片缩放 | 按百分比或像素调整图片尺寸",
      resizeDesc:
        "精准批量缩放多张图片。支持纵横比锁定和百分比缩放，100%隐私安全且速度极快。",
      resizeKeywords:
        "在线批量缩放图片, 图片百分比缩放, 社交媒体图片尺寸调整, 浏览器快速缩放图片",
      cropTitle: "高精度图片裁剪 | 支持固定比例的在线裁剪工具",
      cropDesc:
        "像素级精准裁剪图片。预设 16:9、4:3 和 1:1 比例。浏览器内无损高清渲染。",
      cropKeywords:
        "在线免费裁剪图片, 4:3 图片裁剪, 像素级裁剪工具, 浏览器图片缩放裁剪",
      convertTitle: "隐私批量图像转换 | HEIC 转 PNG, JPG, WebP",
      convertDesc:
        "即时转换图片格式。安全处理 HEIC、PNG 和 JPEG 批量任务。所有图片保留在您的设备中。",
      convertKeywords:
        "免费 HEIC 转 PNG, 无上传批量图像转换, 安全照片格式转换, 在线 WebP 转换器",
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
      aboutUs: "À propos de nous",
      resources: "Ressources",
      languages: "Langues",
      uploadImage: "Télécharger l'image",
      saveResult: "Enregistrer",
      undo: "Annuler l'action",
      loading: "Chargement...",
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
      back: "Retour",
      explore: "Explorer les Outils",
      ctaDesc:
        "Découvrez des outils d'image professionnels avec une confidentialité totale. Tout le traitement se fait localement dans votre navigateur.",
      privacyPolicy: "Politique de Confidentialité",
      termsOfService: "Conditions d'Utilisation",
      contactSupport: "Contacter le Support",
    },
    nav: {
      inpainting: "Inpainting",
      resize: "Redimensionner",
      crop: "Recadrer",
      convert: "Convertir",
      x: "X (Twitter)",
      github: "GitHub",
      about: "À propos",
      blog: "Blog",
      contactAuthor: "Contacter l'auteur",
    },
    home: {
      heroTitle: "Outils Image Pros. Réimaginés par l'IA.",
      heroSubtitle:
        "La suite ultime pour le retrait de filigrane, le redimensionnement, le recadrage et la conversion. Propulsé par l'IA locale, 100 % privé.",
      getStarted: "Commencer",
      featuresTitle: "Pourquoi choisir tuziyo ?",
      privacyTitle: "Confidentialité Totale",
      privacyDesc:
        "Tout le traitement se fait localement. Vos images ne quittent jamais votre appareil.",
      speedTitle: "Vitesse de l'Éclair",
      speedDesc:
        "WASM optimisé et accélération GPU pour des résultats instantanés.",
      aiTitle: "IA de Pointe",
      aiDesc:
        "Des réseaux neuronaux avancés pour une retouche d'image professionnelle.",
    },
    inpainting: {
      title: "Inpainting IA",
      description: "Supprimez les objets indésirables de vos images avec l'IA",
      dropzone: "Déposez votre image ici",
      history: "Historique",
      brushSize: "Taille du pinceau",
      engine: "Moteur de traitement",
      comparison: "Paramètres vue",
      splitView: "Vue scindée",
      sideBySide: "Côte à côte",
      currentVersion: "Version actuelle",
      iteration: "Itération",
      aiModel: "Propulsé par l'IA v2.4",
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
      description:
        "Ajustez la taille de vos images parfaitement en conservant les proportions.",
      pixels: "Pixels (px)",
      percentage: "Pourcentage (%)",
      width: "Largeur",
      height: "Hauteur",
      aspectRatio: "Verrouiller ratio",
      zoom: "Zoom aperçu",
    },
    crop: {
      title: "Outil de Recadrage Précis",
      description:
        "Recadrez avec une précision au pixel près et des ratios fixes.",
      aspectRatio: "Ratio d'aspect",
      format: "Format de sortie",
      downloadAll: "Tout enregistrer",
    },
    convert: {
      title: "Convertisseur Groupé",
      description:
        "Convertissez instantanément entre PNG, JPG et WEBP sans perte de qualité.",
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
      watermarkTitle:
        "Enlever Filigrane IA | Supprimer Objets des Photos en Ligne Gratuit",
      watermarkDesc:
        "Utilisez l'IA pour supprimer filigranes, texte et objets indésirables instantanément. Sans inscription, 100% privé.",
      watermarkKeywords:
        "enlever filigrane photo ligne, suppression objet ia gratuit, effacer texte image, nettoyage photo navigateur",
      resizeTitle:
        "Redimensionner Images IA | Ajuster par Pourcentage ou Pixels",
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
      inpaintingTitle:
        "Inpainting IA | Restauration Photo Haute Définition en Ligne",
      inpaintingDesc:
        "Outil professionnel d'inpainting IA. Supprimez objets indésirables, restaurez photos et remplissez zones manquantes avec résultats haute qualité. Accéléré WebGPU, 100% privé.",
      inpaintingKeywords:
        "inpainting ia en ligne, outil restauration image, réparation photo gratuit, supprimer objets photos, remplir zones manquantes, webgpu inpainting, mi-gan",
    },
  },
  ja: {
    common: {
      tools: "ツール",
      aboutUs: "私たちについて",
      resources: "リソース",
      languages: "言語",
      uploadImage: "画像をアップロード",
      saveResult: "結果を保存",
      undo: "元に戻す",
      loading: "読み込み中...",
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
      back: "戻る",
      explore: "ツールを見る",
      ctaDesc:
        "完全なプライバシー保護でプロ仕様の画像ツールを体験。すべての処理はブラウザ内でローカルに実行されます。",
      privacyPolicy: "プライバシーポリシー",
      termsOfService: "利用規約",
      contactSupport: "お問い合わせ",
    },
    nav: {
      inpainting: "画像修復",
      resize: "リサイズ",
      crop: "切り抜き",
      convert: "形式変換",
      x: "X (Twitter)",
      github: "GitHub",
      about: "運営会社",
      blog: "ブログ",
      contactAuthor: "作者に連絡",
    },
    home: {
      heroTitle: "プロ仕様の画像ツール、AIで進化。",
      heroSubtitle:
        "透かし消去、リサイズ、切り抜き、変換。ローカルAI搭載で100%プライベート、安全な統合ツール。",
      getStarted: "今すぐ開始",
      featuresTitle: "tuziyoが選ばれる理由",
      privacyTitle: "究極のプライバシー",
      privacyDesc:
        "全ての処理はブラウザ内で完結。画像が外部へ送信されることはありません。",
      speedTitle: "圧倒的なスピード",
      speedDesc: "最適化されたWASMとGPU加速により、一瞬で処理を完了します。",
      aiTitle: "最先端のAI技術",
      aiDesc: "高度なニューラルネットワークが、プロ品質の画像修復を実現。",
    },
    inpainting: {
      title: "AI 画像修復",
      description: "AIを使って画像から不要なオブジェクトを削除します",
      dropzone: "ここに画像をドロップしてください",
      history: "編集履歴",
      brushSize: "ブラシサイズ",
      engine: "処理エンジン",
      comparison: "表示設定",
      splitView: "スプリットビュー",
      sideBySide: "並べて表示",
      currentVersion: "現在のバージョン",
      iteration: "イテレーション",
      aiModel: "AI搭載 v2.4",
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
      description:
        "アスペクト比を維持しながら、画像を思い通りのサイズに完璧に調整。",
      pixels: "ピクセル (px)",
      percentage: "パーセント (%)",
      width: "幅",
      height: "高さ",
      aspectRatio: "比率を固定",
      zoom: "プレビュー拡大",
    },
    crop: {
      title: "精密切り抜き",
      description:
        "ピクセル単位の精度で、自由な比率や固定比率での切り抜きが可能。",
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
      watermarkTitle: "AI透かし消去 | オンラインで写真から不要な物を消す",
      watermarkDesc:
        "AI技術で透かしや文字、不要なオブジェクトを一瞬で消去。登録不要、ブラウザ内処理でプライバシーも安心。",
      watermarkKeywords:
        "写真 透かし消す オンライン, AI不要物消去 無料, 画像 文字消し, 写真クリーニング ツール",
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
      aboutUs: "회사 소개",
      resources: "리소스",
      languages: "언어",
      uploadImage: "이미지 업로드",
      saveResult: "결과 저장",
      undo: "실행 취소",
      loading: "로딩 중...",
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
      back: "뒤로 가기",
      explore: "도구 둘러보기",
      ctaDesc:
        "완벽한 개인정보 보호로 전문가급 이미지 도구를 경험하세요. 모든 처리는 브라우저에서 로컬로 진행됩니다.",
      privacyPolicy: "개인정보 처리방침",
      termsOfService: "이용 약관",
      contactSupport: "고객 지원 문의",
    },
    nav: {
      inpainting: "이미지 복원",
      resize: "크기 조정",
      crop: "자르기",
      convert: "형식 변환",
      x: "X (Twitter)",
      github: "GitHub",
      about: "회사 소개",
      blog: "블로그",
      contactAuthor: "작가에게 연락",
    },
    home: {
      heroTitle: "AI로 재탄생한 전문가용 이미지 도구.",
      heroSubtitle:
        "워터마크 제거, 크기 조정, 자르기, 변환을 위한 완벽한 솔루션. 로컬 AI 기반으로 100% 개인정보 보호.",
      getStarted: "시작하기",
      featuresTitle: "왜 tuziyo인가요?",
      privacyTitle: "철저한 개인정보 보호",
      privacyDesc:
        "모든 처리는 브라우저 내에서 로컬로 진행됩니다. 이미지가 외부로 전송되지 않습니다.",
      speedTitle: "초고속 성능",
      speedDesc: "최적화된 WASM 및 GPU 가속으로 지연 없는 결과를 제공합니다.",
      aiTitle: "최첨단 AI 기술",
      aiDesc:
        "고급 신경망 기술로 전문가 수준의 이미지 복원 및 보정을 실현합니다.",
    },
    inpainting: {
      title: "AI 이미지 복원",
      description: "AI를 사용하여 이미지에서 원하지 않는 개체를 제거합니다",
      dropzone: "여기에 이미지를 드롭하세요",
      history: "편집 기록",
      brushSize: "브러시 크기",
      engine: "처리 엔진",
      comparison: "보기 설정",
      splitView: "분할 보기",
      sideBySide: "나란히 보기",
      currentVersion: "현재 버전",
      iteration: "반복",
      aiModel: "AI 구동 v2.4",
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
      description:
        "비율을 유지하면서 이미지를 완벽한 크기로 정밀하게 조정하세요.",
      pixels: "픽셀 (px)",
      percentage: "백분율 (%)",
      width: "너비",
      height: "높이",
      aspectRatio: "종횡비 고정",
      zoom: "미리보기 확대",
    },
    crop: {
      title: "정밀 자르기 도구",
      description: "픽셀 단위의 정확도로 원하는 비율에 맞춰 이미지를 자르세요.",
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
      watermarkTitle: "AI 워터마크 제거기 | 온라인에서 무료로 사진 개체 제거",
      watermarkDesc:
        "AI를 사용해 브라우저에서 즉시 워터마크, 텍스트 및 원치 않는 개체를 제거하세요. 가입 불필요, 흔적 없는 제거.",
      watermarkKeywords:
        "사진 워터마크 온라인 제거, AI 개체 제거기 무료, 이미지 텍스트 삭제, 브라우저 사진 정리 도구",
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
      aboutUs: "О нас",
      resources: "Ресурсы",
      languages: "Языки",
      uploadImage: "Загрузить изображение",
      saveResult: "Сохранить результат",
      undo: "Отменить шаг",
      loading: "Загрузка...",
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
      back: "Назад",
      explore: "К инструментам",
      ctaDesc:
        "Испытайте профессиональные инструменты для изображений с полной конфиденциальностью. Вся обработка происходит локально в вашем браузере.",
      privacyPolicy: "Политика конфиденциальности",
      termsOfService: "Условия использования",
      contactSupport: "Служба поддержки",
    },
    nav: {
      inpainting: "Восстановление изображений",
      resize: "Изменение размера",
      crop: "Обрезка",
      convert: "Конвертация",
      x: "X (Twitter)",
      github: "GitHub",
      about: "О нас",
      blog: "Блог",
      contactAuthor: "Связаться с автором",
    },
    home: {
      heroTitle: "Профи-инструменты для фото. Переосмыслено с AI.",
      heroSubtitle:
        "Лучший набор для удаления водяных знаков, изменения размера и конвертации. На базе локального AI, 100% приватно и безопасно.",
      getStarted: "Начать работу",
      featuresTitle: "Почему выбирают tuziyo?",
      privacyTitle: "Безупречная приватность",
      privacyDesc:
        "Вся обработка происходит локально в браузере. Ваши фото не покидают устройство.",
      speedTitle: "Молниеносная скорость",
      speedDesc:
        "Оптимизированный WASM и GPU ускорение для мгновенных результатов.",
      aiTitle: "Передовой AI",
      aiDesc:
        "Продвинутые нейросети обеспечивают профессиональное восстановление изображений.",
    },
    inpainting: {
      title: "AI Восстановление",
      description: "Удаляйте нежелательные объекты с изображений с помощью ИИ",
      dropzone: "Перетащите изображение сюда",
      history: "История изменений",
      brushSize: "Размер кисти",
      engine: "Движок обработки",
      comparison: "Настройки просмотра",
      splitView: "Разделение",
      sideBySide: "Рядом",
      currentVersion: "Текущая версия",
      iteration: "Итерация",
      aiModel: "На базе ИИ v2.4",
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
      description:
        "Идеально меняйте размер изображений с сохранением пропорций.",
      pixels: "Пиксели (px)",
      percentage: "Проценты (%)",
      width: "Ширина",
      height: "Высота",
      aspectRatio: "Сохранять пропорции",
      zoom: "Масштаб превью",
    },
    crop: {
      title: "Инструмент обрезки",
      description:
        "Обрезайте фото с точностью до пикселя и заданными пропорциями.",
      aspectRatio: "Соотношение сторон",
      format: "Формат вывода",
      downloadAll: "Сохранить все",
    },
    convert: {
      title: "Пакетная конвертация",
      description:
        "Мгновенно конвертируйте между PNG, JPG и WEBP без потери качества.",
      targetFormat: "Формат назначения",
      quality: "Настройки качества",
      convertAll: "Запустить задачи",
      supportedFormats: "Поддерживаемые форматы",
      inputFormats: "Вход: HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "Выход: WebP, PNG, JPEG",
    },
    seo: {
      title:
        "tuziyo - Профессиональные AI инструменты для фото | Бесплатно и приватно",
      description:
        "Бесплатные браузерные AI инструменты для удаления водяных знаков, пакетного масштабирования и конвертации. Без загрузки на сервер.",
      keywords:
        "бесплатные ai фото инструменты, удалить водяной знак онлайн бесплатно, пакетное изменение размера браузер, конвертер фото приватный heic",
      watermarkTitle:
        "AI Удаление водяных знаков | Убрать объекты с фото онлайн бесплатно",
      watermarkDesc:
        "Используйте AI для мгновенного удаления водяных знаков и текста в браузере. Без регистрации, без следов на фото.",
      watermarkKeywords:
        "удалить водяной знак с фото онлайн, ai удаление объектов бесплатно, стереть текст с картинки, очистка фото в браузере",
      resizeTitle:
        "Пакетное изменение размера | Масштабирование в процентах или пикселях",
      resizeDesc:
        "Точно меняйте размер множества фото сразу. Сохранение пропорций и масштабирование. 100% приватно и быстро.",
      resizeKeywords:
        "масштабирование фото онлайн пакет, изменение размера в процентах, ресайзер фото для соцсетей бесплатно",
      cropTitle:
        "Точная обрезка фото | Обрезка под заданное соотношение сторон",
      cropDesc:
        "Обрезайте фото с точностью до пикселя. Пресеты 16:9, 4:3, 1:1. Качественный рендеринг без потерь в браузере.",
      cropKeywords:
        "обрезка фото онлайн бесплатно, кроппер фото 4:3, инструмент точной обрезки, обрезать картинку в браузере",
      convertTitle: "Приватный пакетный конвертер | HEIC в PNG, JPG, WebP",
      convertDesc:
        "Мгновенно меняйте формат фото. Безопасная пакетная обработка HEIC, PNG и JPEG. Фото остаются на вашем устройстве.",
      convertKeywords:
        "конвертер HEIC в PNG бесплатно, пакетный конвертер без загрузки, безопасный конвертер форматов, WebP конвертер онлайн",
      inpaintingTitle:
        "AI инпейнтинг | Восстановление фото в HD качестве онлайн",
      inpaintingDesc:
        "Профессиональный инструмент AI инпейнтинга. Удаляйте нежелательные объекты, восстанавливайте фото и заполняйте пропущенные области с высоким качеством. WebGPU ускорение, 100% приватно.",
      inpaintingKeywords:
        "ai инпейнтинг онлайн, инструмент восстановления фото, ремонт фото бесплатно, удалить объекты с фото, заполнить пропущенные области, webgpu инпейнтинг, mi-gan",
    },
  },
  it: {
    common: {
      tools: "Strumenti",
      aboutUs: "Chi Siamo",
      resources: "Risorse",
      languages: "Lingue",
      uploadImage: "Carica Immagine",
      saveResult: "Salva Risultato",
      undo: "Annulla Ultimo Passo",
      loading: "Caricamento...",
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
      back: "Torna Indietro",
      explore: "Esplora Strumenti",
      ctaDesc:
        "Prova strumenti per immagini professionali con completa privacy. Tutta l'elaborazione avviene localmente nel tuo browser.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Termini di Servizio",
      contactSupport: "Contatta il Supporto",
    },
    nav: {
      inpainting: "Restauro Immagini",
      resize: "Ridimensiona",
      crop: "Ritaglia",
      convert: "Converti",
      x: "X (Twitter)",
      github: "GitHub",
      about: "Chi Siamo",
      blog: "Blog",
      contactAuthor: "Contatta l'autore",
    },
    home: {
      heroTitle: "Strumenti Immagine Prof. Reinventati con l'IA.",
      heroSubtitle:
        "La suite definitiva per rimozione filigrana, ridimensionamento e conversione. Basata su IA locale, 100% privata e sicura.",
      getStarted: "Inizia Ora",
      featuresTitle: "Perché scegliere tuziyo?",
      privacyTitle: "Privacy Totale",
      privacyDesc:
        "Tutta l'elaborazione avviene localmente. Le tue immagini non lasciano mai il dispositivo.",
      speedTitle: "Velocità Lampo",
      speedDesc:
        "WASM ottimizzato e accelerazione GPU per risultati immediati.",
      aiTitle: "IA all'Avanguardia",
      aiDesc:
        "Reti neurali avanzate per un fotoritocco di livello professionale.",
    },
    inpainting: {
      title: "Restauro Immagini IA",
      description: "Rimuovi oggetti indesiderati dalle tue immagini con l'IA",
      dropzone: "Trascina la tua immagine qui",
      history: "Cronologia Modifiche",
      brushSize: "Dimensione Pennello",
      engine: "Motore di Calcolo",
      comparison: "Impostazioni Vista",
      splitView: "Vista Divisa",
      sideBySide: "Fianco a Fianco",
      currentVersion: "Versione Corrente",
      iteration: "Iterazione",
      aiModel: "Alimentato da IA v2.4",
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
      description:
        "Scala le tue immagini perfettamente mantenendo le proporzioni.",
      pixels: "Pixel (px)",
      percentage: "Percentuale (%)",
      width: "Larghezza",
      height: "Altezza",
      aspectRatio: "Blocca Proporzioni",
      zoom: "Zoom Anteprima",
    },
    crop: {
      title: "Ritaglio di Precisione",
      description:
        "Ritaglia immagini con precisione al pixel e rapporti fissi.",
      aspectRatio: "Rapporto Aspetto",
      format: "Formato Uscita",
      downloadAll: "Salva Tutte",
    },
    convert: {
      title: "Convertitore Bulk",
      description:
        "Converti istantaneamente tra PNG, JPG e WEBP mantenendo la qualità.",
      targetFormat: "Formato destinazione",
      quality: "Impostazioni qualità",
      convertAll: "Avvia attività",
      supportedFormats: "Formati Supportati",
      inputFormats: "Ingresso: HEIC, PNG, JPEG, WebP, GIF, BMP",
      outputFormats: "Uscita: WebP, PNG, JPEG",
    },
    seo: {
      title:
        "tuziyo - Strumenti Immagine IA Professionali | 100% Gratis & Privato",
      description:
        "Strumenti IA gratuiti nel browser per rimozione filigrana, ridimensionamento batch e conversione. Nessun upload, privacy totale.",
      keywords:
        "strumenti immagine ai gratuiti, rimuovere filigrana online gratis, ridimensionare immagini batch browser, convertitore immagine privato heic",
      watermarkTitle:
        "Rimozione Filigrana IA | Rimuovi oggetti dalle foto online gratis",
      watermarkDesc:
        "Usa l'IA per rimuovere filigrane e oggetti istantaneamente nel browser. Senza registrazione, nessun segno lasciato.",
      watermarkKeywords:
        "rimuovere filigrana da foto online, rimozione oggetti ai gratis, cancellare testo da immagine, pulizia foto browser",
      resizeTitle:
        "Ridimensionatore Immagini Batch | Ridimensiona per Percentuale o Pixel",
      resizeDesc:
        "Ridimensiona più immagini contemporaneamente con precisione. Supporto blocco proporzioni e scaling percentuale.",
      resizeKeywords:
        "ridimensionare immagini online batch, ridimensionatore immagini percentuale, ridimensionatore foto social gratis",
      cropTitle:
        "Ritaglio Immagine Preciso | Rapporti Aspetto Fissi 16:9, 4:3, 1:1",
      cropDesc:
        "Ritaglia immagini con precisione al pixel. Rendering di alta qualità senza perdite nel tuo browser.",
      cropKeywords:
        "ritagliare immagine online gratis, ritaglio foto 4:3, strumento ritaglio pixel, ridimensiona e ritaglia browser",
      convertTitle:
        "Convertitore Immagini Batch Privato | HEIC in PNG, JPG, WebP",
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
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("tuziyo-lang") as Language;
    if (saved && translations[saved]) {
      setLangState(saved);
    } else {
      const browserLang = navigator.language.split("-")[0] as Language;
      if (translations[browserLang]) {
        setLangState(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("tuziyo-lang", newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
