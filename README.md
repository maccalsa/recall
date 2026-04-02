# Recall

**Instant recall for the tools you use every day.**

A lightweight, keyboard-driven desktop overlay that gives you searchable, beautifully rendered cheat sheets — without leaving your current context.

Press a hotkey → see your cheat sheet → press Escape → back to work. The whole loop takes under 3 seconds.

## Features

- **Global hotkey** to summon the overlay instantly
- **Context-aware**: detects your active app and shows the relevant cheat sheet
- **Command palette** with fuzzy search across all cheat sheets
- **Smart ranking**: results improve based on your usage history (frequency + recency)
- **Markdown-based**: cheat sheets are plain `.md` files you can edit with any tool
- **Hot reload**: edit cheat sheets on disk and see changes immediately — no restart needed
- **Syntax highlighting** via shiki (VS Code–quality, dark + light themes)
- **Copy buttons** on every code block
- **Collapsible sections** for scannable long documents
- **In-document search** (Ctrl+K) with match navigation
- **Keyboard-first**: navigate entirely without a mouse
- **Dark & light themes** that follow your system preference
- **24 bundled cheat sheets** for common developer tools
- **First-run experience** with guided setup
- **Settings UI** accessible from the system tray
- **Tray menu**: Open Palette, Open Current App Cheat, Settings, Quit

## Prerequisites

### Rust

Install via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Node.js

Node.js 22+ and npm 10+ are required. The frontend build uses Vite.

### System dependencies (Ubuntu/Debian)

Build dependencies for Tauri v2:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libxdo-dev \
  libssl-dev \
  build-essential \
  curl \
  wget \
  file
```

### Runtime dependencies (active window detection)

Recall detects the currently focused application to show context-aware cheat sheets. Install the tools for your display server:

**X11** (most Linux desktops, including Pop!_OS, Ubuntu with Xorg):

```bash
sudo apt-get install -y xdotool x11-utils
```

- `xdotool` — queries the active window ID
- `x11-utils` — provides `xprop` to read the window class name

**Wayland (Sway)**:

No extra install needed — `swaymsg` ships with Sway.

**Wayland (Hyprland)**:

No extra install needed — `hyprctl` ships with Hyprland.

**Wayland (GNOME)**:

No extra install needed — `gdbus` ships with GNOME. Detection uses `org.gnome.Shell.Eval` (best-effort; may not work on all GNOME versions).

> If none of these tools are available, Recall still works — it gracefully falls back to the search palette without context awareness.

## Installation

### From source

```bash
git clone https://github.com/youruser/recall.git
cd recall
npm install
npm run tauri build
```

Built packages will be in `src-tauri/target/release/bundle/`:
- `.deb` package: `src-tauri/target/release/bundle/deb/`
- `.AppImage`: `src-tauri/target/release/bundle/appimage/`

### Install .deb

```bash
sudo dpkg -i recall_0.1.0_amd64.deb
```

### Run AppImage

```bash
chmod +x Recall_0.1.0_amd64.AppImage
./Recall_0.1.0_amd64.AppImage
```

## Development

```bash
# Install JS dependencies
npm install

# Run the Tauri dev server (hot-reloading frontend + Rust backend)
npm run tauri dev

# Run frontend only (no Tauri shell, useful for UI work)
npm run dev
```

## Testing

```bash
# Run JS tests
npm run test

# Run Rust tests
cd src-tauri && cargo test

# Type-check Svelte/TypeScript
npm run check

# Check formatting
npm run format:check

# Rust checks (from src-tauri/)
cd src-tauri
cargo check
cargo clippy
cargo fmt --check
```

## Usage

### First launch

On first launch, Recall copies 24 bundled cheat sheets to `~/.config/recall/cheats/` and shows a welcome overlay explaining the two hotkey modes.

### Hotkeys

| Hotkey | Action |
|---|---|
| `Ctrl+Shift+R` | Toggle overlay (context-aware — detects your active app) |
| `Escape` | Hide overlay |
| `↑` / `↓` | Navigate palette results |
| `Enter` | Open selected sheet |
| `Backspace` | Return to palette from sheet view |
| `Ctrl+K` or `Tab` | Search within current sheet |
| Double-press hotkey | Re-open last viewed sheet |

### Wayland hotkey setup

On Wayland, bind your compositor's native hotkey to the CLI toggle command:

**Sway**:
```
bindsym $mod+semicolon exec recall --toggle
```

**Hyprland**:
```
bind = $mainMod, semicolon, exec, recall --toggle
```

### Tray menu

Right-click (or left-click) the tray icon for:
- **Open Palette** — search all cheat sheets
- **Open Current App Cheat** — show cheat sheet for your focused app
- **Settings** — configure hotkey, theme, cheats directory, pinned sheets
- **Quit**

## Configuration

Recall reads its config from `~/.config/recall/`:

```
~/.config/recall/
  cheats/              # Markdown cheat sheets (*.md)
  app-mappings.yaml    # Maps window class → cheat sheet
  config.json          # Pinned sheets, preferences
  history.json         # Recently viewed (auto-managed)
