/**
 * ArielLoader — branded orbit loading indicator
 * The arc rotates around the glowing center dot.
 */

interface ArielLoaderProps {
  size?: number;
  className?: string;
}

export default function ArielLoader({ size = 48, className = '' }: ArielLoaderProps) {
  const id = `al-${size}`;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7040E8" />
            <stop offset="100%" stopColor="#C9A96E" />
          </linearGradient>
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Static orbit ring */}
        <ellipse cx="30" cy="30" r="22" stroke={`url(#${id}-g)`} strokeWidth="1.2" opacity="0.2" fill="none" />

        {/* Rotating arc */}
        <g className="ariel-orbit-arc">
          <path
            d="M 30 8 A 22 22 0 0 1 50.6 39"
            stroke={`url(#${id}-g)`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
            filter={`url(#${id}-glow)`}
          />
          {/* Gold trailing dot at arc end */}
          <circle cx="50.6" cy="39" r="2" fill="#C9A96E" opacity="0.9" />
        </g>

        {/* Center dot — pulsing */}
        <circle cx="30" cy="30" r="4.5" fill={`url(#${id}-g)`} className="ariel-orbit-dot" filter={`url(#${id}-glow)`} />
        <circle cx="30" cy="30" r="2" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
}
