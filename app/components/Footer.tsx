import { Link } from "react-router";
import { useI18n, type Language } from "~/lib/i18n";
import { XIcon, GithubIcon } from "~/lib/socialIcons";

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
    <footer className="footer footer-center p-10 bg-base-200 text-base-content mt-auto">
      <div className="grid grid-flow-col gap-4">
        <Link to="/ai-toolkit" className="link link-hover">{t.nav.aiToolkit}</Link>
        <Link to="/inpainting" className="link link-hover">{t.nav.inpainting}</Link>
        <Link to="/resize" className="link link-hover">{t.nav.resize}</Link>
        <Link to="/crop" className="link link-hover">{t.nav.crop}</Link>
        <Link to="/convert" className="link link-hover">{t.nav.convert}</Link>
      </div>
      <div>
        <div className="grid grid-flow-col gap-4">
          <a href="https://x.com/@ledboot_" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <XIcon className="size-5" />
          </a>
          <a href="https://github.com/ledboot/tuziyo" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <GithubIcon className="size-5" />
          </a>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`btn btn-ghost btn-xs ${lang === l ? "btn-active" : ""}`}
          >
            {LANG_NAMES[l]}
          </button>
        ))}
      </div>
      <aside className="mt-4">
        <p className="text-xs opacity-50">
          © {new Date().getFullYear()} tuziyo.com. All rights reserved.
        </p>
      </aside>
    </footer>
  );
}
