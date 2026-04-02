import MiniSearch, { type SearchResult } from "minisearch";
import { invoke } from "@tauri-apps/api/core";
import { parseFrontmatter } from "./markdown";

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
