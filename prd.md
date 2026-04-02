# PRD: Recall

**Instant recall for the tools you use every day.**

An open-source, keyboard-driven overlay that gives you instant, searchable, beautifully rendered cheat sheets — without leaving your current context.

---

## Problem Statement

Developers use dozens of tools daily (git, docker, kubectl, vim, VS Code, etc.) and routinely forget commands, shortcuts, and workflows they've used before. The current options all involve painful context-switching:

- **Google/Stack Overflow**: Leave your app, open a browser, parse SEO-optimised noise, find the answer, switch back. 30-60 seconds lost, flow state broken.
- **ChatGPT/AI**: Faster than Google, but still a full context switch. Overkill for "what's the flag for git stash with a message?"
- **Man pages / `--help`**: Comprehensive but dense. Terrible for quick recall of something you've done before.
- **Personal notes (Obsidian, Notion, text files)**: Require opening another app, navigating to the right note, searching within it. Not instant.
- **tldr / cheat.sh**: Terminal-only. No GUI. No context awareness. Not discoverable.

The core pain: **"I knew this 20 minutes ago and now I have to go find it again."** This happens 5-15 times per day for most developers and compounds into significant lost time and frustration.

---

## Solution

A lightweight desktop application that:

1. Runs silently in the system tray
2. Responds to a global hotkey in under 100ms perceived
3. Detects the currently focused application and immediately shows its cheat sheet (if one exists)
4. Falls back to a fuzzy-search command palette for cross-app lookup
5. Renders markdown cheat sheets with syntax highlighting and copy buttons
6. Dismisses instantly on Escape
7. Requires zero configuration to be useful out of the box (ships with curated cheat sheets)

The interaction model is: **hotkey → see answer → Escape → back to work**. The entire loop should take under 3 seconds.

---

## User Stories

1. As a developer, I want to press a single hotkey and see the cheat sheet for my currently focused app, so that I get help without any typing or searching.
2. As a developer, I want to press a different hotkey to open a search palette, so that I can look up any tool regardless of what app I'm in.
3. As a developer, I want to fuzzy-search across all my cheat sheets by typing a few characters, so that I can find commands even when I don't remember the exact name.
4. As a developer, I want search results ranked by how often and recently I've accessed them, so that my most-used references float to the top.
5. As a developer, I want to press Escape and have the overlay disappear instantly, so that it never feels like it's in my way.
6. As a developer, I want code blocks in cheat sheets to have a copy button, so that I can grab commands without manual selection.
7. As a developer, I want the app to ship with 20+ curated cheat sheets for common tools, so that it's useful from the first launch.
8. As a developer, I want to add my own cheat sheets as markdown files in a known directory, so that I can extend the app for my specific workflow.
9. As a developer, I want cheat sheets to hot-reload when I edit them on disk, so that I don't have to restart the app.
10. As a developer, I want to navigate the UI entirely by keyboard (arrow keys, Enter, Escape, Tab), so that my hands never leave the keyboard.
11. As a developer, I want to search within a cheat sheet once it's open, so that I can jump to the right section in a long document.
12. As a developer, I want to pin frequently-used cheat sheets, so that they appear first in my palette.
13. As a developer, I want a "recently viewed" list in the palette, so that I can quickly re-open what I was just looking at.
14. As a developer, I want dark and light themes that respect my system preference, so that the overlay doesn't clash with my desktop.
15. As a developer, I want the app to use minimal memory and CPU while idle in the tray, so that it doesn't impact my machine.
16. As a developer, I want to configure which hotkeys trigger the app, so that they don't conflict with my existing keybindings.
17. As a developer, I want to edit app-to-cheat-sheet mappings, so that I can control what shows up for each focused application.
18. As a developer, I want the overlay to appear as a floating panel (not a full window), so that it feels lightweight and non-intrusive.
19. As a developer who uses multiple Linux desktop environments, I want the app to detect the active window on both X11 and Wayland, so that context-awareness works regardless of my display server.
20. As a developer, I want to re-open the last-viewed cheat sheet by pressing the hotkey twice quickly, so that I can get back to what I was just reading.
21. As an open-source contributor, I want the cheat sheet format to be simple standard markdown with optional YAML frontmatter, so that contributing new sheets has zero barrier.
22. As a developer, I want collapsible sections in cheat sheets, so that long documents stay scannable.

---

## Implementation Decisions

### Tech Stack

#### App Shell: Tauri v2 (Rust + system WebView)

Evaluated alternatives:

