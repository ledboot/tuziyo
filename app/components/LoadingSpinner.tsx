export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-primary-brand/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          Loading...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  )
}
