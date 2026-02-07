import { Link, NavLink, useLocation } from "react-router";
import { createPortal } from "react-dom";
import { Globe, ChevronDown, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
    { title: t.nav.inpainting, to: "/inpainting", external: false },
    { title: t.nav.resize, to: "/resize", external: false },
    { title: t.nav.crop, to: "/crop", external: false },
    { title: t.nav.convert, to: "/convert", external: false },
    { title: t.nav.blog, to: "/blog", external: true },
  ];

  // Check if current path is in blog (for external static site)
  const isBlogActive = location.pathname.startsWith("/blog");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:grid md:grid-cols-[1fr_2fr_1fr] lg:px-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden -ml-2 p-2 text-slate-600 hover:text-primary-brand dark:text-slate-400 dark:hover:text-primary-brand transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-6" />
          </button>
          <Link to="/">
            <div className="flex items-center h-10 select-none">
              <img
                src="/logo-with-brand.svg"
                alt="tuziyo"
                className="h-full w-auto"
              />
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-bold transition-all hover:text-primary-brand ${
                  isBlogActive
                    ? "text-primary-brand"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.title}
              </a>
            ) : (
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
            ),
          )}
        </nav>

        <div className="flex items-center justify-end gap-4">
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

      {/* Mobile Drawer */}
      {/* Mobile Drawer */}
      {mobileMenuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex justify-start md:hidden">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-[300px] max-w-[85vw] h-full bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <img
                    src="/logo-with-brand.svg"
                    alt="tuziyo"
                    className="h-10 w-auto"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.to}
                      href={item.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center py-3 text-base font-bold text-slate-600 hover:text-primary-brand dark:text-slate-400 dark:hover:text-primary-brand transition-colors border-b border-slate-100 dark:border-slate-900/50"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center py-3 text-base font-bold transition-colors border-b border-slate-100 dark:border-slate-900/50 ${
                          isActive
                            ? "text-primary-brand"
                            : "text-slate-600 hover:text-primary-brand dark:text-slate-400"
                        }`
                      }
                    >
                      {item.title}
                    </NavLink>
                  ),
                )}
              </nav>

              <div className="mt-auto">
                <p className="text-xs font-bold text-slate-400 text-center">
                  © {new Date().getFullYear()} tuziyo.com
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
