import MiniSearch, { type SearchResult } from "minisearch";
import { invoke } from "@tauri-apps/api/core";
import { parseFrontmatter } from "./markdown";
import type { HistoryStats } from "./history";

export interface CheatDoc {
  id: string;
  filename: string;
  title: string;
  tags: string;
  sections: string;
}

export interface SearchHit {
  filename: string;
  title: string;
  score: number;
}

const H2_REGEX = /^##\s+(.+)$/gm;

function extractSections(body: string): string[] {
  return [...body.matchAll(H2_REGEX)].map((m) => m[1].trim());
}

const INDEX_OPTIONS = {
  fields: ["title", "tags", "sections"],
  storeFields: ["filename", "title"],
  searchOptions: {
    boost: { title: 3, tags: 2, sections: 1 },
    fuzzy: 0.2,
    prefix: true,
  },
};

function buildIndex(docs: CheatDoc[]): MiniSearch<CheatDoc> {
  const index = new MiniSearch<CheatDoc>(INDEX_OPTIONS);
  index.addAll(docs);
  return index;
}

function parseCheatFile(filename: string, raw: string): CheatDoc {
  const { frontmatter, body } = parseFrontmatter(raw);

  const title =
    typeof frontmatter.title === "string"
      ? frontmatter.title
      : filename.replace(/\.md$/, "");

  const tags = Array.isArray(frontmatter.tags)
    ? (frontmatter.tags as string[]).join(" ")
    : "";

  const sections = extractSections(body).join(" ");

  return { id: filename, filename, title, tags, sections };
}

export async function loadAndIndex(): Promise<{
  index: MiniSearch<CheatDoc>;
  docs: CheatDoc[];
}> {
  const filenames = await invoke<string[]>("list_cheat_files");
  const docs: CheatDoc[] = [];

  for (const filename of filenames) {
    const raw = await invoke<string>("read_cheat_file", { filename });
    docs.push(parseCheatFile(filename, raw));
  }

  return { index: buildIndex(docs), docs };
}

/**
 * Incrementally adds or updates a single cheat file in the index.
 * Returns the updated docs array (new reference for Svelte reactivity).
 */
export async function upsertInIndex(
  index: MiniSearch<CheatDoc>,
  docs: CheatDoc[],
  filename: string,
): Promise<CheatDoc[]> {
  const raw = await invoke<string>("read_cheat_file", { filename });
  const doc = parseCheatFile(filename, raw);

  const existingIdx = docs.findIndex((d) => d.filename === filename);
  if (existingIdx !== -1) {
    index.replace(doc);
    const updated = [...docs];
    updated[existingIdx] = doc;
    return updated;
  }

  index.add(doc);
  return [...docs, doc];
}

/**
 * Removes a cheat file from the index.
 * Returns the updated docs array (new reference for Svelte reactivity).
 */
export function removeFromIndex(
  index: MiniSearch<CheatDoc>,
  docs: CheatDoc[],
  filename: string,
): CheatDoc[] {
  const existing = docs.find((d) => d.filename === filename);
  if (existing) {
    index.remove(existing);
    return docs.filter((d) => d.filename !== filename);
  }
  return docs;
}

export function search(
  index: MiniSearch<CheatDoc>,
  query: string,
): SearchHit[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = index.search(query);
  return results.map((r) => ({
    filename: r.filename as string,
    title: r.title as string,
    score: r.score,
  }));
}

const WEIGHT_RELEVANCE = 0.5;
const WEIGHT_FREQUENCY = 0.3;
const WEIGHT_RECENCY = 0.2;
const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Combines MiniSearch text relevance with usage history to produce
 * a weighted ranking: relevance (0.5) + frequency (0.3) + recency (0.2).
 */
export function rankedSearch(
  index: MiniSearch<CheatDoc>,
  query: string,
  stats: HistoryStats,
  now: number = Date.now(),
): SearchHit[] {
  const hits = search(index, query);
  if (hits.length === 0) return hits;

  const maxRelevance = Math.max(...hits.map((h) => h.score));
  const maxFrequency = Math.max(
    1,
    ...hits.map((h) => stats.frequency.get(h.filename) ?? 0),
  );

  return hits
    .map((hit) => {
      const normRelevance = maxRelevance > 0 ? hit.score / maxRelevance : 0;

      const freq = stats.frequency.get(hit.filename) ?? 0;
      const normFrequency = freq / maxFrequency;

      const lastTs = stats.lastAccess.get(hit.filename) ?? 0;
      const ageMs = Math.max(0, now - lastTs);
      const normRecency =
        lastTs > 0 ? Math.exp((-ageMs * Math.LN2) / RECENCY_HALF_LIFE_MS) : 0;

      const combined =
        WEIGHT_RELEVANCE * normRelevance +
        WEIGHT_FREQUENCY * normFrequency +
        WEIGHT_RECENCY * normRecency;

      return { ...hit, score: combined };
    })
    .sort((a, b) => b.score - a.score);
}
