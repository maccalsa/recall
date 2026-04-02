# Recall

**Instant recall for the tools you use every day.**

A lightweight, keyboard-driven desktop overlay that gives you searchable, beautifully rendered cheat sheets — without leaving your current context.

Press a hotkey → see your cheat sheet → press Escape → back to work. The whole loop takes under 3 seconds.

## Features

- **Global hotkey** to summon the overlay instantly
- **Context-aware**: detects your active app and shows the relevant cheat sheet
- **Command palette** with fuzzy search across all cheat sheets
- **Markdown-based**: cheat sheets are plain `.md` files you can edit with any tool
- **Syntax highlighting** via shiki (VS Code–quality, dark + light themes)
- **Copy buttons** on every code block
- **Collapsible sections** for scannable long documents
- **In-document search** (Ctrl+K) with match navigation
- **Keyboard-first**: navigate entirely without a mouse
- **Dark & light themes** that follow your system preference

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

Changes are picked up on the next hotkey press — no restart needed.

## Project structure

```
├── src/                    # Svelte 5 frontend
│   ├── App.svelte          # Root component (view state machine)
│   ├── main.ts             # Entry point + font imports
│   ├── app.css             # Global styles + Tailwind + themes
│   └── lib/
│       ├── SheetView.svelte    # Rendered cheat sheet with copy buttons
│       ├── PaletteView.svelte  # Search palette with keyboard nav
│       ├── markdown.ts         # marked + shiki rendering pipeline
│       ├── search.ts           # MiniSearch indexing
│       ├── history.ts          # Recently viewed + pinned cheats
│       └── *.test.ts           # Tests
├── src-tauri/              # Tauri v2 Rust backend
│   ├── src/
│   │   ├── lib.rs          # App setup, hotkey, IPC, Tauri commands
│   │   ├── context.rs      # Active window detection + app mapping
│   │   └── main.rs         # CLI entry point (--toggle, --help)
│   ├── capabilities/       # Tauri v2 permission capabilities
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
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
| Fonts | Inter + JetBrains Mono | Bundled, no CDN dependency |

## License

MIT
