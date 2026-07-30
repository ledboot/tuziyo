import { Link, useLocation } from "react-router"
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react"
import { useI18n } from "~/lib/i18n"
import { useState, useEffect } from "react"
import { useUserStore } from "../stores/userStore"
import { markPricingIntent, trackEvent } from "~/lib/analytics"
import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS } from "~/data/aiImageModels"

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
  const { t } = useI18n()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileImageMenu, setShowMobileImageMenu] = useState(false)
  const [showDesktopImageMenu, setShowDesktopImageMenu] = useState(false)
  const location = useLocation()
  const {
    user,
    token,
    logout,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useUserStore()
  const isAuthPending = isUserLoading || isUserFetching
  const hasStoredAuth = Boolean(user || token)
  const isAiToolkit = location.pathname.startsWith("/ai-toolkit")
  const isAiImage =
    location.pathname === "/ai/models" || location.pathname.startsWith("/ai/models/")

  const navItems: NavItem[] = [
    { title: t.nav.home, to: "/" },
    ...(!user
      ? [
          {
            title: "AI Image",
            children: [
              { title: "All AI image models", to: "/ai/models" },
              ...AI_IMAGE_MODEL_SLUGS.map(slug => ({
                title: AI_IMAGE_MODELS[slug].name,
                to: `/ai/models/${slug}`,
              })),
            ],
          } satisfies NavItemWithChildren,
        ]
      : []),
    { title: t.nav.aiToolkit, to: "/ai-toolkit" },
  ]

  const closeMenus = () => {
    setShowMobileMenu(false)
    setShowUserMenu(false)
    setShowMobileImageMenu(false)
    setShowDesktopImageMenu(false)
  }

  const openLogin = () => {
    closeMenus()
    trackEvent("login_prompt", { source: "header" })
    window.dispatchEvent(new CustomEvent("openLoginModal"))
  }

  const handleNavigation = (to: string) => {
    if (to === "/pricing") markPricingIntent("navigation")
  }

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [showMobileMenu])

  const headerClasses = isAiToolkit
    ? "fixed top-0 left-0 w-full z-[100] text-white group/header"
    : "fixed top-0 left-0 w-full z-[100] text-white"

  const navClasses = "ai-toolkit-nav-shell"

  const headerInnerClasses =
    "grid grid-cols-[1fr_auto_1fr] min-h-20 max-[1119px]:min-h-[60px] w-full items-center gap-6 px-6 max-[1119px]:grid-cols-[1fr_auto]"

  const isSegmentedNavItemActive = (to: string) => {
    if (to === "/") return location.pathname === "/"
    const [path, hash = ""] = to.split("#")
    if (location.pathname !== path) return false
    return hash ? location.hash === `#${hash}` : !location.hash
  }

  return (
    <header
      className={headerClasses}
      style={
        !isAiToolkit
          ? {
              background:
                "linear-gradient(to bottom, oklch(14% 0 0 / 0.6) 0%, oklch(14% 0 0 / 0) 100%)",
            }
          : undefined
      }
    >
      {/* Top blur gradient layer - only for AI Toolkit */}
      {isAiToolkit && (
        <div className="absolute inset-0 z-[-1] [mask-image:linear-gradient(to_bottom,black,transparent)] backdrop-blur-xl pointer-events-none" />
      )}

      {/* Progressive backdrop-blur layer - for non-AI Studio pages (like homepage) */}
      {!isAiToolkit && (
        <div
          className="absolute inset-0 z-[-1] backdrop-blur-md pointer-events-none"
          style={{
            maskImage: "linear-gradient(to bottom, black 30%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 85%)",
          }}
        />
      )}

      <div className={headerInnerClasses}>
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

        <div className="hidden justify-center min-[1120px]:flex">
          <nav className={navClasses} aria-label={t.nav.mainNavigation}>
            <ul
              className="ai-toolkit-nav-list"
              style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
            >
              {navItems.map(item => {
                if ("children" in item) {
                  return (
                    <li
                      key={item.title}
                      className={`model-nav-dropdown ${showDesktopImageMenu ? "is-open" : ""}`}
                      onMouseEnter={() => setShowDesktopImageMenu(true)}
                      onMouseLeave={() => setShowDesktopImageMenu(false)}
                      onFocus={() => setShowDesktopImageMenu(true)}
                      onBlur={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setShowDesktopImageMenu(false)
                        }
                      }}
                    >
                      <button
                        type="button"
                        className={["ai-toolkit-nav-item", isAiImage ? "is-active" : ""].join(" ")}
                        aria-haspopup="true"
                        aria-expanded={showDesktopImageMenu}
                        onClick={() => setShowDesktopImageMenu(true)}
                        onKeyDown={event => {
                          if (event.key === "Escape") {
                            setShowDesktopImageMenu(false)
                            event.currentTarget.blur()
                          }
                        }}
                      >
                        {item.title}
                        <ChevronDown className="size-3.5" />
                      </button>
                      <div className="model-nav-menu">
                        <div className="model-nav-menu-label">Explore image models</div>
                        {item.children.map(child => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={closeMenus}
                            className={location.pathname === child.to ? "is-active" : ""}
                            aria-current={location.pathname === child.to ? "page" : undefined}
                          >
                            <span>{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={item.to}>
                    {item.external ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[
                          "ai-toolkit-nav-item",
                          isSegmentedNavItemActive(item.to) ? "is-active" : "",
                        ].join(" ")}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={() => handleNavigation(item.to)}
                        className={[
                          "ai-toolkit-nav-item",
                          isSegmentedNavItemActive(item.to) ? "is-active" : "",
                        ].join(" ")}
                      >
                        {item.title}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Right Column: Actions */}
        <div className="flex justify-end items-center gap-[0.55rem]">
          <div className="hidden min-[1120px]:flex items-center gap-[0.55rem]">
            <Link
              to="/pricing"
              onClick={() => handleNavigation("/pricing")}
              className="!flex h-10 min-w-20 items-center justify-center rounded-full px-3 text-center text-nav-root font-normal !text-[rgba(255,255,255,0.68)] transition-colors hover:!text-white"
              aria-current={location.pathname === "/pricing" ? "page" : undefined}
            >
              {t.nav.pricing}
            </Link>

            {isAuthPending ? (
              <div className="flex h-10 items-center justify-end gap-[0.55rem]" aria-hidden="true">
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
                  <img
                    className="size-full rounded-full object-cover"
                    src="/default-avatar.svg"
                    alt={user.name}
                  />
                </button>
                <div className="dropdown-content z-50 pt-1" tabIndex={0}>
                  <ul className="menu menu-md w-40 gap-1 rounded-box liquid-glass-dropdown p-2 shadow-2xl before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:bg-transparent">
                    <li>
                      <button
                        type="button"
                        className="justify-between rounded-lg text-nav-submenu font-normal text-nav-menu hover:bg-white/10 hover:!text-gray-100 transition-colors"
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
                        className="justify-between rounded-lg text-nav-submenu font-normal text-nav-menu hover:bg-white/10 hover:!text-gray-100 transition-colors"
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
                  className="!flex h-full w-28 cursor-pointer items-center justify-center gap-1 rounded-full text-center text-nav-root font-normal !text-[rgba(255,255,255,0.68)] transition-colors hover:bg-transparent hover:!text-white"
                  type="button"
                  onClick={openLogin}
                >
                  {t.nav.login}
                </button>
                <button
                  className="model-button model-button-primary !text-white hover:!text-white"
                  type="button"
                  onClick={openLogin}
                >
                  {t.nav.register}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm min-[1120px]:hidden"
            onClick={() => setShowMobileMenu(value => !value)}
            aria-label={t.nav.openMenu}
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <div
                className="mobile-menu-backdrop min-[1120px]:hidden"
                onClick={closeMenus}
                aria-hidden="true"
              />
              {/* Drawer Panel */}
              <div className="mobile-menu-drawer min-[1120px]:hidden">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-[0.55rem] text-xl font-semibold tracking-normal text-white uppercase no-underline"
                    onClick={closeMenus}
                  >
                    <span className="flex items-center gap-2">
                      <img className="h-9 w-9" src="/logo.svg" alt="" />
                      <span className="text-xl">tuziyo</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={closeMenus}
                    className="p-2 text-white/70 hover:text-white transition-[color,transform] duration-200 cursor-pointer hover:scale-110 active:scale-90"
                    aria-label="Close menu"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 flex flex-col justify-start gap-6 mt-12 overflow-y-auto">
                  {navItems.map(item => {
                    if ("children" in item) {
                      return (
                        <div key={item.title} className="mobile-model-nav">
                          <button
                            type="button"
                            onClick={() => setShowMobileImageMenu(value => !value)}
                            className={isAiImage ? "is-active" : ""}
                            aria-expanded={showMobileImageMenu}
                          >
                            {item.title}
                            <ChevronDown
                              className={`size-5 ${showMobileImageMenu ? "rotate-180" : ""}`}
                            />
                          </button>
                          {showMobileImageMenu && (
                            <div>
                              {item.children.map(child => (
                                <Link
                                  key={child.to}
                                  to={child.to}
                                  onClick={closeMenus}
                                  className={location.pathname === child.to ? "is-active" : ""}
                                  aria-current={location.pathname === child.to ? "page" : undefined}
                                >
                                  {child.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }
                    const isActive = isSegmentedNavItemActive(item.to)
                    if (item.external) {
                      return (
                        <a
                          key={item.to}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeMenus}
                          className="text-2xl font-medium tracking-tight text-white/80 transition-colors duration-200 hover:text-white"
                        >
                          {item.title}
                        </a>
                      )
                    }
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          handleNavigation(item.to)
                          closeMenus()
                        }}
                        className={`text-2xl font-medium tracking-tight transition-colors duration-200 ${
                          isActive ? "text-[#00C2B8]" : "text-white/80 hover:text-white"
                        }`}
                      >
                        {item.title}
                      </Link>
                    )
                  })}
                  <Link
                    to="/pricing"
                    onClick={() => {
                      handleNavigation("/pricing")
                      closeMenus()
                    }}
                    className={`text-2xl font-medium tracking-tight transition-colors duration-200 ${
                      location.pathname === "/pricing"
                        ? "text-[#00C2B8]"
                        : "text-white/80 hover:text-white"
                    }`}
                    aria-current={location.pathname === "/pricing" ? "page" : undefined}
                  >
                    {t.nav.pricing}
                  </Link>

                  {/* User profile (if logged in) */}
                  {user && (
                    <div className="border-t border-white/5 pt-6 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full overflow-hidden">
                          <img
                            src="/default-avatar.svg"
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-xs text-white/50">{user.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus()
                          logout()
                        }}
                        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium"
                      >
                        <LogOut className="size-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  )}
                </nav>

                {/* Bottom action buttons */}
                {!isAuthPending && (
                  <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/5">
                    <Link to="/ai-toolkit" onClick={closeMenus} className="mobile-menu-btn-primary">
                      {t.home.start}
                    </Link>
                    {!user && (
                      <button
                        type="button"
                        onClick={openLogin}
                        className="mobile-menu-btn-secondary cursor-pointer"
                      >
                        {t.nav.login}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
