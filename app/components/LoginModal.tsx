import { useEffect } from "react";
import { X } from "lucide-react";
import { useUserStore } from "~/stores/userStore";
import { LoginButton } from "./LoginButton";

export default function LoginModal() {
  const { user } = useUserStore();

  useEffect(() => {
    const handleOpen = () => {
      if (!user) {
        document.getElementById("login-modal")?.showModal();
      }
    };
    window.addEventListener("openLoginModal", handleOpen);
    return () => window.removeEventListener("openLoginModal", handleOpen);
  }, [user]);

  if (user) return null;

  return (
    <dialog id="login-modal" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            <X className="size-5" />
          </button>
        </form>
        <h3 className="font-bold text-lg text-center mb-2">Welcome to Tuziyo</h3>
        <p className="text-center mb-6 text-base-content/60">
          Sign in to access AI Toolkit and more features
        </p>
        <LoginButton />
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => {}}>close</button>
      </form>
    </dialog>
  );
}