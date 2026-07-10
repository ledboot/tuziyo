import { Link } from "react-router"
import { useI18n, type Language } from "~/lib/i18n"
import { GithubIcon, XIcon, YoutubeIcon } from "~/lib/socialIcons"

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

        <div className="footer-links">
          <div className="footer-links-col">
            <h4 className="footer-links-title">Studio</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/ai-toolkit" className="footer-link">
                  {t.nav.aiToolkit}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="footer-link">
                  {t.nav.pricing}
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">Resources</h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="https://github.com/ledboot/tuziyo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Privacy Policy
                </a>
              </li>
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
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} tuziyo.com. All rights reserved.</p>
        </div>

        {/* <div className="footer-social">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="X"
          >
            <XIcon className="size-5" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="YouTube"
          >
            <YoutubeIcon className="size-5" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="GitHub"
          >
            <GithubIcon className="size-5" />
          </a>
        </div> */}
      </div>
    </footer>
  )
}
