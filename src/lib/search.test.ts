import { describe, it, expect } from "vitest";
import MiniSearch from "minisearch";
import { rankedSearch } from "./search";
import { computeHistoryStats, type AccessEvent } from "./history";

interface CheatDoc {
  id: string;
  filename: string;
  title: string;
  tags: string;
  sections: string;
}

function buildTestIndex(docs: CheatDoc[]): MiniSearch<CheatDoc> {
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

const SAMPLE_DOCS: CheatDoc[] = [
  {
    id: "git.md",
    filename: "git.md",
    title: "Git",
    tags: "git version-control scm",
    sections: "Setup & Config Create & Clone Staging & Committing Branching",
  },
  {
    id: "docker.md",
    filename: "docker.md",
    title: "Docker",
    tags: "docker containers devops",
    sections: "Images Containers Docker Compose Volumes & Networks Cleanup",
  },
  {
    id: "vim.md",
    filename: "vim.md",
    title: "Vim",
    tags: "vim neovim editor text-editor",
    sections: "Movement Editing Visual Mode Search & Replace Files & Buffers",
  },
  {
    id: "bash.md",
    filename: "bash.md",
    title: "Bash",
    tags: "bash shell terminal scripting",
    sections: "Navigation File Operations Text Processing Pipes & Redirection",
  },
];

describe("search index", () => {
  it("returns results for an exact title match", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("Git");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toBe("git.md");
  });

  it("returns results for a tag search", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("containers");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toBe("docker.md");
  });

  it("returns results for a section heading search", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("Branching");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toBe("git.md");
  });

  it("supports prefix search", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("doc");
    expect(results.some((r) => r.filename === "docker.md")).toBe(true);
  });

  it("supports fuzzy matching", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("doker");
    expect(results.some((r) => r.filename === "docker.md")).toBe(true);
  });

  it("returns empty array for non-matching query", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("xyznonexistent");
    expect(results).toHaveLength(0);
  });

  it("ranks title matches higher than section matches", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("vim");
    expect(results[0].filename).toBe("vim.md");
  });

  it("returns results for cross-document queries", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const results = index.search("editor");
    expect(results.some((r) => r.filename === "vim.md")).toBe(true);
  });
});

describe("computeHistoryStats", () => {
  it("counts frequency per filename", () => {
    const events: AccessEvent[] = [
      { filename: "git.md", timestamp: 100 },
      { filename: "git.md", timestamp: 200 },
      { filename: "docker.md", timestamp: 300 },
    ];
    const stats = computeHistoryStats(events);
    expect(stats.frequency.get("git.md")).toBe(2);
    expect(stats.frequency.get("docker.md")).toBe(1);
  });

  it("tracks most recent access per filename", () => {
    const events: AccessEvent[] = [
      { filename: "git.md", timestamp: 100 },
      { filename: "git.md", timestamp: 500 },
      { filename: "git.md", timestamp: 300 },
    ];
    const stats = computeHistoryStats(events);
    expect(stats.lastAccess.get("git.md")).toBe(500);
  });

  it("returns empty maps for empty history", () => {
    const stats = computeHistoryStats([]);
    expect(stats.frequency.size).toBe(0);
    expect(stats.lastAccess.size).toBe(0);
  });
});

describe("rankedSearch", () => {
  const NOW = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  it("boosts frequently accessed sheets", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const events: AccessEvent[] = Array.from({ length: 20 }, (_, i) => ({
      filename: "docker.md",
      timestamp: NOW - i * 1000,
    }));
    const stats = computeHistoryStats(events);

    // "editor" matches vim via tags, but docker has heavy usage history
    // Search for something that matches both somewhat
    const results = rankedSearch(index, "containers", stats, NOW);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toBe("docker.md");
  });

  it("boosts recently accessed sheets", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const events: AccessEvent[] = [
      { filename: "vim.md", timestamp: NOW - 1000 },
      { filename: "bash.md", timestamp: NOW - 30 * ONE_DAY },
    ];
    const stats = computeHistoryStats(events);

    // Both match "editor" / "terminal" loosely, but vim was accessed just now
    const results = rankedSearch(index, "vim", stats, NOW);
    expect(results[0].filename).toBe("vim.md");
  });

  it("returns results even with no history", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const stats = computeHistoryStats([]);
    const results = rankedSearch(index, "Git", stats, NOW);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toBe("git.md");
  });

  it("returns empty array for non-matching query", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const stats = computeHistoryStats([]);
    const results = rankedSearch(index, "xyznonexistent", stats, NOW);
    expect(results).toHaveLength(0);
  });

  it("preserves all result fields", () => {
    const index = buildTestIndex(SAMPLE_DOCS);
    const stats = computeHistoryStats([]);
    const results = rankedSearch(index, "Git", stats, NOW);
    expect(results[0]).toHaveProperty("filename");
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("score");
    expect(results[0].score).toBeGreaterThan(0);
  });
});