| Option | Verdict | Reasoning |
|---|---|---|
| **Tauri v2** | **Selected** | ~5-10MB binary, ~20-30MB RAM idle, native global shortcut + tray plugins, Rust backend for OS integration. The Rust code surface is bounded (window detection, file watching, search index) — manageable for a Rust beginner. |
| Electron | Rejected | ~150MB binary, ~100-200MB RAM. For an always-running background app, this resource cost is hard to justify. Mature ecosystem is an advantage but not enough to offset the weight. |
| Wails (Go) | Considered | Similar architecture to Tauri but smaller community, less mature plugin ecosystem, weaker documentation. Go is more approachable than Rust but Tauri's ecosystem advantage is decisive. |
| Native (GTK/Qt) | Rejected | Not cross-platform. Double the work for macOS support later. |
| Flutter | Rejected | Poor support for overlay-style windows, global hotkeys, and tray apps on Linux. |

#### Frontend: Svelte 5 (with Vite, NOT SvelteKit)

Evaluated alternatives:

| Option | Verdict | Reasoning |
|---|---|---|
| **Svelte 5** | **Selected** | Compiles to vanilla JS (no runtime overhead), smallest production bundle of any framework, reactive primitives (runes) are ideal for search-as-you-type UX. Tauri v2 has official Svelte template. |
| SvelteKit | Rejected | Full meta-framework with routing, SSR, etc. Overkill for a single-view overlay app. Adds complexity without benefit. |
| Solid.js | Considered | Comparable performance to Svelte, fine-grained reactivity. Smaller community and tooling ecosystem tipped the balance toward Svelte. |
| React/Preact | Rejected | Virtual DOM overhead is unnecessary for this app's simple UI. Larger bundle for no benefit. |
| Vue 3 | Rejected | Larger runtime than Svelte. No specific advantage for this use case. |

#### Search: MiniSearch (JS) for V1, with Rust migration path

