import { Link } from "react-router"
import { useI18n, type Language } from "~/lib/i18n"
import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS } from "~/data/aiImageModels"

const LANG_NAMES: Record<Language, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  it: "Italiano",
}

export default function Footer() {
  const { t, setLang } = useI18n()

  return (
    <footer className="footer-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="flex items-center gap-2">
            <span className="footer-wordmark">
              <img src="/logo.svg" alt="" />
              <span>tuziyo</span>
            </span>
          </Link>
          <p className="footer-brand-desc">
            Prompt, choose the right model, and generate image or video variants from one focused
            creative workspace.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <div className="footer-links-col">
            <h4 className="footer-links-title">Create</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/ai-toolkit" className="footer-link">
                  {t.nav.aiToolkit}
                </Link>
              </li>
              <li>
                <Link to="/library" className="footer-link">
                  Library
                </Link>
              </li>
              <li>
                <Link to="/studio" className="footer-link">
                  Studio
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">AI Models</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/ai/models" className="footer-link">
                  Compare all models
                </Link>
              </li>
              {AI_IMAGE_MODEL_SLUGS.map(slug => (
                <li key={slug}>
                  <Link to={`/ai/models/${slug}`} className="footer-link">
                    {AI_IMAGE_MODELS[slug].name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">Resources</h4>
            <ul className="footer-links-list">
              <li><Link to="/pricing" className="footer-link">{t.nav.pricing}</Link></li>
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">Language</h4>
            <ul className="footer-lang-list">
              {(Object.keys(LANG_NAMES) as Language[]).map(lang => (
                <li key={lang}>
                  <button type="button" onClick={() => setLang(lang)} className="footer-lang-btn">
                    {LANG_NAMES[lang]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} tuziyo.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
