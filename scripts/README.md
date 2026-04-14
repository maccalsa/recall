# Install scripts

End-user helpers to install Recall from [GitHub releases](https://github.com/maccalsa/recall/releases). They share metadata in `install_recall.env`.

## Before you run anything

1. **Version** — Set `RECALL_VERSION` in `install_recall.env` to match `src-tauri/tauri.conf.json` → `"version"`, and ensure that tag exists on GitHub with the matching assets.
2. **Linux assets** — AppImage and `.deb` names follow Tauri: `Recall_<version>_amd64.AppImage` and `Recall_<version>_amd64.deb`.
3. **macOS** — The DMG flow expects `Recall_<version>_<arch>.dmg`. The **Release** workflow (`.github/workflows/release.yml`) builds a **DMG on `macos-latest`** (Apple Silicon, so **`aarch64`**) and uploads it next to the Linux bundles. Intel-only Macs need a separate `x86_64` build or a universal binary if you add that to CI later.

## `install_recall.env`

| Variable | Purpose |
|----------|---------|
| `RECALL_VERSION` | Release tag `v$RECALL_VERSION` and artifact filenames |
| `RECALL_APP_NAME` | Display/product name (default `Recall`) |
| `RECALL_APP_ID` | Short id for paths (default `recall`) |
| `RECALL_GITHUB_REPO` | `owner/repo` for download URLs |
| `RECALL_DEB_PACKAGE` | Debian package name for `apt remove` on uninstall (default `recall`) |

Override `RECALL_DEB_PACKAGE` if your `.deb` installs under a different package name.

## Linux — `install_recall.sh`

**Needs:** `curl`. For `.deb`: `sudo` and `apt`. For AppImage on Debian/Ubuntu, the script may run `sudo apt install libfuse2` when FUSE2 is missing.

Make executable once: `chmod +x install_recall.sh`

```bash
./install_recall.sh # install AppImage, no autostart
./install_recall.sh install appimage true
./install_recall.sh install deb false
./install_recall.sh upgrade deb
./install_recall.sh uninstall
./install_recall.sh help
```

**Autostart** uses XDG: copies the `.desktop` entry to `~/.config/autostart/` when you pass `true`.

**Uninstall** removes the user-local AppImage layout (`~/.local/bin`, `~/.local/share/recall`, menu and autostart entries) and runs `apt remove` on `RECALL_DEB_PACKAGE` if that package is installed.

## macOS — `install_recall_macos.sh`

**Needs:** `curl`, `hdiutil` (system). For autostart: `osascript` (may prompt for Automation).

```bash
./install_recall_macos.sh install false
./install_recall_macos.sh install true    # Login Item
./install_recall_macos.sh upgrade false
./install_recall_macos.sh uninstall
```

**Environment**

- `RECALL_TAURI_ARCH` — Force the arch segment in the DMG filename (e.g. `universal`) instead of inferring from `uname -m`.

The app is copied to `~/Applications/Recall.app`. Unsigned builds may require **System Settings → Privacy & Security → Open Anyway** the first time.

## Autostart vs systemd

These scripts are the supported way to install and optionally start Recall with the graphical session (XDG autostart on Linux, Login Items on macOS). A systemd user unit is **not** recommended for this GUI app (session, Wayland vs X11, and hard-coded `DISPLAY` are easy to get wrong), so unit files are not shipped here.
