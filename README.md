# Recall

**Instant recall for the tools you use every day.**

A lightweight, keyboard-driven desktop overlay that gives you searchable, beautifully rendered cheat sheets — without leaving your current context.

Press a hotkey → see your cheat sheet → press Escape → back to work. The whole loop takes under 3 seconds.

## Features (planned)

- **Global hotkey** to summon the overlay instantly
- **Context-aware**: detects your active app and shows the relevant cheat sheet
- **Command palette** with fuzzy search across all cheat sheets
- **Markdown-based**: cheat sheets are plain `.md` files you can edit with any tool
- **Copy buttons** on every code block
- **Keyboard-first**: navigate entirely without a mouse
- **Dark & light themes** that follow your system preference

## Prerequisites

### Rust

Install via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### System dependencies (Ubuntu/Debian)

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

### Node.js

Node.js 22+ and npm 10+ are required. The frontend build uses Vite.

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

## Project structure

```
├── src/                    # Svelte 5 frontend
│   ├── App.svelte          # Root component
│   ├── main.ts             # Entry point
│   ├── app.css             # Global styles + Tailwind
│   └── lib/                # Shared modules and tests
├── src-tauri/              # Tauri v2 Rust backend
│   ├── src/
│   │   ├── lib.rs          # App setup, global shortcut, commands
│   │   └── main.rs         # Entry point
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
| Search | MiniSearch (planned) | Fast JS fuzzy search, good enough for <200 files |
| Markdown | marked + shiki (planned) | VS Code-quality syntax highlighting |

## License

MIT
