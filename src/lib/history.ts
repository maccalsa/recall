import { invoke } from "@tauri-apps/api/core";

export interface AccessEvent {
  filename: string;
  timestamp: number;
}

export interface Config {
  pinned?: string[];
}

const MAX_HISTORY = 200;

let historyCache: AccessEvent[] | null = null;
let configCache: Config | null = null;

export async function loadHistory(): Promise<AccessEvent[]> {
  if (historyCache) return historyCache;
  const json = await invoke<string>("read_history");
  historyCache = JSON.parse(json) as AccessEvent[];
  return historyCache;
}

async function saveHistory(events: AccessEvent[]): Promise<void> {
  historyCache = events;
  await invoke("write_history", { json: JSON.stringify(events) });
}

export async function recordAccess(filename: string): Promise<void> {
  const events = await loadHistory();
  events.push({ filename, timestamp: Date.now() });
  if (events.length > MAX_HISTORY) {
    events.splice(0, events.length - MAX_HISTORY);
  }
  await saveHistory(events);
}

export async function getRecentlyViewed(): Promise<string[]> {
  const events = await loadHistory();
  const seen = new Set<string>();
  const recent: string[] = [];

  for (let i = events.length - 1; i >= 0; i--) {
    const { filename } = events[i];
    if (!seen.has(filename)) {
      seen.add(filename);
      recent.push(filename);
    }
    if (recent.length >= 10) break;
  }

  return recent;
}

export async function loadConfig(): Promise<Config> {
  if (configCache) return configCache;
  const json = await invoke<string>("read_config");
  configCache = JSON.parse(json) as Config;
  return configCache;
}

export async function getPinnedFiles(): Promise<string[]> {
  const config = await loadConfig();
  return config.pinned ?? [];
}
