'use client';

/**
 * ArielLogo — CSS orbit-through-wordmark logo
 *
 * Props:
 *   size        — font-size in px (default 96). All ring/dot positions scale from 96px baseline.
 *   variant     — 'dark' (on black/dark bg, default) | 'light' (on cream bg) | 'purple' (on brand purple bg)
 *   bgColor     — override the background color used to "cut" the ring (for custom bg colours)
 *   showTagline — show "go deeper." tagline below (default false)
 */

interface ArielLogoProps {
  size?: number;
  variant?: 'dark' | 'light' | 'purple';
  bgColor?: string;
  showTagline?: boolean;
  className?: string;
}

export default function ArielLogo({
  size = 96,
  variant = 'dark',
  bgColor,
  showTagline = false,
  className = '',
}: ArielLogoProps) {
  const s = size / 96; // scale factor

  // Background colours per variant (used for ring "cut" trick)
  const bgMap = {
    dark: bgColor ?? '#09090b',
    light: bgColor ?? '#F2F0ED',
    purple: bgColor ?? '#6B3FD4',
  };
  const bg = bgMap[variant];

  // Per-letter colors — accent i matches the gold node
  const letterColors =
    variant === 'purple'
      ? { ar: '#ffffff', i: 'rgba(255,255,255,0.55)', el: '#ffffff' }
      : variant === 'light'
      ? { ar: '#4a28a8', i: '#a07840', el: '#1a1828' }
      : { ar: '#c4b0ff', i: '#C9A96E', el: '#ffffff' };

  // Ring border gradient per variant
  const ringGradient =
    variant === 'purple'
      ? 'linear-gradient(90deg, white, white)'
      : 'linear-gradient(90deg, #7040E8, #e8e4ff 40%, #C9A96E)';

  // Ring back opacity and front opacity
  const ringBackOpacity = variant === 'light' ? 0.15 : variant === 'purple' ? 0.15 : 0.18;
  const ringFrontOpacity = 0.85;

  // Node colours
  const nodeColor = variant === 'light' ? '#a07840' : '#C9A96E';
  const nodeGlow =
    variant === 'light'
      ? '0 0 6px rgba(160,120,64,0.7), 0 0 16px rgba(160,120,64,0.3)'
      : '0 0 8px rgba(201,169,110,0.9), 0 0 20px rgba(201,169,110,0.5), 0 0 40px rgba(201,169,110,0.2)';
  const nodeWhiteCore = variant === 'light' ? 'rgba(242,240,237,0.7)' : 'rgba(255,255,255,0.9)';

  // Tagline colour
  const taglineColor =
    variant === 'purple'
      ? 'rgba(255,255,255,0.28)'
      : variant === 'light'
      ? '#b8b4aa'
      : '#2a2a3a';

  // Scaled ring dimensions (baseline at 96px font-size)
  const ringW = 520 * s;
  const ringH = 80 * s;
  const ringTop = 68 * s; // center of ring from top of .logo-wrap
  const ringLeft = -18 * s;
  const ringThick = Math.max(1.5, 2 * s); // keep visible at small sizes

  // Ring position: top edge = ringTop - ringH/2
  const ringTopEdge = ringTop - ringH / 2;

  // i-dot kill (covers Syne 800 i-dot at baseline 96px)
  const dotKillW = 18 * s;
  const dotKillH = 18 * s;
  const dotKillTop = 3 * s;
  const dotKillLeft = 188 * s;

  // Orbital node
  const nodeSize = 14 * s;
  const nodeTop = 6 * s;
  const nodeLeft = 191 * s;
  const nodeCoreSize = 5 * s;

  const ringSharedStyle: React.CSSProperties = {
    position: 'absolute',
    width: ringW,
    height: ringH,
    borderRadius: '50%',
    transform: `rotate(-6deg)`,
    pointerEvents: 'none',
    top: ringTopEdge,
    left: ringLeft,
    border: `${ringThick}px solid transparent`,
  };

  const ringBack: React.CSSProperties = {
    ...ringSharedStyle,
    background: `linear-gradient(${bg}, ${bg}) padding-box, ${ringGradient} border-box`,
    opacity: ringBackOpacity,
    zIndex: 0,
  };

  const ringFront: React.CSSProperties = {
    ...ringSharedStyle,
    background: `linear-gradient(${bg}, ${bg}) padding-box, ${ringGradient} border-box`,
    opacity: ringFrontOpacity,
    zIndex: 3,
    clipPath: 'inset(0 0 0 50%)',
    filter: 'drop-shadow(0 0 6px rgba(201,169,110,0.4))',
  };

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-syne), 'Syne', sans-serif",
    fontSize: size,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: `-${4 * s}px`,
    position: 'relative',
    zIndex: 1,
    paddingBottom: 8 * s,
    userSelect: 'none',
  };

  const dotKillStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 2,
    borderRadius: '50%',
    width: dotKillW,
    height: dotKillH,
    top: dotKillTop,
    left: dotKillLeft,
    background: bg,
  };

  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 4,
    borderRadius: '50%',
    width: nodeSize,
    height: nodeSize,
    top: nodeTop,
    left: nodeLeft,
    background: nodeColor,
    boxShadow: nodeGlow,
    animation: 'ariel-node-pulse 3s ease-in-out infinite',
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <style>{`
        @keyframes ariel-node-pulse {
          0%, 100% {
            box-shadow: 0 0 ${8*s}px rgba(201,169,110,0.9),
                        0 0 ${20*s}px rgba(201,169,110,0.5),
                        0 0 ${40*s}px rgba(201,169,110,0.2);
          }
          50% {
            box-shadow: 0 0 ${12*s}px rgba(201,169,110,1.0),
                        0 0 ${30*s}px rgba(201,169,110,0.7),
                        0 0 ${60*s}px rgba(201,169,110,0.3);
          }
        }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Layer 0: ring behind text */}
        <div style={ringBack} />

        {/* Layer 1: the word — i is gold to tie it to the orbital node */}
        <div style={wordStyle}>
          <span style={{ color: letterColors.ar }}>ar</span>
          <span style={{ color: letterColors.i }}>i</span>
          <span style={{ color: letterColors.el }}>el</span>
        </div>

        {/* Layer 2: erase i-dot */}
        <div style={dotKillStyle} />

        {/* Layer 3: ring in front (right half only) */}
        <div style={ringFront} />

        {/* Layer 4: gold orbital node */}
        <div style={nodeStyle}>
          <div style={{
            position: 'absolute',
            width: nodeCoreSize,
            height: nodeCoreSize,
            background: nodeWhiteCore,
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
        </div>
      </div>

      {showTagline && (
        <div style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: Math.max(9, 10.5 * s),
          fontWeight: 200,
          letterSpacing: `${7 * s}px`,
          textTransform: 'lowercase',
          marginTop: 22 * s,
          color: taglineColor,
        }}>
          go deeper.
        </div>
      )}
    </div>
  );
}
