'use client';

/**
 * ArielWordmark
 * Cormorant Garamond italic weight 300 — high-contrast luxury serif.
 * Unexpected in ed-tech. That's the point.
 *
 * Props:
 *   size        — font-size in px (default 96)
 *   variant     — 'dark' | 'light' | 'purple'
 *   showTagline — renders thin divider + "go deeper." below (default false)
 *   animate     — fade-in entrance animation (default false)
 *   className
 */

interface ArielWordmarkProps {
  size?: number;
  variant?: 'dark' | 'light' | 'purple';
  showTagline?: boolean;
  animate?: boolean;
  className?: string;
}

export default function ArielWordmark({
  size = 96,
  variant = 'dark',
  showTagline = false,
  animate = false,
  className = '',
}: ArielWordmarkProps) {
  const s = size / 96;

  const wordColor =
    variant === 'light' ? '#0e0e13' : '#ffffff';

  // The i is violet — a quiet signature within the letterform
  const iColor =
    variant === 'light' ? '#6B3FD4' : variant === 'purple' ? 'rgba(255,255,255,0.55)' : '#9B7FFF';

  const dividerColor =
    variant === 'light'
      ? 'rgba(0,0,0,0.12)'
      : variant === 'purple'
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.1)';

  const taglineColor =
    variant === 'light' ? '#6b6760' : variant === 'purple' ? 'rgba(255,255,255,0.6)' : '#8888a0';

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
    fontSize: size,
    fontWeight: 300,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: `${Math.max(1, 12 * s)}px`,
    textTransform: 'lowercase',
    userSelect: 'none',
    animation: animate ? 'ariel-fade 1s 0.1s ease both' : undefined,
    display: 'inline',
  };

  const taglineStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize: Math.max(12, 11 * s),
    fontWeight: 200,
    letterSpacing: `${Math.max(2, 6 * s)}px`,
    textTransform: 'lowercase',
    color: taglineColor,
    animation: animate ? 'ariel-fade 1s 0.5s ease both' : undefined,
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {animate && (
        <style>{`
          @keyframes ariel-fade {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}

      <div style={{ animation: wordStyle.animation }}>
        <span style={{ ...wordStyle, animation: undefined, color: wordColor }}>ar</span>
        <span style={{ ...wordStyle, animation: undefined, color: iColor }}>i</span>
        <span style={{ ...wordStyle, animation: undefined, color: wordColor }}>el</span>
      </div>

      {showTagline && (
        <>
          <div style={{
            width: 1,
            height: Math.max(16, 28 * s),
            background: dividerColor,
            margin: `${Math.max(10, 18 * s)}px 0 ${Math.max(8, 16 * s)}px`,
            animation: animate ? 'ariel-fade 1s 0.35s ease both' : undefined,
          }} />
          <div style={taglineStyle}>go deeper.</div>
        </>
      )}
    </div>
  );
}
