# Plan: Recall

> Source PRD: `./prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **App shell**: Tauri v2 (Rust backend + system WebView). Single borderless, always-on-top window that is shown/hidden — never created/destroyed after init.
- **Frontend**: Svelte 5 + Vite (no SvelteKit). Single-page app with conditional view rendering (palette vs sheet), not routes.
- **Content directory**: `~/.config/recall/cheats/*.md` — standard markdown with optional YAML frontmatter.
- **Config directory**: `~/.config/recall/` — contains `config.yaml`, `app-mappings.yaml`, `history.json`.
- **Search**: MiniSearch (JS-side) for V1. Index rebuilt on startup and on file change.
- **Markdown rendering**: `marked` + `shiki` (syntax highlighting with VS Code themes).
- **Active window detection**: Strategy pattern — separate backend per display server, selected at runtime. Shell-out approach for V1.
- **Global hotkey (X11)**: Tauri `global-shortcut` plugin.
- **Global hotkey (Wayland)**: CLI command `recall --toggle` that signals the running instance via IPC (Unix domain socket or D-Bus). User binds compositor hotkey to this command.
- **Styling**: Tailwind CSS 4. Dark/light themes via CSS custom properties, respecting `prefers-color-scheme`.
- **Fonts**: Inter (UI), JetBrains Mono (code blocks) — bundled, not loaded from CDN.

---

## Phase 1: Skeleton — hotkey opens and closes a window

**User stories**: 1, 5, 15, 16, 18

### What to build

A Tauri v2 app that starts in the system tray. Pressing a global hotkey shows a borderless, centered, floating window with a placeholder message. Pressing Escape hides it. On X11, the hotkey is registered natively via Tauri's plugin. On Wayland, a `recall --toggle` CLI command is provided that communicates with the running app instance over a Unix domain socket. The window is pre-created and hidden at startup (show/hide, not create/destroy) to meet the <100ms latency target.

This phase proves the hardest technical risks first: global hotkey registration, window management, Wayland IPC, and tray integration.

### Acceptance criteria

- [x] `cargo tauri dev` launches the app with a tray icon
- [x] Configured hotkey toggles a centered, borderless overlay window on X11
- [x] `recall --toggle` CLI command toggles the same window (works on both X11 and Wayland)
- [x] Escape key hides the window
- [x] Window appears in < 100ms from hotkey press (measured: ~20ms via CLI, sub-frame via hotkey)
- [x] App uses < 50MB private RAM while idle (measured: 49MB private dirty in debug build)
- [x] Closing the window returns focus to the previously focused application

---

## Phase 2: Markdown rendering — show a cheat sheet

**User stories**: 6, 7, 8, 14, 22

### What to build

When the window opens, it reads a hardcoded markdown file from the content directory and renders it with full styling: headings, code blocks with syntax highlighting, copy-to-clipboard buttons on code blocks, and collapsible sections (H2s). Dark and light themes are implemented, respecting the system preference. Fonts (Inter + JetBrains Mono) are bundled.

This phase proves the rendering pipeline end-to-end with a single file before adding search or context-awareness.

### Acceptance criteria

- [x] A markdown file from `~/.config/recall/cheats/` is rendered in the overlay window
- [x] Code blocks have syntax highlighting (via shiki)
- [x] Each code block has a copy button that copies the block contents to clipboard
- [x] H2 sections are collapsible (click to toggle)
- [x] Dark and light themes work and follow system `prefers-color-scheme`
- [x] Inter font for UI text, JetBrains Mono for code blocks
- [x] Long documents scroll smoothly within the overlay
- [x] The window remains within the performance budget (render complete in < 100ms)

---

## Phase 3: Search palette — find any cheat sheet

**User stories**: 2, 3, 10, 12, 13

### What to build

Replace the hardcoded file with a palette view: a search input at the top, a results list below. On startup, the app scans the cheats directory, parses frontmatter (title, tags), and builds a MiniSearch index. Typing in the search input fuzzy-matches against titles, tags, and H2 section headings. Arrow keys navigate results, Enter opens the selected cheat sheet in the sheet view. A "recently viewed" section appears when the search input is empty. Pinned cheats appear above search results.

The palette view and sheet view are two states of the same window. Backspace from an empty search in sheet view returns to palette. The entire interaction is keyboard-navigable.

### Acceptance criteria

- [x] All `.md` files in `~/.config/recall/cheats/` are indexed on startup
- [x] YAML frontmatter `title` and `tags` fields are parsed and searchable
- [x] H2 section headings within each file are independently searchable
- [x] Typing in the search input produces fuzzy-matched results in < 10ms
- [x] Arrow keys navigate the result list, Enter opens the selected sheet
- [x] Backspace on empty search input in sheet view returns to palette
- [x] Empty search input shows "recently viewed" items (persisted to `history.json`)
- [x] Pinned cheats (stored in config) appear above search results
- [x] Tab or Ctrl+K activates in-document search when a sheet is open (user story 11)

---

## Phase 4: Context awareness — detect the active app

**User stories**: 1, 17, 19, 20

### What to build

When the primary hotkey is pressed, the app detects the currently focused window's application name before showing the overlay. It looks up this name in `app-mappings.yaml`. If a mapping exists, the corresponding cheat sheet opens directly in sheet view (skipping the palette). If no mapping exists, the palette opens with the detected app name pre-filled in the search input.

Active window detection uses a strategy pattern: the Rust backend detects the display server at startup (X11 vs Wayland, and which compositor), then dispatches to the appropriate detection function. Double-pressing the primary hotkey within 500ms re-opens the last viewed cheat sheet.

### Acceptance criteria

- [x] On X11: active window class name is correctly detected via `xdotool`
- [x] On Wayland (Sway): active window app_id is correctly detected via `swaymsg`
- [x] On Wayland (Hyprland): active window class is correctly detected via `hyprctl`
- [x] On Wayland (GNOME): active window name is detected via D-Bus (best-effort)
- [x] `app-mappings.yaml` is read and used to resolve detected app → cheat sheet
- [x] If mapping found: sheet view opens directly for that cheat sheet
- [x] If no mapping found: palette opens with detected app name pre-filled
- [x] If detection fails entirely: palette opens empty (graceful degradation)
- [x] Double-press primary hotkey within 500ms re-opens last viewed sheet
- [x] Editing `app-mappings.yaml` is picked up without restart (re-read on every toggle)

---

## Phase 5: Ranking and history — results get smarter over time

**User stories**: 4, 12, 13

### What to build

Integrate a ranking system into search results. Every time a cheat sheet or section is opened, record the event in `history.json` (timestamp + cheat ID + section). Search results are re-ranked by a weighted score combining text relevance (0.5), access frequency (0.3), and recency (0.2). The "recently viewed" list in the palette is powered by this same history. Pinned items override ranking and always appear first.

### Acceptance criteria

- [ ] Opening a cheat sheet records an access event in `history.json`
- [ ] Search results are ranked by weighted score (relevance + frequency + recency)
- [ ] Frequently accessed sheets rank higher than less-used ones for equivalent match quality
- [ ] Recently accessed sheets rank higher than older ones for equivalent match quality
- [ ] "Recently viewed" list on empty search reflects actual usage history
- [ ] Pinned items always appear above ranked results
- [ ] History file is bounded (e.g., last 1000 events) to prevent unbounded growth
- [ ] Ranking feels noticeably "right" after a week of usage

---

## Phase 6: File watching and hot reload

**User stories**: 8, 9

### What to build

The app watches the `~/.config/recall/cheats/` directory for file changes (create, modify, delete) using Tauri's filesystem watcher. When a cheat sheet is added, modified, or removed, the search index is incrementally updated without restarting the app. If the currently displayed cheat sheet is modified, the view refreshes. Config files (`config.yaml`, `app-mappings.yaml`) are also watched and re-applied on change.

### Acceptance criteria

- [ ] Adding a new `.md` file to the cheats directory makes it searchable immediately
- [ ] Editing an existing `.md` file updates its indexed content and re-renders if currently viewed
- [ ] Deleting a `.md` file removes it from the index
- [ ] Editing `config.yaml` applies new settings without restart
- [ ] Editing `app-mappings.yaml` updates mappings without restart
- [ ] No file watching events cause UI flicker or performance degradation

---

## Phase 7: Polish and ship-readiness

**User stories**: 14, 15, 16, 18, 20, 21

### What to build

Final polish pass before public release:

- **Settings UI**: Minimal in-app settings accessible from tray menu — hotkey configuration, theme toggle, cheat directory path. Writes to `config.yaml`.
- **First-run experience**: On first launch, if cheats directory is empty, copy bundled default cheat sheets into it. Show a brief "welcome" overlay explaining the two hotkey modes.
- **Bundled cheat sheets**: Ship 20-30 curated sheets (git, docker, kubectl, vim, neovim, vscode, bash, zsh, tmux, ssh, curl, jq, npm, python, cargo, make, linux-fs, permissions, networking, systemd).
- **Tray menu**: Open palette, open current app cheat, settings, quit.
- **Focus return**: After dismissing the overlay, focus returns to the previously active window reliably.
- **Performance audit**: Profile and optimize to meet all performance budget targets.
- **Packaging**: Provide `.deb`, `.AppImage`, and AUR PKGBUILD. Tauri v2's bundler handles deb and AppImage natively.

### Acceptance criteria

- [ ] First launch populates cheats directory with bundled default sheets
- [ ] Welcome overlay explains usage on first launch (dismissable, never shown again)
- [ ] Tray menu has: Open Palette, Open Current App Cheat, Settings, Quit
- [ ] Settings UI allows changing: hotkey binding, theme, cheats directory path
- [ ] 20+ bundled cheat sheets are included and well-formatted
- [ ] Focus returns to previous window after Escape
- [ ] Open/close 100 times without UI glitch or memory leak
- [ ] Hotkey latency < 100ms (profiled on real hardware)
- [ ] Idle memory < 50MB (measured)
- [ ] Binary size < 20MB
- [ ] `.deb` and `.AppImage` packages build successfully
- [ ] README with installation instructions, usage guide, and contribution guidelines
