'use client';

import { useEffect, useState } from 'react';

/**
 * ArielWordmark
 * Cormorant Garamond italic weight 300 — high-contrast luxury serif.
 *
 * Props:
 *   size        — font-size in px (default 96)
 *   variant     — 'dark' | 'light' | 'purple'
 *   showTagline — renders thin divider + "go deeper." below (default false)
 *   animate     — wordmark fades in, tagline types itself character by character (default false)
 *   className
 */

const TAGLINE_BODY = 'go deeper';   // without the period
const TAGLINE_FULL = 'go deeper.';  // period is gold and animates in last

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

  // Typewriter state — starts full when not animating
  const [visibleChars, setVisibleChars] = useState(
    animate && showTagline ? 0 : TAGLINE_FULL.length
  );

  useEffect(() => {
    if (!animate || !showTagline) return;
    setVisibleChars(0);

    // Wait for wordmark fade-in to finish before typing starts
    const startDelay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleChars(i);
        if (i >= TAGLINE_FULL.length) clearInterval(interval);
      }, 88);
      return () => clearInterval(interval);
    }, 1300);

    return () => clearTimeout(startDelay);
  }, [animate, showTagline]);

  const wordColor   = variant === 'light' ? '#0e0e13' : '#ffffff';
  const iColor      = variant === 'light' ? '#6B3FD4' : variant === 'purple' ? 'rgba(255,255,255,0.55)' : '#9B7FFF';
  const goldColor   = '#C9A96E';

  const dividerColor =
    variant === 'light'  ? 'rgba(0,0,0,0.12)' :
    variant === 'purple' ? 'rgba(255,255,255,0.2)' :
                           'rgba(255,255,255,0.1)';

  const taglineColor =
    variant === 'light'  ? '#6b6760' :
    variant === 'purple' ? 'rgba(255,255,255,0.6)' :
                           '#8888a0';

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
    fontSize: size,
    fontWeight: 300,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: `${Math.max(1, 12 * s)}px`,
    textTransform: 'lowercase',
    userSelect: 'none',
  };

  const taglineStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize: Math.max(12, 11 * s),
    fontWeight: 200,
    letterSpacing: `${Math.max(2, 6 * s)}px`,
    textTransform: 'lowercase',
    color: taglineColor,
  };

  // What's visible of "go deeper" (without period)
  const bodyVisible  = TAGLINE_FULL.slice(0, Math.min(visibleChars, TAGLINE_BODY.length));
  const showPeriod   = visibleChars >= TAGLINE_FULL.length;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <style>{`
        @keyframes ariel-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes period-settle {
          0%   { transform: scale(0.7); opacity: 0; }
          65%  { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* Wordmark */}
      <div style={{ animation: animate ? 'ariel-fade 1s 0.1s ease both' : undefined }}>
        <span style={{ ...wordStyle, color: wordColor }}>ar</span>
        <span style={{ ...wordStyle, color: iColor }}>i</span>
        <span style={{ ...wordStyle, color: wordColor }}>el</span>
      </div>

      {showTagline && (
        <>
          {/* Hairline divider */}
          <div style={{
            width: 1,
            height: Math.max(16, 28 * s),
            background: dividerColor,
            margin: `${Math.max(10, 18 * s)}px 0 ${Math.max(8, 16 * s)}px`,
            animation: animate ? 'ariel-fade 1s 0.35s ease both' : undefined,
          }} />

          {/* Tagline — typed character by character, gold period settles last */}
          <div style={{ ...taglineStyle, display: 'flex', alignItems: 'baseline' }}>
            <span>{bodyVisible}</span>
            {showPeriod && (
              <span style={{
                color: goldColor,
                display: 'inline-block',
                animation: animate ? 'period-settle 0.4s ease both' : undefined,
              }}>.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