- For the expected corpus size (<200 markdown files), JS-side fuzzy search is fast enough (<5ms per query).
- `minisearch` chosen over `fuse.js` for better indexing and prefix search support.
- If corpus grows significantly or search latency becomes an issue, migrate to Rust-side `nucleo` (the fuzzy matcher powering Neovim's Telescope).

#### Markdown Rendering: `marked` + `shiki`

- `marked` for markdown-to-HTML parsing (fast, extensible).
- `shiki` for syntax highlighting (uses VS Code's TextMate grammars — beautiful, accurate output with theme support).

#### Active Window Detection

This is the most platform-dependent component. Architecture uses a strategy pattern with per-backend implementations:

| Environment | Approach |
|---|---|
| X11 | `xdotool getactivewindow getwindowclassname` (shell out) |
| Wayland (wlroots: Sway, Hyprland) | `swaymsg -t get_tree` / `hyprctl activewindow -j` (JSON parsing) |
| Wayland (GNOME) | D-Bus `org.gnome.Shell.Eval` or `gdbus` |
| Wayland (KDE) | `kdotool` or KWin scripting D-Bus |
| macOS (future) | `NSWorkspace.shared.frontmostApplication` via Rust bindings |

For compositors without programmatic window detection, the app gracefully degrades to palette-only mode (context-awareness disabled, search still works).

#### Global Hotkeys

The hardest cross-platform problem on Linux:

- **X11**: Tauri v2's `global-shortcut` plugin works natively via XGrabKey.
- **Wayland**: Wayland's security model intentionally prevents apps from grabbing global hotkeys. The pragmatic solution for V1:
  - Expose a CLI command (`recall --toggle`) and/or D-Bus method that shows/hides the window.
  - Users bind their compositor's native hotkey mechanism to this command (e.g., `bindsym $mod+semicolon exec recall --toggle` in Sway).
  - Document this clearly for each major compositor.
  - This is the same approach used by Ulauncher, Albert, and other Linux launchers on Wayland.

### Content Model

Cheat sheets are standard markdown files with optional YAML frontmatter, stored in a known directory:

```
~/.config/recall/
  cheats/
    git.md
    docker.md
    vscode.md
    ...
  config.yaml
  app-mappings.yaml
```

Frontmatter schema:

```yaml
---
title: Git                        # display name (falls back to filename)
tags: [git, version-control, scm] # searchable aliases
icon: git                         # optional icon identifier
---
```

The body is standard markdown. H2 headings (`##`) define searchable sections. Code blocks are rendered with syntax highlighting and copy buttons.

### App Mapping Model

A separate YAML file maps detected window class/app names to cheat sheet filenames:

```yaml
mappings:
  - match: ["code", "Code", "visual studio code"]
    cheat: vscode
  - match: ["kitty", "alacritty", "foot", "iTerm2", "gnome-terminal"]
    cheat: terminal
  - match: ["Slack", "slack"]
    cheat: slack
```

Users can edit this file directly. The app watches it for changes.

### Ranking System

Search results are ranked by a weighted score:

- **Text relevance** (fuzzy match quality): weight 0.5
- **Access frequency** (how often this sheet/section has been opened): weight 0.3
- **Recency** (how recently accessed): weight 0.2

Access history is stored in a lightweight local JSON file (`~/.config/recall/history.json`), not a database.

### UI Architecture

The app has one window with two "views" (not routes — just conditional rendering):

1. **Palette View**: Search input + results list. Shown when secondary hotkey is pressed, or when primary hotkey fires and no app mapping is found.
2. **Sheet View**: Rendered cheat sheet with section navigation. Shown when a cheat sheet is selected from palette, or when primary hotkey matches a mapped app.

Transitions between views are instant (no animation). The window itself is a borderless, floating, always-on-top panel — roughly 600x500px, centered on screen.

---

## Testing Decisions

A good test for this project verifies **observable behavior from the user's perspective**, not internal implementation details. Tests should answer: "If I do X, does Y happen?"

### Modules to test

1. **Search engine**: Given a corpus of markdown files and a query string, does the ranker return the expected results in the expected order? This is pure input/output — highly testable.
2. **Markdown parser/indexer**: Given a markdown file with frontmatter, are the title, tags, and sections extracted correctly? Again, pure input/output.
3. **App mapping resolver**: Given a window class name and a mapping config, is the correct cheat sheet identified? Pure logic.
4. **Ranking algorithm**: Given access history and a set of search results, are they re-ranked correctly? Pure logic.
5. **Active window detection**: Integration test per backend — does the detector return a valid window name on the current platform? (Platform-specific, may need to be manual/CI-conditional.)

### What NOT to test in automation

- UI rendering (visual testing is fragile and low-ROI for this app)
- Global hotkey registration (OS-dependent, test manually)
- File watching (test manually; the watcher library handles this)

### Test tooling

- **Rust side**: `cargo test` with standard assertions.
- **JS/Svelte side**: `vitest` for unit tests on search, parsing, and ranking logic.

---

## Out of Scope (V1)

- **AI-powered search / natural language queries**: Valuable but adds complexity and dependencies. V2 feature.
- **Cloud sync**: No accounts, no servers, no network calls. Pure local app.
- **Team sharing / collaboration**: Out of scope. Users can share cheat sheets via git.
- **Plugin marketplace**: Community cheat sheets ship via a GitHub repo, not an in-app store.
- **macOS support in V1**: Linux is the primary target. macOS is an architectural consideration (don't make decisions that prevent it) but not a V1 deliverable.
- **Inline command execution**: Showing and copying commands is in scope. Running them is not.
- **Auto-updating**: Users install via package manager or download binary. Auto-update is V2.
- **Windows support**: Not a target. Ever, probably.

---

## Further Notes

### Name risk

"Windows Recall" is a controversial Microsoft feature (AI screenshot recording). The name "Recall" in the open-source dev tool space is different enough to avoid confusion, but worth monitoring. Alternative names to keep in back pocket: Snap, Flashback, Reflex, Crib.

### Content strategy is critical

The app ships with a `recall-cheats` directory of 20-30 curated cheat sheets covering the most common developer tools. These should be maintained in a separate public GitHub repository so the community can contribute. Suggested initial set:

git, docker, kubectl, vim, neovim, vscode, bash, zsh, tmux, ssh, curl, jq, awk, sed, grep, systemd, journalctl, npm, python, rust/cargo, make, linux-filesystem, permissions, networking

### Wayland is a first-class constraint, not an afterthought

Many Linux developers have moved to Wayland (Hyprland, Sway, GNOME 45+). The app must work on Wayland from V1, even if the integration mechanism differs (CLI toggle vs native hotkey). Treating Wayland as "we'll fix it later" would alienate a large chunk of the target audience.

### Performance budget

| Metric | Target |
|---|---|
| Time from hotkey to visible overlay | < 100ms perceived |
| Search latency per keystroke | < 10ms |
| Idle memory usage | < 50MB |
| Binary size | < 20MB |
| Startup to tray-ready | < 2 seconds |
