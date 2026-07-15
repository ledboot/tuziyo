import { useState } from "react"
import { cn } from "~/lib/utils"
import { trackEvent } from "~/lib/analytics"

function base64UrlEncode(str: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(digest)
}

function generateRandomString(length: number) {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, b => ("0" + (b & 0xff).toString(16)).slice(-2)).join("")
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI

type LoginButtonProps = {
  className?: string
  onClick?: () => void
}

export function LoginButton({ className, onClick }: LoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    onClick?.()
    trackEvent("login_start", { method: "google" })
    setLoading(true)
    const codeVerifier = generateRandomString(64)
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateRandomString(32)
    localStorage.setItem("pkce_code_verifier", codeVerifier)
    localStorage.setItem("oauth_state", state)

    const currentUrl = window.location.pathname + window.location.search
    if (!currentUrl.includes("/auth/callback")) {
      localStorage.setItem("login_redirect_url", currentUrl)
    }

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
    googleAuthUrl.searchParams.set("redirect_uri", REDIRECT_URI)
    googleAuthUrl.searchParams.set("response_type", "code")
    googleAuthUrl.searchParams.set("scope", "openid email profile")
    googleAuthUrl.searchParams.set("access_type", "online")
    googleAuthUrl.searchParams.set("code_challenge", codeChallenge)
    googleAuthUrl.searchParams.set("code_challenge_method", "S256")
    googleAuthUrl.searchParams.set("state", state)
    window.location.href = googleAuthUrl.toString()
  }
  return (
    <button
      disabled={loading}
      onClick={handleGoogleLogin}
      className={cn(
        "group relative flex h-14 w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <img
            src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg"
            alt="Google"
            className="h-5 w-5"
          />
          <span className="text-sm font-bold tracking-tight">Continue with Google</span>
        </>
      )}
    </button>
  )
}
