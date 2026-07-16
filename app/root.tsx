import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Toaster } from "sonner"

import type { Route } from "./+types/root"
import Header from "./components/Header"
import Footer from "./components/Footer"
import LoginModal from "./components/LoginModal"
import { setAnalyticsUser, trackPageView } from "./lib/analytics"
import "./app.css"

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/png", href: "/favicon-96x96.png" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "stylesheet", href: "/fonts/fonts.css" },
  { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="forest">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-587MSVTQ');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-587MSVTQ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

import { I18nProvider } from "./lib/i18n"
import { useLocation } from "react-router"
import { useEffect, useRef } from "react"
import { useUserStore } from "./stores/userStore"

export default function App() {
  const location = useLocation()
  const user = useUserStore(state => state.user)
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    const { fetchUser } = useUserStore.getState()
    fetchUser()
  }, [])

  useEffect(() => {
    setAnalyticsUser(user ? { userId: user.userId, userType: user.userType } : null)
  }, [user?.userId, user?.userType])

  useEffect(() => {
    const pathname = location.pathname
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname
      return
    }
    if (previousPathRef.current !== pathname) {
      trackPageView(pathname)
      previousPathRef.current = pathname
    }
  }, [location.pathname])

  const isSpecialPage =
    location.pathname.startsWith("/ai-toolkit") || location.pathname.startsWith("/session")

  return (
    <I18nProvider>
      {/* Global SVG Filter for Liquid Glass Refraction */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.012"
              numOctaves="2"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="40s"
                values="0.012 0.012;0.018 0.018;0.012 0.012"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="35"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="liquid_glass_filter" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.003" numOctaves="2" seed="7" result="noise"/>
            <feGaussianBlur in="noise" stdDeviation="1.2" result="map"/>
            <feDisplacementMap in="SourceGraphic" in2="map" scale="110" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>
      <div className={`min-h-screen bg-base-100 flex flex-col transition-colors duration-300`}>
        <Header />
        <main className={`flex-1 ${isSpecialPage ? "" : "overflow-y-auto"}`}>
          <Outlet />
        </main>
        {!isSpecialPage && <Footer />}
        <LoginModal />
        <Toaster position="bottom-right" />
      </div>
    </I18nProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
