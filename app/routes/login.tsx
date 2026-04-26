import { useSearchParams } from "react-router";
import { useEffect } from "react";
import { LoginButton } from "~/components/LoginButton";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Authorization code missing. Please try again.",
  missing_credentials: "Server configuration error. Please contact support.",
  token_exchange_failed: "Failed to authenticate with Google. Please try again.",
  profile_fetch_failed: "Failed to retrieve your profile. Please try again.",
  user_creation_failed: "Failed to create account. Please try again.",
  internal_error: "An internal error occurred. Please try again.",
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  useEffect(() => {
    if (success) {
      window.close();
    }
  }, [success]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-base-100 rounded-2xl shadow-xl border border-base-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome to Tuziyo</h2>
          <p className="mt-2 text-base-content/60">
            Sign in to start creating amazing images
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-4 rounded-lg text-sm text-center">
            {ERROR_MESSAGES[error] || "An error occurred during login."}
          </div>
        )}

        {success && (
          <div className="bg-success/10 text-success p-4 rounded-lg text-sm text-center">
            Payment successful! You can close this window.
          </div>
        )}

        <div className="mt-8">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}