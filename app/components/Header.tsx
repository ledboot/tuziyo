import { Link, NavLink } from "react-router";
import { Globe, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useI18n, type Language } from "../lib/i18n";
import { useState, useRef, useEffect } from "react";

const LANG_NAMES: Record<Language, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  it: "Italiano",
};

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    { title: t.nav.inpainting, to: "/inpainting" },
    { title: t.nav.resize, to: "/resize" },
    { title: t.nav.crop, to: "/crop" },
    { title: t.nav.convert, to: "/convert" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-bold transition-all hover:text-primary-brand ${
                  isActive
                    ? "text-primary-brand"
                    : "text-slate-600 dark:text-slate-400"
                }`
              }
            >
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 text-slate-500 hover:text-primary-brand dark:text-slate-400 dark:hover:text-primary-brand transition-all group px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-brand/10 transition-colors">
                <Globe className="size-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">
                {lang}
              </span>
              <ChevronDown
                className={`size-3 transition-transform duration-300 ${showLangMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-colors flex items-center justify-between ${
                      lang === l
                        ? "text-primary-brand bg-primary-brand/5"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {LANG_NAMES[l]}
                    {lang === l && (
                      <div className="size-1.5 rounded-full bg-primary-brand" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
