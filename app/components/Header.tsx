import { Link, NavLink, useLocation } from "react-router";
import { Globe, ChevronDown, LogOut, User } from "lucide-react";
import { useI18n, type Language } from "../lib/i18n";
import { useState, useRef } from "react";
import { useUserStore } from "../stores/userStore";

const LANG_NAMES: Record<Language, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  it: "Italiano",
};

interface NavItemSimple {
  title: string;
  to: string;
  external?: boolean;
}

interface NavItemWithChildren {
  title: string;
  children: { title: string; to: string }[];
}

type NavItem = NavItemSimple | NavItemWithChildren;

function isNavItemWithChildren(item: NavItem): item is NavItemWithChildren {
  return "children" in item;
}

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, logout } = useUserStore();

  const navItems: NavItem[] = [
    { title: t.nav.aiToolkit, to: "/ai-toolkit" },
    {
      title: t.nav.freeTools,
      children: [
        { title: t.nav.inpainting, to: "/inpainting" },
        { title: t.nav.resize, to: "/resize" },
        { title: t.nav.crop, to: "/crop" },
        { title: t.nav.convert, to: "/convert" },
      ],
    },
    { title: t.nav.pricing, to: "/pricing" },
    { title: t.nav.blog, to: "/blog", external: true },
  ];

  const isBlogActive = location.pathname.startsWith("/blog");

  return (
    <div className="navbar h-15 max-h-15 bg-base-100 border-b border-base-200 sticky top-0 z-40 backdrop-blur-md px-6">
      <div className="navbar-start">
        <Link to="/" className="flex items-center">
          <img src="/logo-with-brand.svg" alt="tuziyo" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="flex items-center gap-1 px-1">
          {navItems.map((item, index) => {
            if (isNavItemWithChildren(item)) {
              return (
                <li key={index}>
                  <div className="dropdown dropdown-hover dropdown-end">
                    <button
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost text-base hover:text-primary gap-1"
                    >
                      {item.title}
                      <ChevronDown className="size-3" />
                    </button>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-base-200"
                    >
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <NavLink
                            to={child.to}
                            className={({ isActive }) =>
                              `text-base w-full flex justify-center ${isActive ? "text-primary font-semibold" : "hover:text-primary"}`
                            }
                          >
                            {child.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            }
            if (item.external) {
              return (
                <li key={item.to}>
                  <a
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost text-base hover:text-primary"
                  >
                    {item.title}
                  </a>
                </li>
              );
            }
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `btn btn-ghost text-base ${isActive ? "text-primary font-semibold" : "hover:text-primary"}`
                  }
                >
                  {item.title}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="navbar-end flex items-center gap-2">
        {user ? (
          <div className="dropdown dropdown-end" ref={userMenuRef}>
            <button
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle dropdown-toggle"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200 mt-2"
            >
              <li className="menu-title px-4 py-2">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-base-content/60">{user.email}</div>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.location.href = "/profile";
                  }}
                  className="flex items-center gap-2"
                >
                  <User className="size-4" />
                  Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="flex items-center gap-2"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm hidden lg:flex"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("openLoginModal"));
            }}
          >
            Start Free Now
          </button>
        )}
        <div className="dropdown dropdown-end" ref={menuRef}>
          <button
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2 dropdown-toggle"
          >
            <div className="p-1 rounded-lg bg-base-200">
              <Globe className="size-4" />
            </div>
            <span className="text-xs font-bold uppercase">{lang}</span>
          </button>
          {showLangMenu && (
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 rounded-box w-48 border border-base-200"
            >
              {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
                <li key={l}>
                  <button
                    onClick={() => {
                      setLang(l);
                      setShowLangMenu(false);
                    }}
                    className={`flex justify-center ${lang === l ? "text-primary font-semibold" : "hover:text-primary"}`}
                  >
                    {LANG_NAMES[l]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="lg:hidden btn btn-ghost btn-sm"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <svg
            className="size-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showMobileMenu ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {showMobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-base-100 border-b border-base-200 shadow-lg">
          <ul className="menu p-4 gap-2">
            {navItems.map((item, index) => {
              if (isNavItemWithChildren(item)) {
                return (
                  <li key={index}>
                    <div className="menu-title px-2 py-1 text-xs font-bold text-base-content/50 uppercase">
                      {item.title}
                    </div>
                    <ul className="pl-2">
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <NavLink
                            to={child.to}
                            onClick={() => setShowMobileMenu(false)}
                            className={({ isActive }) =>
                              `text-base ${isActive ? "text-primary font-semibold" : "hover:text-primary"}`
                            }
                          >
                            {child.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              if (item.external) {
                return (
                  <li key={item.to}>
                    <a href={item.to} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </li>
                );
              }
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `text-base ${isActive ? "text-primary font-semibold" : "hover:text-primary"}`
                    }
                  >
                    {item.title}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <div className="p-4 border-t border-base-200">
            <button
              className="btn btn-primary btn-sm w-full"
              onClick={() => {
                setShowMobileMenu(false);
                window.dispatchEvent(new CustomEvent("openLoginModal"));
              }}
            >
              Start Free Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
