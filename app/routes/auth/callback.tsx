import { useNavigate } from "react-router"
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { LoginButton } from "~/components/LoginButton"
import { useUserStore } from "~/stores/userStore"

const texts = {
  auth_cancelled: "Authorization canceled",
  no_auth_code: "Authorization code not found",
  state_mismatch: "State validation failed",
  login_failed: "Sign-in failed, please try again later",
  auth_error: "Authentication Error",
  completing_signin: "Completing sign-in...",
  verifying_account: "Verifying your account, please wait",
  redirecting: "You're signed in. Taking you back now.",
  secure_connection: "Secure Google sign-in",
  go_home: "Back to home",
}

type AuthStatus = "checking" | "exchanging" | "success" | "error"

export default function AuthCallback() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>("checking")
  const processedRef = useRef(false)

  const handleRetry = () => {
    localStorage.removeItem("pkce_code_verifier")
    localStorage.removeItem("oauth_state")
  }

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const errorParam = searchParams.get("error")
      const codeVerifier = localStorage.getItem("pkce_code_verifier") || ""
      const stateFromStorage = localStorage.getItem("oauth_state") || ""

      if (errorParam) {
        setError(texts.auth_cancelled)
        setStatus("error")
        return
      }

      if (!code) {
        setError(texts.no_auth_code)
        setStatus("error")
        return
      }

      if (state !== stateFromStorage) {
        setError(texts.state_mismatch)
        setStatus("error")
        return
      }

      setStatus("exchanging")
      const result = await login(code, codeVerifier)

      if (result.success) {
        const storedRedirectUrl = localStorage.getItem("login_redirect_url") || "/"
        const redirectUrl = storedRedirectUrl.startsWith("/") ? storedRedirectUrl : "/"
        localStorage.removeItem("login_redirect_url")
        localStorage.removeItem("pkce_code_verifier")
        localStorage.removeItem("oauth_state")
        setStatus("success")
        redirectTimer = setTimeout(() => navigate(redirectUrl), 700)
      } else {
        setError(result.error || texts.login_failed)
        setStatus("error")
      }
    }

    handleCallback()

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer)
    }
  }, [navigate, login])

  const isSuccess = status === "success"
  const isError = status === "error"

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-base-100 px-4 py-12 text-base-content">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-black/50">
        <div aria-hidden="true" />

        <div className="px-7 pb-7 pt-8 text-center sm:px-8 sm:pb-8">
          <div
            className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border ${
              isError
                ? "border-error/30 bg-error/10 text-error"
                : isSuccess
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-primary"
            }`}
          >
            {isError ? (
              <AlertTriangle className="size-8" />
            ) : isSuccess ? (
              <CheckCircle2 className="size-8" />
            ) : (
              <Loader2 className="size-8 animate-spin" />
            )}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {texts.secure_connection}
          </p>

          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-white sm:text-3xl">
            {isError ? texts.auth_error : isSuccess ? "Sign-in complete" : texts.completing_signin}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
            {isError ? error : isSuccess ? texts.redirecting : texts.verifying_account}
          </p>

          {!isError && (
            <div className="mt-7 space-y-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-primary transition-all duration-500 ${
                    isSuccess ? "w-full" : status === "exchanging" ? "w-2/3" : "w-1/3"
                  }`}
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-white/45">
                <ShieldCheck className="size-4 text-primary" />
                <span>Completing your secure Google sign-in</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
              <LoginButton className="h-12 rounded-xl" onClick={handleRetry} />
              <button
                onClick={() => navigate("/")}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="size-4" />
                {texts.go_home}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
