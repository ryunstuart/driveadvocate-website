export function parseAppSyncResult(data: any, fallback: any = null): any {
  if (data === null || data === undefined) return fallback;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  return data;
}
