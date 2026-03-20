/**
 * Ported from ariel-web/lib/time.ts
 * Pure TypeScript — no DOM dependencies.
 */

export function parseUTC(d?: string | null): Date {
  if (!d) return new Date(0);
  // Already has timezone info
  if (d.endsWith('Z') || d.includes('+') || d.includes('-', 10)) return new Date(d);
  return new Date(d + 'Z');
}

export function timeAgo(d?: string | null): string {
  if (!d) return '';
  const s = Math.floor((Date.now() - parseUTC(d).getTime()) / 1000);
  if (s < 0) return 'just now';
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  const date = parseUTC(d);
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}`;
}
