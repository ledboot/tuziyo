import { isRouteErrorResponse, useRouteError } from 'react-router'

export default function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-brand">
              {error.status}
            </h1>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
              {error.statusText}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.status === 404
                ? "The page you're looking for doesn't exist."
                : 'Something went wrong. Please try again later.'}
            </p>

            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-brand text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Oops! Something went wrong
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an unexpected error. Please try refreshing the page
            or return to the homepage.
          </p>

          {error instanceof Error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Error details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-40">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-primary-brand text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
