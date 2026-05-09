import { useEffect } from "react"
import { X, Sparkles, ShieldCheck } from "lucide-react"
import { useUserStore } from "~/stores/userStore"
import { LoginButton } from "./LoginButton"

export default function LoginModal() {
  const { user } = useUserStore()

  useEffect(() => {
    const handleOpen = () => {
      if (!user) {
        const modal = document.getElementById("login-modal") as HTMLDialogElement
        modal?.showModal()
      }
    }
    window.addEventListener("openLoginModal", handleOpen)
    return () => window.removeEventListener("openLoginModal", handleOpen)
  }, [user])

  if (user) return null

  return (
    <dialog id="login-modal" className="modal backdrop-blur-md">
      <div className="modal-box p-0 overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-[32px] max-w-[440px] shadow-2xl relative">
        {/* Ambient Glow Effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none opacity-50"></div>

        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 z-20 text-white/40 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </form>

        <div className="relative z-10 px-8 pt-12 pb-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="size-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img className="h-12 w-12 relative z-10" src="/logo.svg" alt="Tuziyo Logo" />
            </div>

            <h3 className="text-3xl font-bold text-white tracking-tight mb-3">
              Welcome to <span className="text-primary">Tuziyo</span>
            </h3>
            <p className="text-base-content/60 text-sm leading-relaxed max-w-[280px]">
              Unlock the full power of AI-driven creativity. Sign in to start generating.
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-4 mb-8">
            <LoginButton />

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-white/5"></div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Secure Login
              </span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
          </div>

          {/* Footer Terms */}
          <p className="text-[11px] text-center text-base-content/40 leading-relaxed">
            By signing in, you agree to our{" "}
            <a
              href="/terms"
              className="text-white/60 hover:text-primary transition-colors underline underline-offset-4"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-white/60 hover:text-primary transition-colors underline underline-offset-4"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop bg-black/60">
        <button>close</button>
      </form>
    </dialog>
  )
}
