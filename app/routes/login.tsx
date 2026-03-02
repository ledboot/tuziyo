import { Form, useSearchParams } from "react-router";
import { LogIn } from "lucide-react";

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Nano Banana
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to start creating amazing images
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-4 rounded-lg text-sm text-center">
            {error === "missing_code" &&
              "Google login failed. Please try again."}
            {error === "token_exchange_failed" &&
              "Failed to authenticate with Google."}
            {error === "profile_fetch_failed" &&
              "Failed to retrieve your profile."}
            {error === "internal_server_error" &&
              "An internal error occurred. Please try again."}
            {![
              "missing_code",
              "token_exchange_failed",
              "profile_fetch_failed",
              "internal_server_error",
            ].includes(error) && "An error occurred during login."}
          </div>
        )}

        <div className="mt-8">
          <Form action="/auth/google" method="post" className="w-full">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-brand hover:bg-primary-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand transition-colors duration-200"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
