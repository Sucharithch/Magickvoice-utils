export function localTime(raw: string | undefined, tz: string): string {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleString('en-IN', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return raw
  }
}
