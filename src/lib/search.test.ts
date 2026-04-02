import { describe, it, expect } from "vitest";
import MiniSearch from "minisearch";

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
