/**
 * Parse a date string from the backend as UTC.
 * MongoDB returns naive ISO strings without 'Z', which browsers parse as local time.
 * Appending 'Z' forces UTC interpretation everywhere.
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
  return parseUTC(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