```

### App mappings

Edit `~/.config/recall/app-mappings.yaml` to control which cheat sheet opens for each app:

```yaml
mappings:
  - match: ["code", "Code", "cursor", "Cursor"]
    cheat: vscode
  - match: ["kitty", "alacritty", "gnome-terminal"]
    cheat: bash
  - match: ["vim", "nvim"]
    cheat: vim
```

Changes are picked up immediately via file watching — no restart needed.

### Cheat sheet format

Cheat sheets are standard markdown files with optional YAML frontmatter:

```markdown
---
title: Git
tags: [git, version-control, scm]
---

# Git

## Branching

\`\`\`bash
git branch feature-x
git checkout -b feature-x
\`\`\`
```

### Hot reload

All files are watched for changes:
- **Cheat sheets** (`.md` files): adding, editing, or deleting a file updates the search index immediately. If the modified sheet is currently displayed, it refreshes automatically.
- **Config files** (`config.json`, `app-mappings.yaml`): changes are applied without restart.

## Bundled cheat sheets

Recall ships with 24 curated cheat sheets:

| Sheet | Topics |
|---|---|
| git | Branching, staging, merging, stashing, remotes, undo |
| docker | Images, containers, volumes, networks, compose |
| kubectl | Pods, deployments, services, logs, namespaces |
| vim | Modes, navigation, editing, search, macros |
| vscode | Shortcuts, navigation, editing, terminal, debug |
| bash | Navigation, file ops, text processing, variables |
| zsh | Globbing, history, parameter expansion, completion |
| tmux | Sessions, windows, panes, copy mode |
| ssh | Keys, config, tunneling, SCP, agent |
| curl | HTTP requests, auth, headers, cookies |
| jq | JSON filtering, arrays, objects, functions |
| npm | Install, scripts, publish, workspaces |
| python | Data types, functions, classes, file I/O |
| rust-cargo | Build, test, deps, publish, patterns |
| make | Variables, rules, phony targets, patterns |
| systemd | Services, journalctl, timers, unit files |
| grep | Regex, context, ripgrep, file filtering |
| sed | Substitution, delete, in-place editing |
| awk | Fields, patterns, functions, arrays |
| regex | Syntax, quantifiers, groups, lookahead |
| linux-filesystem | Directory structure, disk usage, find |
| permissions | chmod, chown, SUID/SGID, ACLs |
| networking | IP, DNS, ports, firewall, troubleshooting |
| tar-compression | tar, gzip, bzip2, xz, zip |

## Project structure

```
├── src/                    # Svelte 5 frontend
│   ├── App.svelte          # Root component (view state machine)
│   ├── main.ts             # Entry point + font imports
│   ├── app.css             # Global styles + Tailwind + themes
│   └── lib/
│       ├── SheetView.svelte    # Rendered cheat sheet with copy buttons
│       ├── PaletteView.svelte  # Search palette with keyboard nav
│       ├── SettingsView.svelte # Settings UI
│       ├── WelcomeView.svelte  # First-run welcome overlay
│       ├── markdown.ts         # marked + shiki rendering pipeline
│       ├── search.ts           # MiniSearch indexing + incremental updates
│       ├── history.ts          # Recently viewed + pinned cheats
│       └── *.test.ts           # Tests
├── src-tauri/              # Tauri v2 Rust backend
│   ├── src/
│   │   ├── lib.rs          # App setup, hotkey, IPC, Tauri commands
│   │   ├── context.rs      # Active window detection + app mapping
│   │   ├── watcher.rs      # File watching (cheats + config hot reload)
│   │   └── main.rs         # CLI entry point (--toggle, --help)
│   ├── capabilities/       # Tauri v2 permission capabilities
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── bundled-cheats/         # Default cheat sheets (copied on first run)
├── plans/                  # Implementation plans
├── prd.md                  # Product requirements document
├── index.html              # HTML shell
├── vite.config.ts          # Vite configuration
└── package.json            # JS dependencies and scripts
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App shell | Tauri v2 (Rust) | ~10MB binary, ~30MB RAM, native global shortcuts |
| Frontend | Svelte 5 + Vite | Compiles to vanilla JS, smallest bundle, no runtime |
| Styling | Tailwind CSS 4 | Utility-first, tree-shaken, fast |
| Search | MiniSearch | Fast JS fuzzy search with prefix + fuzzy matching |
| Markdown | marked + shiki | VS Code-quality syntax highlighting with dual themes |
| File watching | notify (Rust) | Debounced inotify-based watching for hot reload |
| Fonts | Inter + JetBrains Mono | Bundled, no CDN dependency |
| Packaging | Tauri bundler | .deb and .AppImage out of the box |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Add your cheat sheets to `bundled-cheats/` or make code changes
4. Run tests (`npm test && cd src-tauri && cargo test`)
5. Run type checks (`npm run check`)
6. Submit a pull request

### Adding a cheat sheet

Create a `.md` file in `bundled-cheats/` with YAML frontmatter:

```yaml
---
title: My Tool
tags: [my-tool, alias1, alias2]
---
```

Use `##` headings for sections (they become collapsible and independently searchable).

## License

MIT
