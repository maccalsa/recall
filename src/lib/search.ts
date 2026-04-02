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

function buildIndex(docs: CheatDoc[]): MiniSearch<CheatDoc> {
  const index = new MiniSearch<CheatDoc>({
    fields: ["title", "tags", "sections"],
    storeFields: ["filename", "title"],
    searchOptions: {
      boost: { title: 3, tags: 2, sections: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll(docs);
  return index;
}

export async function loadAndIndex(): Promise<{
  index: MiniSearch<CheatDoc>;
  docs: CheatDoc[];
}> {
  const filenames = await invoke<string[]>("list_cheat_files");
  const docs: CheatDoc[] = [];

  for (const filename of filenames) {
    const raw = await invoke<string>("read_cheat_file", { filename });
    const { frontmatter, body } = parseFrontmatter(raw);

    const title =
      typeof frontmatter.title === "string"
        ? frontmatter.title
        : filename.replace(/\.md$/, "");

    const tags = Array.isArray(frontmatter.tags)
      ? (frontmatter.tags as string[]).join(" ")
      : "";

    const sections = extractSections(body).join(" ");

    docs.push({ id: filename, filename, title, tags, sections });
  }

  return { index: buildIndex(docs), docs };
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
