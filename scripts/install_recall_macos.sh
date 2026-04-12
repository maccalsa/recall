#!/usr/bin/env bash
# Install Recall from a GitHub release DMG into ~/Applications.
# Prerequisite: CI must publish macOS DMGs (add "dmg" to bundle.targets in src-tauri/tauri.conf.json).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=install_recall.env
source "${SCRIPT_DIR}/install_recall.env"

VERSION="${RECALL_VERSION}"
APP_NAME="${RECALL_APP_NAME}"
APP_ID="${RECALL_APP_ID}"
GITHUB_REPO="${RECALL_GITHUB_REPO}"

# Override if you ship a universal binary: RECALL_TAURI_ARCH=universal ./install_recall_macos.sh
RECALL_TAURI_ARCH="${RECALL_TAURI_ARCH:-}"

USER_APPS="${HOME}/Applications"
APP_BUNDLE="${USER_APPS}/${APP_NAME}.app"

ACTION="${1:-install}"
ENABLE_AUTOSTART="${2:-false}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

detect_tauri_arch() {
  if [[ -n "${RECALL_TAURI_ARCH}" ]]; then
    echo "${RECALL_TAURI_ARCH}"
    return
  fi
  case "$(uname -m)" in
    arm64) echo aarch64 ;;
    x86_64) echo x86_64 ;;
    *)
      echo "Unsupported Mac architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac
}

download_file() {
  local url="$1"
  local out="$2"
  echo "Downloading: ${url}"
  curl -L --fail --output "${out}" "${url}"
}

release_dmg_url() {
  local arch="$1"
  local name="${APP_NAME}_${VERSION}_${arch}.dmg"
  echo "https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${name}"
}

install_from_dmg() {
  need_cmd curl
  need_cmd hdiutil

  local arch tmp_dmg mount_point
  arch="$(detect_tauri_arch)"
  tmp_dmg="$(mktemp "${TMPDIR:-/tmp}/${APP_ID}.XXXXXX")"
  mount_point="$(mktemp -d /tmp/recall-mount.XXXXXX)"

  cleanup() {
    hdiutil detach "${mount_point}" -quiet 2>/dev/null || true
    rmdir "${mount_point}" 2>/dev/null || true
    rm -f "${tmp_dmg}"
  }
  trap cleanup EXIT

  download_file "$(release_dmg_url "${arch}")" "${tmp_dmg}"

  hdiutil attach -nobrowse -mountpoint "${mount_point}" "${tmp_dmg}"

  local src_app="${mount_point}/${APP_NAME}.app"
  if [[ ! -d "${src_app}" ]]; then
    src_app=""
    for candidate in "${mount_point}"/*.app; do
      if [[ -d "${candidate}" ]]; then
        src_app="${candidate}"
        break
      fi
    done
  fi
  if [[ -z "${src_app}" || ! -d "${src_app}" ]]; then
    echo "Could not find ${APP_NAME}.app inside the DMG." >&2
    exit 1
  fi

  mkdir -p "${USER_APPS}"
  if [[ -d "${APP_BUNDLE}" ]]; then
    rm -rf "${APP_BUNDLE}"
  fi
  cp -R "${src_app}" "${APP_BUNDLE}"

  if [[ "${ENABLE_AUTOSTART}" == "true" ]]; then
    need_cmd osascript
    enable_login_item
  fi

  trap - EXIT
  cleanup

  echo
  echo "Installed ${APP_NAME} to ${APP_BUNDLE}"
  echo "Launch: open -a \"${APP_NAME}\""
  echo "If macOS blocks the app (unsigned build), use: System Settings → Privacy & Security → Open Anyway."
}

enable_login_item() {
  local path_abs
  path_abs="$(cd "$(dirname "${APP_BUNDLE}")" && pwd)/$(basename "${APP_BUNDLE}")"
  if osascript <<EOF >/dev/null 2>&1
tell application "System Events" to make login item at end with properties {path:"${path_abs}", hidden:false}
EOF
  then
    echo "Login Item enabled for ${APP_NAME}"
  else
    echo "Could not add Login Item (grant Automation for Terminal/iTerm or run the script from a permitted app)." >&2
    echo "You can add ${APP_NAME} manually: System Settings → General → Login Items." >&2
  fi
}

remove_login_items_for_app() {
  osascript -e "tell application \"System Events\" to delete every login item whose name is \"${APP_NAME}\"" \
    >/dev/null 2>&1 || true
}

uninstall_app() {
  remove_login_items_for_app
  if [[ -d "${APP_BUNDLE}" ]]; then
    rm -rf "${APP_BUNDLE}"
    echo "Removed ${APP_BUNDLE}"
  else
    echo "Nothing to remove at ${APP_BUNDLE}"
  fi
}

usage() {
  cat <<EOF
Usage: $0 [install|uninstall|upgrade] [true|false]

  install   Download the release DMG for this Mac's architecture and copy ${APP_NAME}.app to:
 ${USER_APPS}
  upgrade   Same as install (replaces an existing app).
  uninstall Remove ${APP_BUNDLE} and Recall login items.

  Second argument (optional): true to add a Login Item (autostart), false to skip (default).

Environment:
  RECALL_TAURI_ARCH   Force bundle arch label in the DMG filename (e.g. universal) instead of auto-detect.
  (Version and repo: ${SCRIPT_DIR}/install_recall.env)

Examples:
  $0 install false
  $0 install true
  $0 uninstall
EOF
}

case "${ACTION}" in
  install | upgrade)
    if [[ "${ENABLE_AUTOSTART}" != "true" && "${ENABLE_AUTOSTART}" != "false" ]]; then
      echo "Autostart must be true or false (got: ${ENABLE_AUTOSTART})" >&2
      usage
      exit 1
    fi
    if [[ -n "${3:-}" ]]; then
      echo "Unexpected extra arguments" >&2
      usage
      exit 1
    fi
    install_from_dmg
    ;;
  uninstall)
    if [[ -n "${2:-}" ]]; then
      echo "Unexpected argument after uninstall: $2" >&2
      usage
      exit 1
    fi
    uninstall_app
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
