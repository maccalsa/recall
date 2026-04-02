import { describe, it, expect } from "vitest";
import { parseFrontmatter, wrapCollapsibleSections } from "./markdown";

describe("parseFrontmatter", () => {
  it("extracts title and tags from YAML frontmatter", () => {
    const raw = `---
title: Git
tags: [git, version-control]
---

# Git Cheat Sheet`;

    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.title).toBe("Git");
    expect(frontmatter.tags).toEqual(["git", "version-control"]);
    expect(body.trim()).toBe("# Git Cheat Sheet");
  });

  it("returns empty frontmatter when none present", () => {
    const raw = "# No Frontmatter\n\nSome content.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({});
    expect(body).toBe(raw);
  });

  it("handles frontmatter with simple string values", () => {
    const raw = `---
title: Docker
icon: docker
---

Body text`;

    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.title).toBe("Docker");
    expect(frontmatter.icon).toBe("docker");
  });

  it("handles Windows-style line endings", () => {
    const raw = "---\r\ntitle: Test\r\n---\r\n\r\nBody";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.title).toBe("Test");
    expect(body.trim()).toBe("Body");
  });
});

describe("wrapCollapsibleSections", () => {
  it("wraps H2 sections in <details> elements", () => {
    const html =
      "<h1>Title</h1><h2>Section A</h2><p>Content A</p><h2>Section B</h2><p>Content B</p>";
    const result = wrapCollapsibleSections(html);

    expect(result).toContain('<details class="collapsible-section" open>');
    expect(result).toContain("<summary><h2>Section A</h2></summary>");
    expect(result).toContain("<summary><h2>Section B</h2></summary>");
    expect(result).toContain("</details>");
  });

  it("preserves content before the first H2", () => {
    const html = "<h1>Title</h1><p>Intro</p><h2>First</h2><p>Body</p>";
    const result = wrapCollapsibleSections(html);

    expect(result).toMatch(/^<h1>Title<\/h1><p>Intro<\/p>/);
  });

  it("returns unchanged HTML when there are no H2 elements", () => {
    const html = "<h1>Title</h1><p>Just a paragraph</p>";
    const result = wrapCollapsibleSections(html);
    expect(result).toBe(html);
  });

  it("handles a single H2 section", () => {
    const html = "<h2>Only Section</h2><p>Content</p>";
    const result = wrapCollapsibleSections(html);

    expect(result).toContain('<details class="collapsible-section" open>');
    expect(result).toContain("<summary><h2>Only Section</h2></summary>");
    expect(result).toContain("<p>Content</p>");
    expect(result).toContain("</details>");
  });

  it("keeps each section's content inside its own <details>", () => {
    const html = "<h2>A</h2><pre>code a</pre><h2>B</h2><pre>code b</pre>";
    const result = wrapCollapsibleSections(html);

    const detailsBlocks = result.match(/<details[^>]*>[\s\S]*?<\/details>/g);
    expect(detailsBlocks).toHaveLength(2);
    expect(detailsBlocks![0]).toContain("code a");
    expect(detailsBlocks![1]).toContain("code b");
  });
});
