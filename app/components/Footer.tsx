import { Link } from "react-router";
import { useI18n, type Language } from "~/lib/i18n";
import { XIcon, GithubIcon, YoutubeIcon } from "~/lib/socialIcons";

const LANG_NAMES: Record<Language, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  it: "Italiano",
};

export default function Footer() {
  const { t, lang, setLang } = useI18n();

  return (
    <footer className="footer-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo-with-brand.svg"
              alt="tuziyo"
              className="h-7 w-auto"
            />
          </Link>
          <p className="footer-brand-desc">
            AI-powered image editing tools. Edit, enhance, and transform your
            photos with ease.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-links-col">
            <h4 className="footer-links-title">Features</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/ai-toolkit" className="footer-link">
                  {t.nav.aiToolkit}
                </Link>
              </li>
              <li>
                <Link to="/inpainting" className="footer-link">
                  {t.nav.inpainting}
                </Link>
              </li>
              <li>
                <Link to="/resize" className="footer-link">
                  {t.nav.resize}
                </Link>
              </li>
              <li>
                <Link to="/crop" className="footer-link">
                  {t.nav.crop}
                </Link>
              </li>
              <li>
                <Link to="/convert" className="footer-link">
                  {t.nav.convert}
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">Help</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/pricing" className="footer-link">
                  {t.nav.pricing}
                </Link>
              </li>
              <li>
                <a href="/blog" className="footer-link">
                  {t.nav.blog}
                </a>
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
                <a href="/blog" className="footer-link">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">License & Terms</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#" className="footer-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

<div className="footer-links-col">
              <h4 className="footer-links-title">Language</h4>
              <ul className="footer-lang-list">
                {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => setLang(l)}
                      className="footer-lang-btn"
                    >
                      {LANG_NAMES[l]}
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

        <div className="footer-social">
          <a
            href="https://x.com/@ledboot_"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="X (Twitter)"
          >
            <XIcon className="size-5" />
          </a>
          <a
            href="https://youtube.com/@tuziyo"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="YouTube"
          >
            <YoutubeIcon className="size-5" />
          </a>
          <a
            href="https://github.com/ledboot/tuziyo"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="GitHub"
          >
            <GithubIcon className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
