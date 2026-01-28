import { Link } from "react-router";
import Logo from "~/components/Logo";
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
    <footer className="border-t border-slate-200 bg-white px-6 py-16 dark:border-slate-800 dark:bg-slate-950 lg:px-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-6 mb-12">
          <div className="col-span-2 space-y-6">
            <Logo />
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-xs font-medium">
              {t.home.heroSubtitle}
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/@ledboot_"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-brand/10 hover:text-primary-brand transition-all"
                title={t.nav.x}
              >
                <XIcon className="size-5" />
              </a>
              <a
                href="https://github.com/ledboot/tuziyo"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-brand/10 hover:text-primary-brand transition-all"
                title={t.nav.github}
              >
                <GithubIcon className="size-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              {t.common.tools}
            </h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/inpainting"
                >
                  {t.nav.watermark}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/resize"
                >
                  {t.nav.resize}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/crop"
                >
                  {t.nav.crop}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/convert"
                >
                  {t.nav.convert}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              {t.common.aboutUs}
            </h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/"
                >
                  {t.nav.contactAuthor}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              {t.common.resources}
            </h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/"
                >
                  {t.common.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/"
                >
                  {t.common.termsOfService}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary-brand transition-colors"
                  to="/"
                >
                  {t.common.contactSupport}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-2xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              {t.common.languages}
            </h4>
            <ul className="grid grid-cols-1 gap-4 text-sm font-bold">
              {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
                <li key={l}>
                  <button
                    onClick={() => setLang(l)}
                    className={`transition-colors ${
                      lang === l
                        ? "text-primary-brand"
                        : "text-slate-600 dark:text-slate-400 hover:text-primary-brand"
                    }`}
                  >
                    {LANG_NAMES[l]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-black tracking-widest text-slate-400">
            © {new Date().getFullYear()} tuziyo. All rights reserved. 100% Free
            Processing.
          </p>
        </div>
      </div>
    </footer>
  );
}
