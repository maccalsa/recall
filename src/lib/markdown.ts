import { Marked, type Tokens } from "marked";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
  bundledLanguages,
} from "shiki";

const DARK_THEME = "catppuccin-mocha" as const;
const LIGHT_THEME = "catppuccin-latte" as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [DARK_THEME, LIGHT_THEME],
      langs: [
        "bash",
        "javascript",
        "typescript",
        "python",
        "rust",
        "json",
        "yaml",
        "toml",
        "html",
        "css",
        "sql",
        "go",
        "dockerfile",
        "markdown",
      ],
    });
  }
  return highlighterPromise;
}

function isKnownLanguage(lang: string): lang is BundledLanguage {
  return lang in bundledLanguages;
}

function createMarkedInstance(highlighter: Highlighter): Marked {
  const marked = new Marked();

  marked.use({
    renderer: {
      code({ text, lang }: Tokens.Code): string {
        const language = lang?.trim().toLowerCase() ?? "";
        let highlighted: string;

        if (language && isKnownLanguage(language)) {
          highlighted = highlighter.codeToHtml(text, {
            lang: language,
            themes: { dark: DARK_THEME, light: LIGHT_THEME },
          });
        } else {
          highlighted = highlighter.codeToHtml(text, {
            lang: "text",
            themes: { dark: DARK_THEME, light: LIGHT_THEME },
          });
        }

        return `<div class="code-block-wrapper">
          <button class="copy-btn" aria-label="Copy code" title="Copy">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/>
              <path d="M10.5 5.5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2"/>
            </svg>
          </button>
          ${highlighted}
        </div>`;
      },
    },
  });

  return marked;
}

/**
 * Wraps sequences of H2 + body content into collapsible <details> elements.
 * Content before the first H2 (like an H1 title) is left unwrapped.
 */
export function wrapCollapsibleSections(html: string): string {
  const H2_REGEX = /(<h2[^>]*>)(.*?)(<\/h2>)/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let inSection = false;

  for (const match of html.matchAll(H2_REGEX)) {
    const matchStart = match.index!;
    const fullMatch = match[0];
    const headingContent = match[2];

    if (inSection) {
      parts.push(html.slice(lastIndex, matchStart));
      parts.push("</details>");
    } else {
      parts.push(html.slice(lastIndex, matchStart));
    }

    parts.push(
      `<details class="collapsible-section" open>`,
      `<summary><h2>${headingContent}</h2></summary>`,
    );
    inSection = true;
    lastIndex = matchStart + fullMatch.length;
  }

  if (inSection) {
    parts.push(html.slice(lastIndex));
    parts.push("</details>");
  } else {
    parts.push(html.slice(lastIndex));
  }

  return parts.join("");
}

export interface RenderResult {
  html: string;
  title: string;
  frontmatter: Record<string, unknown>;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const yamlBlock = match[1];
  const body = raw.slice(match[0].length);
  const frontmatter: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    if (
      typeof value === "string" &&
      value.startsWith("[") &&
      value.endsWith("]")
    ) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

export async function initRenderer(): Promise<(raw: string) => RenderResult> {
  const highlighter = await getHighlighter();
  const marked = createMarkedInstance(highlighter);

  return (raw: string): RenderResult => {
    const { frontmatter, body } = parseFrontmatter(raw);
    const title =
      typeof frontmatter.title === "string"
        ? frontmatter.title
        : extractTitleFromBody(body);

    const rawHtml = marked.parse(body) as string;
    const html = wrapCollapsibleSections(rawHtml);

    return { html, title, frontmatter };
  };
}

function extractTitleFromBody(body: string): string {
  const match = body.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "Untitled";
}
