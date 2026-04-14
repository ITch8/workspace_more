type Level = "info" | "error";

export function log(level: Level, event: string, meta: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level, event, ...meta, ts: new Date().toISOString() }));
}
