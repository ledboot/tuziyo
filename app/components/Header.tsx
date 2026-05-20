import { Link, NavLink, useLocation } from "react-router"
import { ChevronDown, Globe, LogOut, Menu, User, X } from "lucide-react"
import { languageNames, useI18n, type Language } from "~/lib/i18n"
import { useState } from "react"
import { useUserStore } from "../stores/userStore"

interface NavItemSimple {
  title: string
  to: string
  external?: boolean
}

interface NavItemWithChildren {
  title: string
  children: { title: string; to: string }[]
}

type NavItem = NavItemSimple | NavItemWithChildren

export default function Header() {
  const { lang, setLang, t } = useI18n()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const { user, token, logout, isLoading: isUserLoading, isFetching: isUserFetching } = useUserStore()
  const isAuthPending = isUserLoading || isUserFetching
  const hasStoredAuth = Boolean(user || token)

  const navItems: NavItem[] = [
    { title: t.nav.aiToolkit, to: "/ai-toolkit" },
    {
      title: t.nav.tools,
      children: [
        { title: t.nav.inpainting, to: "/inpainting" },
        { title: t.nav.resize, to: "/resize" },
        { title: t.nav.crop, to: "/crop" },
        { title: t.nav.convert, to: "/convert" },
      ],
    },
    { title: t.nav.pricing, to: "/pricing" },
    { title: t.nav.api, to: "/api" },
  ]

  const closeMenus = () => {
    setShowMobileMenu(false)
    setShowLangMenu(false)
    setShowUserMenu(false)
  }

  const openLogin = () => {
    closeMenus()
    window.dispatchEvent(new CustomEvent("openLoginModal"))
  }

  const isAiToolkit = location.pathname.startsWith("/ai-toolkit")
  const headerClasses = isAiToolkit
    ? "fixed top-0 left-0 w-full z-[100] text-white group/header"
    : "fixed top-0 left-0 w-full z-[100] text-white backdrop-blur-[18px] border-b border-white/5 bg-base-100/50"

  const navClasses = isAiToolkit
    ? "flex items-center h-11 px-4 rounded-xl liquid-glass-pill"
    : "flex items-center h-11 px-4"

  return (
    <header className={headerClasses}>
      {/* Top blur gradient layer - only for AI Toolkit */}
      {isAiToolkit && (
        <div className="absolute inset-0 z-[-1] [mask-image:linear-gradient(to_bottom,black,transparent)] backdrop-blur-xl pointer-events-none" />
      )}
      
      <div className="grid grid-cols-3 min-h-[4.5rem] w-full items-center gap-6 px-6 max-[719px]:min-h-[4.15rem]">
        <div className="flex justify-start">
        <Link
          to="/"
          className="inline-flex h-full items-center gap-[0.55rem] text-xl font-semibold tracking-normal text-white uppercase no-underline"
          aria-label={t.nav.home}
        >
          <span className="flex items-center gap-2">
            <img className="h-10 w-10" src="/logo.svg" alt="" />
            <span className="text-2xl">tuziyo</span>
          </span>
        </Link>
        </div>

        <div className="flex justify-center">

        <nav
          className={navClasses}
          aria-label={t.nav.mainNavigation}
        >
          <ul className="menu menu-horizontal h-full gap-3 bg-transparent p-0 items-center list-none">
            {navItems.map(item => {
              if ("children" in item) {
                const hasActiveChild = item.children.some(child =>
                  location.pathname.startsWith(child.to)
                )

                return (
                  <li className="h-10 w-28 text-nowrap" key={item.title}>
                    <div className="group dropdown dropdown-hover h-full w-full bg-transparent">
                      <button
                        type="button"
                        tabIndex={0}
                        className={[
                          "!flex h-full w-full items-center justify-center gap-1 rounded-full text-center text-nav-root font-normal",
                          hasActiveChild
                            ? "text-primary font-semibold"
                            : "text-nav-menu group-hover:text-primary transition-colors",
                        ].join(" ")}
                      >
                        <span className="font-normal text-nav-root">{item.title}</span>
                        <ChevronDown className="size-4 transition-transform duration-200 group-hover:-rotate-180" />
                      </button>
                      <div
                        className="dropdown-content left-1/2 -translate-x-1/2 z-50 pt-1"
                        tabIndex={0}
                      >
                        <ul className="menu menu-md ms-0 w-40 gap-1 rounded-box liquid-glass-dropdown p-1 shadow-2xl before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:bg-transparent">
                          {item.children.map(child => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  [
                                    "!flex w-full items-center justify-start rounded-lg text-left px-3 py-2 bg-transparent text-nav-submenu hover:cursor-pointer",
                                    isActive
                                      ? "text-primary font-bold"
                                      : "text-nav-menu hover:bg-white/10 hover:text-primary transition-colors",
                                  ].join(" ")
                                }
                              >
                                {child.title}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                )
              }

              if (item.external) {
                return (
                  <li className="group h-10 w-28 text-nowrap" key={item.to}>
                    <a
                      href={item.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={[
                        "flex h-full w-full items-center justify-center rounded-lg px-2 text-center text-nav-root font-normal",
                        location.pathname.startsWith(item.to)
                          ? "text-primary font-bold"
                          : "text-nav-menu group-hover:text-primary transition-colors",
                      ].join(" ")}
                    >
                      {item.title}
                    </a>
                  </li>
                )
              }

              return (
                <li className="group h-10 w-28 text-nowrap" key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "!flex h-full w-full items-center justify-center bg-transparent px-4 text-center text-nav-root font-normal",
                        isActive
                          ? "text-primary font-bold"
                          : "text-nav-menu group-hover:text-primary transition-colors",
                      ].join(" ")
                    }
                  >
                    {item.title}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        </div>

        {/* Right Column: Actions */}
        <div className="flex justify-end items-center gap-[0.55rem]">
          <div className="hidden md:flex items-center gap-[0.55rem]">
          <div
            className={`group dropdown dropdown-hover h-10 w-28 ${showLangMenu ? "dropdown-open" : ""}`}
          >
            <button
              type="button"
              className="!flex h-full w-full items-center justify-center gap-1 rounded-full text-center text-nav-root font-normal text-nav-menu group-hover:text-primary cursor-pointer transition-colors"
              onClick={() => setShowLangMenu(value => !value)}
              aria-label={t.nav.changeLanguage}
              aria-expanded={showLangMenu}
              tabIndex={0}
            >
              <Globe className="size-4" />
              <span>{languageNames[lang]}</span>
              <ChevronDown className="size-4 transition-transform duration-200 group-hover:-rotate-180" />
            </button>
            <div className="dropdown-content left-1/2 -translate-x-1/2 z-50 ms-0 pt-1" tabIndex={0}>
              <ul className="menu menu-md w-40 gap-1 rounded-box liquid-glass-dropdown p-1 shadow-2xl before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:bg-transparent">
                {(Object.keys(languageNames) as Language[]).map(nextLang => (
                  <li key={nextLang}>
                    <button
                      type="button"
                      onClick={() => {
                        setLang(nextLang)
                        closeMenus()
                      }}
                      className={[
                        "justify-between font-normal text-nav-submenu",
                        lang === nextLang
                          ? "text-primary font-bold"
                          : "text-nav-menu hover:bg-white/10 hover:text-primary transition-colors",
                      ].join(" ")}
                    >
                      {languageNames[nextLang]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {isAuthPending ? (
            <div
              className="flex h-10 items-center justify-end gap-[0.55rem]"
              aria-hidden="true"
            >
              {hasStoredAuth ? (
                <div className="skeleton size-8 rounded-full bg-white/15" />
              ) : (
                <>
                  <div className="skeleton h-8 w-20 rounded-full bg-white/10" />
                  <div className="skeleton h-8 w-24 rounded-xl bg-white/15" />
                </>
              )}
            </div>
          ) : user ? (
            <div
              className={`dropdown dropdown-end dropdown-hover ${showUserMenu ? "dropdown-open" : ""}`}
            >
              <button
                type="button"
                className="avatar btn btn-circle btn-primary btn-sm overflow-hidden"
                onClick={() => setShowUserMenu(value => !value)}
                aria-label={t.nav.openUserMenu}
                aria-expanded={showUserMenu}
                tabIndex={0}
              >
                {user.avatarUrl ? (
                  <img
                    className="size-full rounded-full object-cover"
                    src={user.avatarUrl}
                    alt={user.name}
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </button>
              <div className="dropdown-content z-50 pt-1" tabIndex={0}>
                <ul className="menu menu-md w-40 gap-1 rounded-box liquid-glass-dropdown p-2 shadow-2xl before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:bg-transparent">
                  <li>
                    <button
                      type="button"
                      className="justify-between rounded-lg text-nav-submenu font-normal text-nav-menu hover:bg-white/10 hover:text-primary transition-colors"
                      onClick={() => {
                        if (location.pathname === "/profile") return
                        closeMenus()
                        window.open("/profile", "_blank")
                      }}
                    >
                      {t.nav.profile}
                      <User className="size-4" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="justify-between rounded-lg text-nav-submenu font-normal text-nav-menu hover:bg-white/10 hover:text-primary transition-colors"
                      onClick={() => {
                        closeMenus()
                        logout()
                      }}
                    >
                      {t.nav.logout}
                      <LogOut className="size-4" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <button
                className="!flex h-full w-28 items-center justify-center gap-1 rounded-full text-center text-nav-root font-normal text-nav-menu hover:bg-transparent hover:text-primary transition-colors"
                type="button"
                onClick={openLogin}
              >
                {t.nav.login}
              </button>
              <button
                className="btn btn-primary btn-sm rounded-xl text-nav-root font-medium"
                type="button"
                onClick={openLogin}
              >
                {t.nav.register}
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm md:hidden"
            onClick={() => setShowMobileMenu(value => !value)}
            aria-label={t.nav.openMenu}
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {showMobileMenu && (
          <div className="absolute top-[calc(100%+0.5rem)] right-4 left-4 z-50 md:hidden">
            <ul className="menu gap-1 rounded-box liquid-glass-dropdown p-2 text-nav-submenu shadow-2xl">
              {navItems.map(item => {
                if ("children" in item) {
                  return item.children.map(child => (
                    <li key={child.to}>
                      <NavLink
                        to={child.to}
                        onClick={closeMenus}
                        className={({ isActive }) =>
                          [
                            "!flex w-full items-center justify-center rounded-lg text-center text-nav-submenu font-normal",
                            isActive
                              ? "text-primary font-bold"
                              : "text-nav-menu hover:bg-white/10 hover:text-primary transition-colors",
                          ].join(" ")
                        }
                      >
                        {child.title}
                      </NavLink>
                    </li>
                  ))
                }

                if (item.external) {
                  return (
                    <li key={item.to}>
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[
                          "!flex w-full items-center justify-center rounded-lg text-center text-nav-submenu font-normal",
                          location.pathname.startsWith(item.to)
                            ? "text-primary font-bold"
                            : "text-nav-menu hover:bg-white/10 hover:text-primary transition-colors",
                        ].join(" ")}
                        onClick={closeMenus}
                      >
                        {item.title}
                      </a>
                    </li>
                  )
                }

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={closeMenus}
                      className={({ isActive }) =>
                        [
                          "!flex w-full items-center justify-center rounded-lg text-center text-nav-submenu font-normal",
                          isActive
                            ? "text-primary font-semibold"
                            : "text-nav-menu hover:bg-white/10 hover:text-primary transition-colors",
                        ].join(" ")
                      }
                    >
                      {item.title}
                    </NavLink>
                  </li>
                )
              })}

              {!isAuthPending && !user && (
                <li className="mt-1">
                  <button
                    className="btn btn-ghost btn-sm rounded-full text-nav-submenu font-medium"
                    type="button"
                    onClick={openLogin}
                  >
                    {t.nav.register}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
        </div>
      </div>
    </header>
  )
}
