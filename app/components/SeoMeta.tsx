import { useEffect } from 'react'
import { useI18n } from '~/lib/i18n'

interface SEOMetaProps {
  page: 'home' | 'resize' | 'crop' | 'convert' | 'inpainting'
}

export function SEOMeta({ page }: SEOMetaProps) {
  const { t, lang } = useI18n()

  useEffect(() => {
    let title = t.seo.title
    let description = t.seo.description
    let keywords = t.seo.keywords

    if (page === 'inpainting') {
      title = t.seo.inpaintingTitle
      description = t.seo.inpaintingDesc
      keywords = t.seo.inpaintingKeywords
    } else if (page === 'resize') {
      title = t.seo.resizeTitle
      description = t.seo.resizeDesc
      keywords = t.seo.resizeKeywords
    } else if (page === 'crop') {
      title = t.seo.cropTitle
      description = t.seo.cropDesc
      keywords = t.seo.cropKeywords
    } else if (page === 'convert') {
      title = t.seo.convertTitle
      description = t.seo.convertDesc
      keywords = t.seo.convertKeywords
    }

    // Update Document Title
    document.title = title

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', description)

    // Update Meta Keywords
    let metaKey = document.querySelector('meta[name="keywords"]')
    if (!metaKey) {
      metaKey = document.createElement('meta')
      metaKey.setAttribute('name', 'keywords')
      document.head.appendChild(metaKey)
    }
    metaKey.setAttribute('content', keywords)

    // Update Open Graph Tags
    const updateOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    updateOG('og:title', title)
    updateOG('og:description', description)

    // Update Lang attribute on HTML
    document.documentElement.lang = lang
  }, [t, page, lang])

  return null
}
