/**
 * ArielIcon — the orbit mark SVG (no wordmark)
 * Used in avatar spots, SideNav collapsed, etc.
 *
 * Props:
 *   size    — width/height in px (default 40)
 *   variant — 'dark' | 'purple' | 'light'
 */

interface ArielIconProps {
  size?: number;
  variant?: 'dark' | 'purple' | 'light';
  className?: string;
}

export default function ArielIcon({ size = 40, variant = 'dark', className = '' }: ArielIconProps) {
  const id = `ai-${size}-${variant}`;

  if (variant === 'purple') {
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 60 60" fill="none">
        <ellipse cx="30" cy="30" r="22" stroke="white" strokeWidth="1.3" opacity="0.3" fill="none"/>
        <path d="M 30 8 A 22 22 0 0 1 50.6 39" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.78"/>
        <circle cx="30" cy="30" r="4.5" fill="white" opacity="0.9"/>
        <circle cx="30" cy="30" r="2" fill="white" opacity="0.85"/>
        <circle cx="50.6" cy="39" r="1.8" fill="#C9A96E" opacity="0.9"/>
      </svg>
    );
  }

  if (variant === 'light') {
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 60 60" fill="none">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4a28a8"/>
            <stop offset="100%" stopColor="#8a6028"/>
          </linearGradient>
        </defs>
        <ellipse cx="30" cy="30" r="22" stroke={`url(#${id}-g)`} strokeWidth="1.6" opacity="0.5" fill="none"/>
        <path d="M 30 8 A 22 22 0 0 1 50.6 39" stroke="#8a6028" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8"/>
        <circle cx="30" cy="30" r="4.5" fill={`url(#${id}-g)`}/>
        <circle cx="30" cy="30" r="2" fill="white" opacity="0.5"/>
      </svg>
    );
  }

  // default: dark (on black/dark bg)
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7040E8"/>
          <stop offset="100%" stopColor="#C9A96E"/>
        </linearGradient>
        <filter id={`${id}-f`}>
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`${id}-n`}>
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="30" cy="30" r="22" stroke={`url(#${id}-g)`} strokeWidth="1.3" opacity="0.45" fill="none"/>
      <path d="M 30 8 A 22 22 0 0 1 50.6 39" stroke={`url(#${id}-g)`} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" filter={`url(#${id}-f)`}/>
      <circle cx="30" cy="30" r="4.5" fill={`url(#${id}-g)`} filter={`url(#${id}-n)`}/>
      <circle cx="30" cy="30" r="2" fill="white" opacity="0.85"/>
      <circle cx="30" cy="8" r="2.2" fill="#7040E8" opacity="0.7"/>
      <circle cx="50.6" cy="39" r="1.8" fill="#C9A96E" opacity="0.88"/>
    </svg>
  );
}
