export default function Logo() {
  return (
    <div className="flex items-center gap-3 select-none group">
      <div className="relative size-10 flex items-center justify-center">
        {/* Modern Geometric Rabbit Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full text-primary-brand"
        >
          {/* Ears */}
          <path
            d="M7 2L10 8V11H6V8L7 2Z"
            fill="currentColor"
            className="opacity-90"
          />
          <path
            d="M17 2L14 8V11H18V8L17 2Z"
            fill="currentColor"
            className="opacity-90"
          />
          {/* Face/Head */}
          <path
            d="M12 10L19 15V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V15L12 10Z"
            fill="currentColor"
          />
          {/* "Pixel" Eye decorations */}
          <rect
            x="8"
            y="14"
            width="2"
            height="2"
            fill="white"
            className="opacity-40"
          />
          <rect
            x="14"
            y="14"
            width="2"
            height="2"
            fill="white"
            className="opacity-40"
          />
          {/* Nose/Mouth area */}
          <path
            d="M11 19L12 20L13 19"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {/* "Focus" corner marks suggesting image processing */}
        <div className="absolute -inset-1 border-t-2 border-l-2 border-primary-brand/30 rounded-tl-sm group-hover:border-primary-brand transition-colors" />
        <div className="absolute -inset-1 border-b-2 border-r-2 border-primary-brand/30 rounded-br-sm group-hover:border-primary-brand transition-colors" />
      </div>

      <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-primary-brand transition-colors">
        tuziyo
      </span>
    </div>
  )
}
