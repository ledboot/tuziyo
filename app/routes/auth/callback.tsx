import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useUserStore } from "~/stores/userStore";

const texts = {
  auth_cancelled: "Authorization canceled",
  no_auth_code: "Authorization code not found",
  state_mismatch: "State validation failed",
  login_failed: "Sign-in failed, please try again later",
  auth_error: "Authentication Error",
  completing_signin: "Completing sign-in...",
  verifying_account: "Verifying your account, please wait",
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const codeVerifier = localStorage.getItem("pkce_code_verifier") || "";
      const stateFromStorage = localStorage.getItem("oauth_state") || "";

      if (errorParam) {
        setError(texts.auth_cancelled);
        return;
      }

      if (!code) {
        setError(texts.no_auth_code);
        return;
      }

      if (state !== stateFromStorage) {
        setError(texts.state_mismatch);
        return;
      }

      console.log("code", code);
      console.log("codeVerifier", codeVerifier);
      console.log("stateFromStorage", stateFromStorage);
      console.log("stateFromUrl", state);

      const result = await login(code, codeVerifier);

      if (result.success) {
        const redirectUrl = localStorage.getItem("login_redirect_url") || "/";
        localStorage.removeItem("login_redirect_url");
        localStorage.removeItem("pkce_code_verifier");
        localStorage.removeItem("oauth_state");
        navigate(redirectUrl);
      } else {
        setError(result.error || texts.login_failed);
      }
    };

    handleCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="max-w-md w-full bg-base-200 p-6 rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-error mb-2">
              {texts.auth_error}
            </h2>
            <p className="text-base-content/60 mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-primary-content rounded hover:opacity-90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="text-center flex flex-col items-center">
        <div className="loading loading-spinner loading-lg"></div>
        <h2 className="text-xl font-semibold mt-6 mb-2">
          {texts.completing_signin}
        </h2>
        <p className="text-base-content/60">{texts.verifying_account}</p>
      </div>
    </div>
  );
}